/**
 * ContentApprovalService.js
 *
 * @description :: Hybrid service for validating and auto-approving content submissions.
 * Uses rule-based scoring and Gemini AI for final decision.
 */

module.exports = {

  /**
   * Compares content against a set of rules and returns a score.
   */
  getRuleBasedScore: function(content) {
    let score = 0;
    const checks = {
      completeness: 0,
      structure: 0,
      quality: 0,
      media: 0
    };
    const issues = [];
    const reasons = [];

    // 1. Completeness (0-30)
    if (content.title && content.title.length > 5) {
      checks.completeness += 10;
    } else {
      issues.push('Title is missing or too short');
    }

    if (content.description && content.description.length > 20) {
      checks.completeness += 20;
    } else {
      issues.push('Description is missing or too short');
    }

    // 2. Structure (0-30)
    if (content.type === 'guide') {
      if (content.steps && content.steps.length > 0) {
        checks.structure += 15;
        const usefulSteps = content.steps.filter(s => s.title && s.description);
        if (usefulSteps.length === content.steps.length) {
          checks.structure += 15;
        } else {
          issues.push('Some guide steps are missing title or description');
        }
      } else {
        issues.push('Guide content must have at least one step');
      }
    } else {
      checks.structure += 30; // General content doesn't need steps
    }

    // 3. Quality / Placeholder checks (0-20)
    const placeholders = ['TODO', 'TEST', 'LOREM IPSUM', 'ASDF', '12345'];
    const textToCheck = `${content.title} ${content.description}`.toUpperCase();
    const hasPlaceholders = placeholders.some(p => textToCheck.includes(p));
    
    if (!hasPlaceholders) {
      checks.quality += 20;
    } else {
      issues.push('Content contains placeholders or test data');
    }

    // 4. Media (0-20)
    if (content.media && content.media.length > 0) {
      checks.media += 20;
    } else {
      issues.push('No media attached to content');
    }

    score = checks.completeness + checks.structure + checks.quality + checks.media;
    
    let decision = 'manual_review';
    if (score >= 90) {decision = 'approve';}
    if (score < 40) {decision = 'reject';}

    return {
      score,
      decision,
      checks,
      issues,
      reasons
    };
  },

  /**
   * Compactor to limit tokens sent to AI.
   */
  compactContent: function(content) {
    return {
      title: content.title,
      description: content.description ? content.description.substring(0, 800) : '',
      type: content.type,
      steps: (content.steps || []).slice(0, 8).map(s => ({
        title: s.title,
        description: s.description ? s.description.substring(0, 250) : ''
      })),
      mediaCount: (content.media || []).length,
      mediaTypes: (content.media || []).map(m => m.type || 'unknown')
    };
  },

  /**
   * AI analysis using Gemini.
   */
  analyzeWithAI: async function(content) {
    if (!sails.services.geminiservice || !sails.services.geminiservice.isAvailable()) {
      return null;
    }

    const compacted = this.compactContent(content);
    const prompt = `
      Analyze the following content submission for a professional knowledge platform.
      Rules:
      - Reject if it contains offensive content, gibberish, or obvious test data.
      - Flag for manual review if it seems incomplete or low quality.
      - Approve if it is well-structured and helpful.

      Content:
      ${JSON.stringify(compacted)}

      Return ONLY a JSON object with:
      {
        "score": number (0-100),
        "decision": "approve" | "manual_review" | "reject",
        "reasons": string[],
        "safety": "safe" | "unsafe"
      }
    `;

    try {
      const response = await sails.services.geminiservice.generateText(prompt, {
        temperature: 0.1,
        maxOutputTokens: 500,
        responseMimeType: 'application/json'
      });

      if (response.success) {
        return response.data;
      }
    } catch (err) {
      sails.log.error('AI Analysis failed:', err);
    }
    return null;
  },

  /**
   * Main entry point for the auto-approval background task.
   * Processes pending content and applies decision logic.
   * @param {string} [targetId] - Optional ID to process a specific content item immediately.
   */
  runAutoApproval: async function(targetId) {
    const now = Date.now();
    try {
      // Build query criteria
      const criteria = { status: 'pending' };
      
      if (targetId) {
        criteria.id = targetId;
      } else {
        // Normal background run: Only items past deadline OR items never reviewed by system
        criteria.or = [
          { reviewDeadlineAt: { '<=': now } },
          { autoReview: null },
          { autoReview: { reviewedAt: null } }
        ];
      }

      const pendingContent = await sails.models.content.find(criteria).limit(targetId ? 1 : 20);

      if (pendingContent.length === 0) {return;}

      const AUTO_APPROVAL_MIN_SCORE = process.env.AUTO_APPROVAL_MIN_SCORE ? parseInt(process.env.AUTO_APPROVAL_MIN_SCORE) : 85;
      const AUTO_APPROVAL_REJECT_SCORE = process.env.AUTO_APPROVAL_REJECT_SCORE ? parseInt(process.env.AUTO_APPROVAL_REJECT_SCORE) : 40;

      for (const content of pendingContent) {
        // Skip if already reviewed by system and failed before (redundancy check)
        if (content.autoReview && content.autoReview.reviewedAt && !content.updatedAt) {
          continue;
        }

        const ruleResult = this.getRuleBasedScore(content);
        let finalResult = { ...ruleResult };

        // Only call AI if rules pass basic threshold
        if (ruleResult.score >= 50) {
          const aiResult = await this.analyzeWithAI(content);
          if (aiResult) {
            // Combine scores: 40% Rules, 60% AI
            const combinedScore = Math.round((ruleResult.score * 0.4) + (aiResult.score * 0.6));
            finalResult.score = combinedScore;
            finalResult.reasons = [...(finalResult.reasons || []), ...(aiResult.reasons || [])];
            
            if (combinedScore >= AUTO_APPROVAL_MIN_SCORE) {
              finalResult.decision = 'approve';
            } else if (combinedScore < AUTO_APPROVAL_REJECT_SCORE) {
              finalResult.decision = 'reject';
            } else {
              finalResult.decision = 'manual_review';
            }
          }
        }

        finalResult.reviewedAt = Date.now();

        const updateData = {
          autoReview: finalResult
        };

        if (finalResult.decision === 'approve' || (content.reviewDeadlineAt <= now && finalResult.score >= 60)) {
          updateData.status = 'approved';
          updateData.approvedBy = 'system';
          
          if (finalResult.decision !== 'approve') {
            finalResult.decision = 'approve';
            finalResult.reasons.push('Auto-approved after review deadline reached.');
          }
          
          await sails.models.notification.create({
            title: 'Content Auto-Approved',
            message: `Your content "${content.title}" was automatically approved by the system.`,
            type: 'success',
            user: content.createdBy,
            link: `/content/${content.id}`
          });

          if (sails.services.auditservice) {
            await sails.services.auditservice.log(null, {
              action: 'content.auto_approved',
              target: content.id,
              targetType: 'Content',
              targetLabel: content.title
            });
          }
        } else if (finalResult.decision === 'reject' && ruleResult.score < 30) {
          // Only auto-reject if score is very low
          updateData.status = 'rejected';
          updateData.rejectionReason = 'Auto-rejected: Low quality or structural issues.';
          
          await sails.models.notification.create({
            title: 'Content Rejected',
            message: `Your content "${content.title}" was automatically rejected due to quality standards.`,
            type: 'error',
            user: content.createdBy,
            link: `/content/${content.id}/edit`
          });

          if (sails.services.auditservice) {
            await sails.services.auditservice.log(null, {
              action: 'content.auto_rejected',
              target: content.id,
              targetType: 'Content',
              targetLabel: content.title
            });
          }
        } else {
          // Keep as pending but mark that it needs manual review
          updateData.needsManualReview = true;
          
          if (sails.services.auditservice) {
            await sails.services.auditservice.log(null, {
              action: 'content.auto_review_required',
              target: content.id,
              targetType: 'Content',
              targetLabel: content.title
            });
          }
        }

        await sails.models.content.updateOne({ id: content.id }).set(updateData);
        sails.log.info(`Auto-review completed for ${content.id}: ${finalResult.decision} (Score: ${finalResult.score})`);
      }
    } catch (err) {
      sails.log.error('Error during runAutoApproval:', err);
    }
  }
};
