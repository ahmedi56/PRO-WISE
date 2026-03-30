module.exports = {
  friendlyName: 'Backfill Phone Categories',
  description: 'Reassigns products in the root Phone category to their appropriate brand subcategories (Samsung, Apple, etc.)',

  fn: async function () {
    try {
      sails.log.info('Starting Phone Category Backfill...');

      const phoneCat = await Category.findOne({ name: 'Phone' }).populate('children');
      if (!phoneCat) {
        sails.log.error('Root Phone category not found. Aborting.');
        return;
      }

      if (!phoneCat.children || phoneCat.children.length === 0) {
        sails.log.warn('No child brand categories found under Phone. Aborting.');
        return;
      }

      const products = await Product.find({ category: phoneCat.id }).populate('company');
      
      if (products.length === 0) {
        sails.log.info('No products currently assigned to the root Phone category. Nothing to do.');
        return;
      }

      sails.log.info(`Found ${products.length} products to evaluate.`);

      let migratedCount = 0;
      let unresolvedCount = 0;

      for (const product of products) {
        const clues = [
          String(product.manufacturer || '').toLowerCase(),
          String(product.name || '').toLowerCase()
        ];
        
        if (product.company && product.company.name) {
          clues.push(String(product.company.name).toLowerCase());
        }

        let bestChild = null;
        for (const child of phoneCat.children) {
          const childName = String(child.name).toLowerCase();
          for (const clue of clues) {
            if (clue.includes(childName)) {
              bestChild = child;
              break;
            }
          }
          if (bestChild) break;
        }

        if (bestChild) {
          await Product.updateOne({ id: product.id }).set({ category: bestChild.id });
          sails.log.info(`[Migrated] "${product.name}" -> ${bestChild.name}`);
          migratedCount++;
        } else {
          sails.log.warn(`[Unresolved] Could not auto-map "${product.name}". Remaining in root Phone category.`);
          unresolvedCount++;
        }
      }

      sails.log.info('--- Backfill Complete ---');
      sails.log.info(`Migrated: ${migratedCount}`);
      sails.log.info(`Unresolved: ${unresolvedCount}`);

    } catch (err) {
      sails.log.error('Error during backfill:', err);
    }
  }
};
