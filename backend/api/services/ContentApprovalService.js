/**
 * ContentApprovalService.js
 *
 * @description :: Hybrid service for validating and auto-approving content submissions.
 * Uses rule-based scoring and Gemini AI for final decision.
 */

module.exports = {

  /**
   * Validates PDF/file URL format
   */
  validateFileUrl: function(fileUrl) {
    if (!fileUrl || typeof fileUrl !== 'string') return false;
    try {
      // Check if it's a valid URL
      new URL(fileUrl);
      // Check for common PDF/doc extensions
      const validExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
      const lowerUrl = fileUrl.toLowerCase();
      return validExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes('drive.google.com') || lowerUrl.includes('dropbox');
    } catch (e) {
      return false;
    }
  },

  /**
   * Validates step quality for guides
   */
  validateSteps: function(steps) {
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return { valid: false, count: 0, quality: 0 };
    }
    
    const validSteps = steps.filter(s => 
      s.title && s.title.trim().length > 3 && 
      s.description && s.description.trim().length > 10
    );
    
    const avgStepLength = validSteps.reduce((sum, s) => sum + (s.description.length || 0), 0) / Math.max(validSteps.length, 1);
    const quality = Math.min(100, Math.round((validSteps.length / steps.length) * 100 + (avgStepLength / 500) * 50));
    
    return {
      valid: validSteps.length === steps.length,
      count: validSteps.length,
      total: steps.length,
      quality: quality,
      hasImages: steps.some(s => s.image || s.imageUrl)
    };
  },

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
      const stepValidation = this.validateSteps(content.steps);
      if (stepValidation.count > 0) {
        checks.structure += 10;
        // Award points based on step quality
        if (stepValidation.valid) {
          checks.structure += 10; // All steps well-formed
        } else {
          checks.structure += Math.round((stepValidation.count / stepValidation.total) * 10);
          issues.push(`${stepValidation.total - stepValidation.count} step(s) have missing or insufficient content`);
        }
        // Bonus for step quality
        if (stepValidation.quality >= 80) {
          checks.structure += 10;
          reasons.push(`Strong step quality (${stepValidation.count} well-structured steps)`);
        } else if (stepValidation.quality >= 60) {
          checks.structure += 5;
          reasons.push(`Adequate step quality (${stepValidation.count} steps)`);
        }
        if (stepValidation.hasImages) {
          reasons.push('Steps include reference images');
        }
      } else {
        issues.push('Guide content must have at least one step with meaningful content');
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

    // 4. Media (0-20) - Check for media array, videoId, or fileUrl
    const hasMediaArray = content.media && content.media.length > 0;
    const hasVideoId = content.videoId && typeof content.videoId === 'string' && content.videoId.length > 0;
    const validFileUrl = this.validateFileUrl(content.fileUrl);
    
    let mediaQuality = [];
    if (hasMediaArray) {
      checks.media += 8;
      mediaQuality.push(`${content.media.length} media file(s)`);
    }
    if (hasVideoId) {
      checks.media += 8;
      mediaQuality.push('YouTube video');
    }
    if (validFileUrl) {
      checks.media += 4;
      mediaQuality.push('PDF/document');
    }
    
    if (mediaQuality.length > 0) {
      reasons.push(`Media included: ${mediaQuality.join(', ')}`);
    } else {
      issues.push('No media attached to content (add video, PDF, or images)');
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
    const stepValidation = this.validateSteps(content.steps);
    const fileUrlValid = this.validateFileUrl(content.fileUrl);
    
    return {
      title: content.title,
      description: content.description ? content.description.substring(0, 800) : '',
      type: content.type,
      steps: (content.steps || []).slice(0, 8).map(s => ({
        title: s.title,
        description: s.description ? s.description.substring(0, 250) : ''
      })),
      stepsMetrics: {
        count: stepValidation.count,
        total: stepValidation.total,
        quality: stepValidation.quality,
        hasImages: stepValidation.hasImages
      },
      mediaCount: (content.media || []).length,
      mediaTypes: (content.media || []).map(m => m.type || 'unknown'),
      hasVideoId: !!content.videoId,
      hasFileUrl: fileUrlValid,
      videoId: content.videoId || null,
      fileUrl: fileUrlValid ? content.fileUrl : null
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
          
          // CREATE GUIDE FROM APPROVED CONTENT
          try {
            if (content.type === 'guide' || content.type === 'article' || content.type === 'tutorial') {
              const guide = await sails.models.guide.create({
                product: content.product,
                title: content.title,
                difficulty: content.difficulty || 'medium',
                estimatedTime: content.estimatedTime || null,
                status: 'published',
                createdBy: content.createdBy
              }).fetch();

              // Create steps from content.steps
              if (Array.isArray(content.steps) && content.steps.length > 0) {
                for (let i = 0; i < content.steps.length; i++) {
                  const stepData = content.steps[i];
                  const step = await sails.models.step.create({
                    guide: guide.id,
                    title: stepData.title || `Step ${i + 1}`,
                    description: stepData.description || '',
                    stepNumber: i + 1,
                    order: i + 1
                  }).fetch();

                  // Attach media if present
                  if (Array.isArray(stepData.media) && stepData.media.length > 0) {
                    for (const mediaItem of stepData.media) {
                      await sails.models.media.create({
                        step: step.id,
                        type: mediaItem.type || 'image',
                        url: mediaItem.url || '',
                        title: mediaItem.title || '',
                        author: mediaItem.author || ''
                      });
                    }
                  }
                }
              }

              updateData.guideId = guide.id;
            } else if (content.type === 'faq' && content.answer) {
              // For FAQ content, optionally create a guide too
              const guide = await sails.models.guide.create({
                product: content.product,
                title: content.title,
                difficulty: 'easy',
                status: 'published',
                createdBy: content.createdBy
              }).fetch();
              
              await sails.models.step.create({
                guide: guide.id,
                title: 'Answer',
                description: content.answer,
                stepNumber: 1,
                order: 1
              });

              updateData.guideId = guide.id;
            }
          } catch (guideErr) {
            sails.log.warn(`Could not create guide for content ${content.id}:`, guideErr);
            // Continue without failing the entire approval
          }

          await sails.models.notification.create({
            title: 'Content Auto-Approved',
            message: `Your content "${content.title}" was automatically approved by the system and is now visible in the app.`,
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
