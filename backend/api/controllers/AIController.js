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
        maxOutputTokens: 300,
        temperature: 0.4
      });

      if (!result.success) {
        return res.status(500).json(result);
      }

      return res.json({
        success: true,
        data: { text: result.data },
        usage: result.usage
      });
    } catch (err) {
      sails.log.error('AI Description Error:', err);
      return res.status(500).json({ success: false, message: 'Failed to generate description', code: 'SERVER_ERROR' });
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
        return res.status(500).json(result);
      }

      return res.json({
        success: true,
        data: { steps: result.data },
        usage: result.usage
      });
    } catch (err) {
      sails.log.error('AI Suggest Steps Error:', err);
      return res.status(500).json({ success: false, message: 'Failed to suggest steps', code: 'SERVER_ERROR' });
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
        temperature: 0.7, // Higher for chat
        maxOutputTokens: 1000
      });

      if (!result.success) {
        return res.status(500).json(result);
      }

      return res.json({
        success: true,
        data: { response: result.data },
        usage: result.usage
      });

    } catch (err) {
      sails.log.error('AI Chat Error:', err);
      return res.status(500).json({ success: false, message: 'AI Assistant error', code: 'SERVER_ERROR' });
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
        return res.status(500).json(result);
      }

      return res.json({
        success: true,
        data: result.data,
        usage: result.usage
      });
    } catch (err) {
      sails.log.error('AI Feedback Analysis Error:', err);
      return res.status(500).json({ success: false, message: 'Failed to analyze feedback', code: 'SERVER_ERROR' });
    }
  }

};
