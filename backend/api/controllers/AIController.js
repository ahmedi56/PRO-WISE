/**
 * AIController
 *
 * @description :: Server-side actions for handling AI generation and chat with standardized responses.
 */

/**
 * Reusable Prompt Builder for consistent AI behavior.
 */
const PromptBuilder = {
  build: (task, context, constraints = []) => {
    return `
SYSTEM:
You are a senior PRO-WISE technical assistant. Return concise, professional, and technically accurate output.

TASK:
${task}

CONTEXT:
${context}

CONSTRAINTS:
- Use existing app terminology.
- Do not invent database records.
- If JSON is requested, return ONLY valid JSON without markdown.
${constraints.map(c => `- ${c}`).join('\n')}

OUTPUT FORMAT:
Provide the response in a structured format suitable for technical documentation.
    `.trim();
  }
};

module.exports = {

  /**
   * POST /api/ai/generate-description
   */
  generateDescription: async function (req, res) {
    try {
      const { productName, category } = req.body;
      if (!productName) {
        return res.status(400).json({ success: false, message: 'Product name is required' });
      }

      const task = 'Generate a professional, technical product description for a hardware product.';
      const context = `Product Name: ${productName}${category ? `\nCategory: ${category}` : ''}`;
      const constraints = [
        'Focus on key technical features and value proposition.',
        'Length: Maximum 120 words.',
        'Tone: Professional and authoritative.'
      ];

      const prompt = PromptBuilder.build(task, context, constraints);
      const result = await sails.services.geminiservice.generateText(prompt, {
        temperature: 0.4
      });

      if (!result.success) {
        sails.log.warn('AI Description generation failed (falling back locally):', result.message || result.error);
        const fallbackText = `The ${productName} is a premium hardware device in the ${category || 'electronics'} category. Engineered with high-performance components, it offers outstanding reliability, seamless integration capabilities, and is designed to meet demanding user requirements.`;
        return res.json({
          success: true,
          data: { text: fallbackText },
          fallback: true
        });
      }

      return res.json({
        success: true,
        data: { text: result.data },
        usage: result.usage
      });
    } catch (err) {
      sails.log.error('AI Description Error (falling back locally):', err);
      const fallbackText = `The ${req.body.productName || 'device'} is a premium hardware product designed for optimal performance, reliability, and seamless user integration.`;
      return res.json({
        success: true,
        data: { text: fallbackText },
        fallback: true
      });
    }
  },

  /**
   * POST /api/ai/suggest-steps
   */
  suggestSteps: async function (req, res) {
    try {
      const { guideTitle, productContext } = req.body;
      if (!guideTitle) {
        return res.status(400).json({ success: false, message: 'Guide title is required' });
      }

      const task = 'Suggest a logical sequence of troubleshooting or assembly steps.';
      const context = `Guide Title: ${guideTitle}${productContext ? `\nProduct: ${productContext}` : ''}`;
      const constraints = [
        'Return exactly 5-7 clear, actionable steps.',
        'Format the output as a JSON array of strings.',
        'Ensure steps are technically sound for hardware maintenance.'
      ];

      const prompt = PromptBuilder.build(task, context, constraints);
      const result = await sails.services.geminiservice.generateText(prompt, {
        responseMimeType: 'application/json',
        temperature: 0.2
      });

      if (!result.success) {
        sails.log.warn('AI Suggest Steps generation failed (falling back locally):', result.message || result.error);
        const fallbackSteps = [
          'Safety Check: Power off the device and disconnect it from any electrical outlets or batteries.',
          'Disassembly: Carefully remove external screws and open the casing using specialized tools.',
          'Inspection: Visually examine the interior for physical damage, burnt components, or loose cables.',
          'Component Check: Test the component or sub-assembly for electrical continuity or correct positioning.',
          'Reassembly: Carefully reinstall all components, ensuring secure connections and correct routing.',
          'Testing: Power on the system and perform functional tests to ensure the issue is resolved.'
        ];
        return res.json({
          success: true,
          data: { steps: fallbackSteps },
          fallback: true
        });
      }

      return res.json({
        success: true,
        data: { steps: result.data },
        usage: result.usage
      });
    } catch (err) {
      sails.log.error('AI Suggest Steps Error (falling back locally):', err);
      const fallbackSteps = [
        'Safety Check: Power off the device and disconnect it from any electrical outlets or batteries.',
        'Disassembly: Carefully remove external screws and open the casing using specialized tools.',
        'Inspection: Visually examine the interior for physical damage, burnt components, or loose cables.',
        'Reassembly: Carefully reinstall all components, ensuring secure connections and correct routing.',
        'Testing: Power on the system and perform functional tests to ensure the issue is resolved.'
      ];
      return res.json({
        success: true,
        data: { steps: fallbackSteps },
        fallback: true
      });
    }
  },

  /**
   * POST /api/ai/chat
   */
  chat: async function(req, res) {
    try {
      const { message, productId, context: extraContext } = req.body;
      if (!message) {
        return res.status(400).json({ success: false, message: 'Message is required' });
      }

      let contextStr = '';
      if (productId) {
        // Optimization: select only necessary fields
        const product = await Product.findOne({ id: productId })
          .populate('category')
          .populate('company')
          .select(['name', 'manufacturer', 'description', 'components']);
          
        if (product) {
          contextStr += `Current Product: ${product.name} by ${product.manufacturer}.\n`;
          if (product.category) {contextStr += `Category: ${product.category.name}.\n`;}
          if (product.description) {contextStr += `Description: ${product.description.substring(0, 500)}...\n`;}
          if (product.components) {
            contextStr += `Technical Specs: ${product.components.map(c => `${c.type}: ${c.name}`).slice(0, 10).join(', ')}.\n`;
          }

          // RAG: Fetch all guide steps for this product
          try {
            const guides = await Guide.find({ product: productId, status: 'published' });
            if (guides && guides.length > 0) {
              const guideIds = guides.map(g => g.id);
              const steps = await Step.find({ guide: { in: guideIds } }).populate('guide');
              
              if (steps && steps.length > 0) {
                // Get embedding of user query
                let queryEmbedding = null;
                if (sails.services.geminiservice && sails.services.geminiservice.isAvailable()) {
                  const result = await sails.services.geminiservice.getEmbedding(message, 'RETRIEVAL_QUERY');
                  if (result && result.success && Array.isArray(result.embedding)) {
                    queryEmbedding = result.embedding;
                  }
                }

                // In-memory similarity calculation
                const cosineSimilarity = (vecA, vecB) => {
                  if (!vecA || !vecB || vecA.length !== vecB.length) {return 0;}
                  let dot = 0; let normA = 0; let normB = 0;
                  for (let i = 0; i < vecA.length; i++) {
                    dot += vecA[i] * vecB[i];
                    normA += vecA[i] * vecA[i];
                    normB += vecB[i] * vecB[i];
                  }
                  const denom = Math.sqrt(normA) * Math.sqrt(normB);
                  return denom === 0 ? 0 : dot / denom;
                };

                if (queryEmbedding) {
                  const scoredSteps = steps.map(s => {
                    const score = s.embedding ? cosineSimilarity(queryEmbedding, s.embedding) : 0;
                    return { ...s, score };
                  }).sort((a, b) => b.score - a.score);

                  // Take top-5 steps with similarity > 0.60
                  const relevantSteps = scoredSteps.filter(s => s.score > 0.60).slice(0, 5);
                  if (relevantSteps.length > 0) {
                    contextStr += '\nRelevant Troubleshooting & Guide Steps:\n';
                    relevantSteps.forEach(s => {
                      contextStr += `- [Guide: ${s.guide.title}] Step ${s.stepNumber}: ${s.title}. Description: ${s.description || 'N/A'}\n`;
                    });
                  }
                } else {
                  // Fallback: append steps directly if embedding is unavailable
                  contextStr += '\nProduct Guide Steps:\n';
                  steps.slice(0, 5).forEach(s => {
                    contextStr += `- [Guide: ${s.guide.title}] Step ${s.stepNumber}: ${s.title}. Description: ${s.description || 'N/A'}\n`;
                  });
                }
              }
            }
          } catch (ragErr) {
            sails.log.warn('AIController: Failed to fetch/rank guide steps for RAG context.', ragErr.message);
          }
        }
      }

      if (extraContext) {
        contextStr += `Additional Context: ${extraContext.substring(0, 1000)}\n`;
      }

      const task = 'Respond to the user\'s hardware-related inquiry.';
      const constraints = [
        'Be helpful but concise.',
        'If you do not know the answer, advise contacting professional support.',
        'Do not provide advice that could lead to physical injury or electric shock without explicit safety warnings.'
      ];

      const prompt = PromptBuilder.build(task, `User Query: ${message}\n${contextStr}`, constraints);
      const result = await sails.services.geminiservice.generateText(prompt, {
        temperature: 0.7 // Higher for chat
      });

      if (!result.success) {
        sails.log.warn('AI Chat Assistant failed (falling back locally):', result.message || result.error);
        const hasGeminiKeys = !!(process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY);
        const isGeminiAvailable = sails.services.geminiservice.isAvailable();
        const isGroqAvailable = !!(sails.services.grokservice && sails.services.grokservice.isAvailable());
        const diag = `[GeminiKey: ${hasGeminiKeys}, GeminiAvail: ${isGeminiAvailable}, GroqAvail: ${isGroqAvailable}]`;

        const fallbackResponse = `I am currently operating in offline mode because the AI provider is temporarily unavailable (Reason: ${result.message || 'Unknown error'} ${diag}). Based on your query "${message}", please verify all hardware connections, consult our official product manuals, or contact our support team at support@prowise.com.`;
        return res.json({
          success: true,
          data: { response: fallbackResponse },
          fallback: true
        });
      }

      return res.json({
        success: true,
        data: { response: result.data },
        usage: result.usage
      });

    } catch (err) {
      sails.log.error('AI Chat Error (falling back locally):', err);
      const fallbackResponse = `I am currently operating in offline mode because the AI provider is temporarily unavailable. Please verify all hardware connections, consult our official product manuals, or contact our support team at support@prowise.com.`;
      return res.json({
        success: true,
        data: { response: fallbackResponse },
        fallback: true
      });
    }
  },

  /**
   * GET /api/ai/analyze-feedback/:feedbackId
   */
  analyzeFeedback: async function (req, res) {
    try {
      const feedback = await Feedback.findOne({ id: req.params.feedbackId }).populate('product');
      if (!feedback) {return res.status(404).json({ success: false, message: 'Feedback not found' });}

      const task = 'Analyze customer feedback and suggest improvements.';
      const context = `Product: ${feedback.product?.name || 'Unknown'}\nRating: ${feedback.rating}/5\nComment: "${feedback.comment}"`;
      const constraints = [
        'Identify the core issue mentioned.',
        'Suggest a technical or process improvement.',
        'Format response as JSON with fields: sentiment, keyIssue, suggestion.'
      ];

      const prompt = PromptBuilder.build(task, context, constraints);
      const result = await sails.services.geminiservice.generateText(prompt, {
        responseMimeType: 'application/json',
        temperature: 0.1
      });

      if (!result.success) {
        sails.log.warn('AI Feedback Analysis failed (falling back locally):', result.message || result.error);
        const sentiment = (feedback.rating && feedback.rating >= 4) ? 'positive' : ((feedback.rating && feedback.rating <= 2) ? 'negative' : 'neutral');
        const keyIssue = sentiment === 'negative' ? 'Customer noted technical difficulties or unsatisfactory experience.' : 'General user review/satisfaction feedback.';
        const suggestion = sentiment === 'negative' ? 'Initiate a support ticket to follow up and resolve the customer concern.' : 'Log customer satisfaction metrics for system improvements.';
        return res.json({
          success: true,
          data: { sentiment, keyIssue, suggestion },
          fallback: true
        });
      }

      return res.json({
        success: true,
        data: result.data,
        usage: result.usage
      });
    } catch (err) {
      sails.log.error('AI Feedback Analysis Error (falling back locally):', err);
      return res.json({
        success: true,
        data: {
          sentiment: 'neutral',
          keyIssue: 'Failed to analyze feedback due to server error.',
          suggestion: 'Review feedback manually.'
        },
        fallback: true
      });
    }
  },

  /**
   * POST /api/ai/component-insight
   */
  componentInsight: async function (req, res) {
    const { component, productContext } = req.body;
    if (!component || !component.name) {
      return res.status(400).json({ success: false, message: 'Component with a valid name is required' });
    }

    const generateLocalFallbackInsight = (comp, context) => {
      const type = (comp.type || '').toLowerCase();
      const name = comp.name || '';
      const manufacturer = comp.manufacturer || '';
      const specs = comp.specifications || '';

      let fallback = `The ${name} is a key ${comp.type || 'component'} configured for this system.`;

      if (type.includes('cpu') || type.includes('processor') || name.toLowerCase().includes('intel') || name.toLowerCase().includes('amd') || name.toLowerCase().includes('ryzen') || name.toLowerCase().includes('core i') || name.toLowerCase().includes('m1') || name.toLowerCase().includes('m2') || name.toLowerCase().includes('m3')) {
        fallback = `The ${name} serves as the central processing unit (CPU), directing all system operations and executing computational threads.`;
        if (specs) {
          fallback += ` Features include: ${specs}.`;
        }
      } else if (type.includes('gpu') || type.includes('graphics') || type.includes('vga') || name.toLowerCase().includes('nvidia') || name.toLowerCase().includes('rtx') || name.toLowerCase().includes('radeon') || name.toLowerCase().includes('geforce')) {
        fallback = `The ${name} is the dedicated GPU, delivering high-performance graphics rendering for gaming, design rendering, and display output.`;
        if (specs) {
          fallback += ` Features include: ${specs}.`;
        }
      } else if (type.includes('ram') || type.includes('memory') || name.toLowerCase().includes('ddr') || name.toLowerCase().includes('sodimm')) {
        fallback = `The ${name} serves as active system memory (RAM), holding temporary data for running applications and system processes.`;
      } else if (type.includes('ssd') || type.includes('storage') || type.includes('hdd') || type.includes('drive') || name.toLowerCase().includes('nvme')) {
        fallback = `The ${name} acts as the primary system storage drive, hosting the operating system and applications for ultra-fast boot times.`;
      } else if (type.includes('motherboard') || type.includes('board') || type.includes('mainboard')) {
        fallback = `The ${name} motherboard links all key hardware modules, facilitating high-speed data flow and reliable power delivery.`;
      } else if (specs) {
        fallback = `Configured specs: ${specs}`;
      }

      return fallback;
    };

    try {
      const task = 'Provide a brief, helpful explanation of what this component is and its significance/role within the product. This must be an informative technical description, not repeating the raw name or model label. For example, explain how they work, or if they share processor / graphic card resources.';
      const context = `Product Context: ${productContext || 'Consumer Hardware'}\nComponent Name: ${component.name}\nType: ${component.type || 'Unknown'}\nManufacturer: ${component.manufacturer || 'Unknown'}\nModel: ${component.modelNumber || 'N/A'}\nSpecifications: ${component.specifications || 'N/A'}`;
      const constraints = [
        'Keep the explanation to exactly 1-2 sentences.',
        'Maximum 45 words.',
        'Explain the role or value of the component (e.g. why it matters, processor architecture, GPU memory bandwidth, or compatibility) rather than just restating specs.',
        'Be directly helpful to a user reading a product specs overview.'
      ];

      const prompt = PromptBuilder.build(task, context, constraints);
      const result = await sails.services.geminiservice.generateText(prompt, {
        temperature: 0.3
      });

      if (!result.success) {
        sails.log.warn('Gemini API failed to generate insight, falling back locally:', result.message || result.error);
        return res.json({
          success: true,
          data: { insight: generateLocalFallbackInsight(component, productContext) },
          fallback: true
        });
      }

      const insightText = typeof result.data === 'object' ? (result.data.insight || JSON.stringify(result.data)) : result.data;

      return res.json({
        success: true,
        data: { insight: insightText },
        usage: result.usage
      });
    } catch (err) {
      sails.log.error('AI Component Insight Error (falling back locally):', err);
      return res.json({
        success: true,
        data: { insight: generateLocalFallbackInsight(component, productContext) },
        fallback: true
      });
    }
  }

};
