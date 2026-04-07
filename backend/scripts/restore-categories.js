/**
 * restore-categories.js
 * 
 * Standalone script to restore default categories using native MongoDB driver.
 */
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function run() {
  const url = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/prowise';
  const client = new MongoClient(url);

  try {
    await client.connect();
    const db = client.db();
    const Category = db.collection('category');

    console.log('Restoring default categories...');

    const rootCategories = [
      { name: 'Electronics', summary: 'Smartphones, wearables, and personal gadgets', icon: 'hardware-chip-outline' },
      { name: 'Medical Device', summary: 'Professional healthcare equipment and monitors', icon: 'medkit-outline' },
      { name: 'Camera', summary: 'Digital cameras, lenses, and optical equipment', icon: 'camera-outline' },
      { name: 'Repair Skills', summary: 'Core electronics and mechanical repair skills', icon: 'build-outline' },
      { name: 'Gaming Console', summary: 'Game consoles and handheld gaming devices', icon: 'game-controller-outline' },
      { name: 'In the Home', summary: 'Smart home, plumbing, and domestic equipment', icon: 'home-outline' },
      { name: 'Appliances', summary: 'Large and small household appliances', icon: 'tv-outline' },
      { name: 'Mac', summary: 'Apple computers and macOS devices', icon: 'desktop-outline' },
      { name: 'Computer Hardware', summary: 'Printers, networking, and peripherals', icon: 'print-outline' },
      { name: 'Computer', summary: 'Laptops and desktop computers', icon: 'laptop-outline' },
      { name: 'Tools', summary: 'Power tools and hand tools for precision work', icon: 'hammer-outline' },
      { name: 'Tablet', summary: 'Tablets and e-readers', icon: 'tablet-landscape-outline' },
      { name: 'Phone', summary: 'Mobile phones and communications gear', icon: 'phone-portrait-outline' },
      { name: 'Vehicle', summary: 'Cars, trucks, and personal mobility', icon: 'car-outline' },
      { name: 'Apparel & Accessories', summary: 'Wearable tech and smart accessories', icon: 'shirt-outline' },
      { name: 'Car and Truck', summary: 'Automotive and transportation machinery', icon: 'bus-outline' }
    ];

    let count = 0;
    for (const cat of rootCategories) {
      const existing = await Category.findOne({ name: cat.name });
      if (!existing) {
        const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const result = await Category.insertOne({
          name: cat.name,
          slug: slug,
          summary: cat.summary,
          icon: cat.icon,
          level: 0,
          visibility: 'public',
          tags: ['root', 'domain'],
          createdAt: new Date().getTime(),
          updatedAt: new Date().getTime()
        });
        
        const categoryId = result.insertedId;
        console.log(`Restored root category: ${cat.name}`);
        count++;

        // Seed hierarchy for Phone
        if (cat.name === 'Phone') {
          const subCats = [
            { name: 'Samsung', slug: 'samsung', icon: 'logo-samsung' },
            { name: 'Apple', slug: 'apple', icon: 'logo-apple' },
            { name: 'Google', slug: 'google', icon: 'logo-google' }
          ];
          for (const sub of subCats) {
             await Category.insertOne({
              name: sub.name,
              slug: sub.slug,
              icon: sub.icon,
              level: 1,
              parent: categoryId,
              visibility: 'public',
              createdAt: new Date().getTime(),
              updatedAt: new Date().getTime()
            });
            console.log(`Restored subcategory: ${sub.name}`);
            count++;
          }
        }
      }
    }

    console.log(`Restoration complete. Total categories restored: ${count}`);

  } catch (err) {
    console.error('Restoration failed:', err);
  } finally {
    await client.close();
  }
}

run();
