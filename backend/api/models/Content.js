/**
 * Content.js
 *
 * @description :: A model definition represents a general content submission.
 */

module.exports = {
  attributes: {
    title: {
      type: 'string',
      required: true
    },
    description: {
      type: 'string',
      required: true
    },
    type: {
      type: 'string',
      isIn: ['guide', 'general', 'article', 'faq', 'tutorial'],
      defaultsTo: 'general'
    },
    status: {
      type: 'string',
      isIn: ['draft', 'pending', 'approved', 'rejected'],
      defaultsTo: 'draft'
    },
    submittedAt: {
      type: 'number',
      allowNull: true,
      description: 'Timestamp when the content was submitted'
    },
    approvedBy: {
      type: 'string',
      isIn: ['admin', 'system'],
      allowNull: true
    },
    company: {
      model: 'company',
      required: false
    },
    product: {
      model: 'product',
      required: true
    },
    createdBy: {
      model: 'user',
      required: true
    },
    steps: {
      type: 'json',
      columnType: 'array',
      defaultsTo: []
    },
    media: {
      type: 'json',
      columnType: 'array',
      defaultsTo: []
    },
    autoReview: {
      type: 'json',
      defaultsTo: {}
    },
    reviewDeadlineAt: {
      type: 'number',
      allowNull: true
    },
    needsManualReview: {
      type: 'boolean',
      defaultsTo: false
    },
    rejectionReason: {
      type: 'string',
      allowNull: true
    },
    reviewMode: {
      type: 'string',
      isIn: ['manual', 'auto', 'hybrid'],
      defaultsTo: 'hybrid'
    },
    difficulty: {
      type: 'string',
      isIn: ['easy', 'medium', 'hard', 'expert'],
      defaultsTo: 'medium'
    },
    estimatedTime: {
      type: 'string',
      allowNull: true
    },
    videoId: {
      type: 'string',
      allowNull: true,
      description: 'YouTube video ID for tutorials'
    },
    fileUrl: {
      type: 'string',
      allowNull: true,
      description: 'PDF document URL for articles/guides'
    },
    answer: {
      type: 'string',
      columnType: 'text',
      allowNull: true,
      description: 'Definitive answer for FAQ entries'
    }
  }
};
