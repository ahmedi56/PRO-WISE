/**
 * ProductEmbeddingService
 *
 * @description :: Reusable service to build rich search documents and generate embeddings for products.
 */

module.exports = {

  /**
   * Build a normalized, rich text document for a product to be used for embedding generation.
   * @param {Object} product - The product object, ideally populated with category.
   * @returns {Promise<string>} - The generated search document.
   */
  buildSearchDocument: async function (product) {
    if (!product) { return ''; }
    const componentMatching = sails.services.componentmatchingservice;

    // 1. Core Identification (Highest Importance)
    let doc = `Product: ${product.name || ''}\n`;
    if (product.manufacturer) { doc += `Brand/Manufacturer: ${product.manufacturer}\n`; }
    if (product.modelNumber) { doc += `Model Number: ${product.modelNumber}\n`; }

    // 2. Technical Composition (Critical for hybrid matching and semantic alignment)
    if (product.components && Array.isArray(product.components) && product.components.length > 0) {
      doc += `\nTechnical Specifications & Components:\n`;
      const normalizedComponents = componentMatching
        ? componentMatching.getNormalizedProductComponents(product)
        : product.components;

      normalizedComponents.forEach((comp) => {
        const cType = comp.type || 'Component';
        const brand = comp.manufacturer || '';
        const model = comp.modelNumber || '';
        const name = comp.name || '';
        const specs = comp.specifications || '';
        const signature = comp.signature ? ` signature ${comp.signature}` : '';
        const family = Array.isArray(comp.familyTokens) && comp.familyTokens.length
          ? ` family ${comp.familyTokens.join(' ')}`
          : '';

        // Emphasize the type and model for better vector search
        doc += `- ${cType}: ${brand} ${model} ${name} ${specs}${signature}${family}\n`.replace(/\s+/g, ' ');
      });
    }

    // 3. Categorization Context
    let category = product.category;
    if (category) {
      if (typeof category === 'string' || typeof category === 'number') {
        category = await Category.findOne({ id: category }).populate('parent');
      }

      if (category && category.name) {
        doc += `\nCategory: ${category.name}\n`;
        if (category.summary) { doc += `Category Context: ${category.summary}\n`; }

        // Inclusion of parent category for broader semantic matching
        if (category.parent) {
          const parent = typeof category.parent === 'object' ? category.parent : await Category.findOne({ id: category.parent });
          if (parent) {
            doc += `Parent Category: ${parent.name}\n`;
          }
        }
      }
    }

    // 4. Detailed Descriptions (Semantic Signal)
    if (product.description) { doc += `\nDescription: ${product.description}\n`; }
    if (product.content) { doc += `\nDetailed Information: ${product.content}\n`; }

    // 5. Company/Tenant Context
    if (product.company) {
      let company = product.company;
      if (typeof company === 'string' || typeof company === 'number') {
        company = await Company.findOne({ id: company });
      }
      if (company && company.name) {
        doc += `\nManufacturer/Provider: ${company.name}\n`;
      }
    }

    return doc.trim();
  },

  /**
   * Build the document, generate the embedding, and update the Product record.
   * @param {string} productId - The ID of the product to update.
   * @returns {Promise<boolean>} - True if embedding was generated and saved, false otherwise.
   */
  updateEmbedding: async function (productId) {
    try {
      const product = await Product.findOne({ id: productId }).populate('category').populate('company');
      if (!product) {
        sails.log.error('ProductEmbeddingService.updateEmbedding: Product not found:', productId);
        return false;
      }

      const searchDocument = await this.buildSearchDocument(product);
      let embedding = null;

      try {
        const isHealthy = await sails.services.searchservice.checkHealth();
        if (!isHealthy) {
          throw new Error('Embedding service is not healthy or unreachable');
        }

        // Use the existing SearchService API integration
        sails.log.info(`ProductEmbeddingService: Generating embedding for "${product.name}" (doc length: ${searchDocument.length})`);
        const result = await sails.services.searchservice.getEmbedding(searchDocument, { mode: 'document', retries: 3 });
        embedding = result && result.embedding ? result.embedding : null;
      } catch (err) {
        sails.services.searchservice.logThrottled('warn', 'update_embedding_connection_error', `ProductEmbeddingService.updateEmbedding: Couldn't generate embedding for "${product.name}". Service error: ${err.message}`);
        // We update the searchDocument and leave embedding as is
      }

      const updateData = { searchDocument };
      if (embedding) {
        updateData.embedding = embedding;
      }

      await Product.updateOne({ id: productId }).set(updateData);

      return !!embedding;
    } catch (err) {
      sails.log.error('ProductEmbeddingService.updateEmbedding: Unexpected error:', err);
      return false;
    }
  }

};
