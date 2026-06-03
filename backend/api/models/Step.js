/**
 * Step.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    guide: {
      model: 'guide',
      required: true
    },
    stepNumber: {
      type: 'number',
      required: true
    },
    title: {
      type: 'string',
      required: true
    },
    description: {
      type: 'string',
      allowNull: true
    },
    solution_group: {
      type: 'string',
      allowNull: true
    },
    order: {
      type: 'number',
      defaultsTo: 0
    },
    isDivider: {
      type: 'boolean',
      defaultsTo: false
    },
    isPublished: {
      type: 'boolean',
      defaultsTo: true
    },
    media: {
      collection: 'media',
      via: 'step'
    },
    embedding: {
      type: 'json',
      columnType: 'array',
      description: 'Vector embedding of the step title and description for semantic RAG.'
    }
  },

  /**
   * Safe data exposure: Remove internal management fields before sending to client.
   */
  customToJSON: function() {
    const step = _.cloneDeep(this);
    delete step.solution_group;
    delete step.isDivider;
    // We keep isPublished and order as they might be useful for debugging or internal admin UI
    // but the controller will handle the strict filtering.
    return step;
  },

  beforeCreate: async function(valuesToCreate, proceed) {
    try {
      if (sails.services.geminiservice && sails.services.geminiservice.isAvailable()) {
        const textToEmbed = `${valuesToCreate.title || ''}\n${valuesToCreate.description || ''}`.trim();
        if (textToEmbed) {
          const result = await sails.services.geminiservice.getEmbedding(textToEmbed, 'RETRIEVAL_DOCUMENT');
          if (result && result.success && Array.isArray(result.embedding)) {
            valuesToCreate.embedding = result.embedding;
          }
        }
      }
    } catch (err) {
      sails.log.warn(`Step.beforeCreate: Failed to generate embedding: ${err.message}`);
    }
    return proceed();
  },

  beforeUpdate: async function(valuesToUpdate, proceed) {
    try {
      if (valuesToUpdate.title !== undefined || valuesToUpdate.description !== undefined) {
        const existing = await Step.findOne({ id: valuesToUpdate.id });
        const title = valuesToUpdate.title !== undefined ? valuesToUpdate.title : (existing ? existing.title : '');
        const description = valuesToUpdate.description !== undefined ? valuesToUpdate.description : (existing ? existing.description : '');
        const textToEmbed = `${title || ''}\n${description || ''}`.trim();
        
        if (textToEmbed && sails.services.geminiservice && sails.services.geminiservice.isAvailable()) {
          const result = await sails.services.geminiservice.getEmbedding(textToEmbed, 'RETRIEVAL_DOCUMENT');
          if (result && result.success && Array.isArray(result.embedding)) {
            valuesToUpdate.embedding = result.embedding;
          }
        }
      }
    } catch (err) {
      sails.log.warn(`Step.beforeUpdate: Failed to generate embedding: ${err.message}`);
    }
    return proceed();
  }

};
