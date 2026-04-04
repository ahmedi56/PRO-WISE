/**
 * Seed Function
 * (sails.config.bootstrap)
 *
 * A function that runs just before your Sails app gets lifted.
 *
 * For more information on seeding your app with fake data, check out:
 * https://sailsjs.com/config/bootstrap
 */

module.exports.bootstrap = async function () {
  const isForced = process.env.FORCE_SEED === 'true';

  // check if ORM loaded
  if (!sails.models) {
    throw new Error('ORM hook not loaded! The application cannot start without a database connection.');
  }

  const Category = sails.models.category;
  const Role = sails.models.role;
  const User = sails.models.user;
  const Company = sails.models.company;
  const Product = sails.models.product;
  const GuideType = sails.models.guidetype;
  const Guide = sails.models.guide;

  sails.log.info('BOOTSTRAP: Synchronizing system roles and permissions...');
  const defaultRoles = sails.config.custom.defaultRoles || [];
  for (const roleData of defaultRoles) {
    const existing = await Role.findOne({ name: roleData.name });
    if (!existing) {
      await Role.create(roleData);
      sails.log.info(`Seeded new role: ${roleData.name}`);
    } else {
      await Role.updateOne({ id: existing.id }).set({
        description: roleData.description,
        permissions: roleData.permissions
      });
    }
  }

  // Fast-path: If categories exist and we aren't forcing a seed, skip the heavy loops
  const hasData = (await Category.count()) > 0;
  if (hasData && !isForced) {
    sails.log.info('BOOTSTRAP: Data already seeded. Resetting popularity for clean start...');
    // Ensure all categories and products start at 0 for strict visit-driven popularity
    await Category.update({}).set({ totalScans: 0 });
    await Product.update({}).set({ totalScans: 0 });
    return;
  }

  // 2. Guide Types
  const guideTypes = [
    { name: 'Replacement', slug: 'replacement', description: 'Step-by-step part swap instructions', icon: 'swap' },
    { name: 'Disassembly', slug: 'disassembly', description: 'How to open/take apart a device', icon: 'tool' },
    { name: 'Technique', slug: 'technique', description: 'Skill-based instruction', icon: 'book' },
    { name: 'Troubleshooting', slug: 'troubleshooting', description: 'Diagnostic flowcharts or Q&A', icon: 'question' },
    { name: 'Maintenance', slug: 'maintenance', description: 'Routine care instructions', icon: 'clean' },
    { name: 'Teardown', slug: 'teardown', description: 'Informative analysis of internal components', icon: 'eye' }
  ];

  for (const gt of guideTypes) {
    const existing = await GuideType.findOne({ name: gt.name });
    if (!existing) {
      await GuideType.create(gt);
      sails.log.info(`Seeded guide type: ${gt.name}`);
    }
  }

  // Seed default users and company (Requires roles to be finished, but we'll do sequential here for safety as it's small)
  // Seed a default super_admin user if no super_admins exist
  const superAdminRole = await Role.findOne({ name: 'super_admin' });
  if (superAdminRole) {
    const superAdminExists = await User.findOne({ username: 'superadmin' });
    if (!superAdminExists) {
      await User.create({
        name: 'Super Admin',
        username: 'superadmin',
        email: 'superadmin@prowise.com',
        password: process.env.INITIAL_ADMIN_PASSWORD || 'Admin123!',
        role: superAdminRole.id,
        status: 'active'
      });
      sails.log.info(`Seeded default Super Admin`);
    }
  }

  // Seed a default company for initial testing
  let seededCompanyId;
  const companyExists = await Company.count();
  if (companyExists === 0) {
    const seededCompany = await Company.create({
      name: 'Atlas Copco (Industrial)',
      description: 'A world-leading provider of sustainable productivity solutions.'
    }).fetch();
    seededCompanyId = seededCompany.id;
    sails.log.info('Seeded default company: Atlas Copco');
    sails.config.custom.defaultCompanyId = seededCompanyId;
  } else {
    const existingCompany = await Company.findOne({ name: 'Atlas Copco (Industrial)' });
    if (existingCompany) {
      seededCompanyId = existingCompany.id;
      sails.config.custom.defaultCompanyId = seededCompanyId;
    }
  }

  // Seed default company admin
  const adminRole = await Role.findOne({ name: 'company_admin' }) || await Role.findOne({ name: 'administrator' });
  if (adminRole && seededCompanyId) {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'Company Admin',
        username: 'admin',
        email: 'admin@prowise.com',
        password: process.env.INITIAL_ADMIN_PASSWORD || 'Admin123!',
        role: adminRole.id,
        company: seededCompanyId,
        status: 'active'
      });
    }
  }

  // ── Clean up legacy seeded demo products ──
  // Remove only the known demo products that were previously auto-seeded.
  // This is safe to run repeatedly; if the products don't exist, nothing happens.
  const DEMO_PRODUCT_NAMES = [
    'Galaxy S23', 'iPhone 15', 'Pixel 8', 
    'PRO-WISE Creator Workstation', 'Founders Edition Graphics Card', 
    'Galaxy S24 Ultra', 'PRO-WISE Ultrabook', 'Galaxy S24'
  ];
  if (Product) {
    const removed = await Product.destroy({ name: { in: DEMO_PRODUCT_NAMES } }).fetch();
    if (removed.length > 0) {
      sails.log.info(`Cleaned up ${removed.length} legacy demo product(s): ${removed.map(p => p.name).join(', ')}`);
    }
  }

  // Seed Root Categories (L0)
  if (!Category) {
    sails.log.warn('Category model not found, skipping seed.');
  } else {
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

    for (const cat of rootCategories) {
      const existing = await Category.findOne({ name: cat.name });
      if (!existing) {
        const createdCat = await Category.create({
          name: cat.name,
          slug: cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          summary: cat.summary,
          icon: cat.icon,
          level: 0,
          visibility: 'public',
          tags: ['root', 'domain']
        }).fetch();
        sails.log.info(`Seeded root category: ${cat.name}`);

        // Seed hierarchy for Phone
        if (cat.name === 'Phone') {
          // Samsung
          const samsung = await Category.create({
            name: 'Samsung',
            slug: 'samsung',
            icon: 'logo-samsung',
            level: 1,
            parent: createdCat.id,
            visibility: 'public'
          }).fetch();

          sails.log.info('Seeded subcategory: Samsung');

          // Apple
          const apple = await Category.create({
            name: 'Apple',
            slug: 'apple',
            icon: 'logo-apple',
            level: 1,
            parent: createdCat.id,
            visibility: 'public'
          }).fetch();

          sails.log.info('Seeded subcategory: Apple');

          // Google
          const google = await Category.create({
            name: 'Google',
            slug: 'google',
            icon: 'logo-google',
            level: 1,
            parent: createdCat.id,
            visibility: 'public'
          }).fetch();

          sails.log.info('Seeded subcategory: Google');
        }
      } else {
        // Clear image and update icon if category exists
        await Category.updateOne({ id: existing.id }).set({
          image: null,
          icon: cat.icon
        });
      }
    }
  }

  // --- SEED REALISTIC COMPONENTS / SEMANTIC SEARCH DATA ---
  if (Product) {
    // Ensure Companies
    const companiesToSeed = ['Apple', 'Samsung Electronics', 'MSI', 'Lenovo'];
    for (const c of companiesToSeed) {
      const existing = await Company.findOne({ name: c });
      if (!existing) {
        await Company.create({ name: c, description: `Official ${c} products.` });
        sails.log.info(`Seeded company: ${c}`);
      }
    }
    const appleCo = await Company.findOne({ name: 'Apple' });
    const samsungCo = await Company.findOne({ name: 'Samsung Electronics' });
    const msiCo = await Company.findOne({ name: 'MSI' });
    const lenovoCo = await Company.findOne({ name: 'Lenovo' });

    // Get Categories
    const phoneCategory = await Category.findOne({ name: 'Phone' });
    const compCategory = await Category.findOne({ name: 'Computer' });

    if (phoneCategory && compCategory && appleCo && samsungCo && msiCo && lenovoCo) {
      const productsToSeed = [
        // APPLE
        {
          name: 'iPhone 12',
          description: 'Standard 2020 Apple iPhone with 5G.',
          content: 'Features Super Retina XDR display and A14 Bionic chip.',
          manufacturer: 'Apple',
          modelNumber: 'A2172',
          category: phoneCategory.id,
          company: appleCo.id,
          status: 'published',
          components: [
            { name: 'A14 Bionic', type: 'SoC', manufacturer: 'Apple', modelNumber: 'A14 Bionic', specifications: '6-core CPU, 4-core GPU, 16-core Neural Engine' },
            { name: 'Super Retina XDR', type: 'Display', manufacturer: 'Apple', modelNumber: '', specifications: '6.1" OLED, 60Hz' },
            { name: 'Dual Camera System', type: 'Camera', manufacturer: 'Apple', modelNumber: '', specifications: '12MP Main, 12MP Ultrawide' }
          ]
        },
        {
          name: 'iPhone 12 Pro Max',
          description: 'Large premium 2020 Apple iPhone with 5G and pro cameras.',
          content: 'Features a massive 6.7" Super Retina XDR display and A14 Bionic chip.',
          manufacturer: 'Apple',
          modelNumber: 'A2342',
          category: phoneCategory.id,
          company: appleCo.id,
          status: 'published',
          components: [
            { name: 'A14 Bionic', type: 'SoC', manufacturer: 'Apple', modelNumber: 'A14 Bionic', specifications: '6-core CPU, 4-core GPU, 16-core Neural Engine' },
            { name: 'Super Retina XDR', type: 'Display', manufacturer: 'Apple', modelNumber: '', specifications: '6.7" OLED, 60Hz' },
            { name: 'Pro Camera System', type: 'Camera', manufacturer: 'Apple', modelNumber: '', specifications: '12MP Main, 12MP Ultrawide, 12MP Telephoto' }
          ]
        },
        {
          name: 'iPhone 13',
          description: 'Standard 2021 Apple iPhone.',
          content: 'Features improved battery life and the A15 Bionic chip.',
          manufacturer: 'Apple',
          modelNumber: 'A2482',
          category: phoneCategory.id,
          company: appleCo.id,
          status: 'published',
          components: [
            { name: 'A15 Bionic', type: 'SoC', manufacturer: 'Apple', modelNumber: 'A15 Bionic', specifications: '6-core CPU, 4-core GPU, 16-core Neural Engine' },
            { name: 'Super Retina XDR', type: 'Display', manufacturer: 'Apple', modelNumber: '', specifications: '6.1" OLED, 60Hz' },
            { name: 'Dual Camera System', type: 'Camera', manufacturer: 'Apple', modelNumber: '', specifications: '12MP Main, 12MP Ultrawide with sensor-shift OIS' }
          ]
        },
        {
          name: 'iPhone 14',
          description: 'Standard 2022 Apple iPhone.',
          content: 'Features crash detection and the A15 Bionic chip with 5-core GPU.',
          manufacturer: 'Apple',
          modelNumber: 'A2649',
          category: phoneCategory.id,
          company: appleCo.id,
          status: 'published',
          components: [
            { name: 'A15 Bionic', type: 'SoC', manufacturer: 'Apple', modelNumber: 'A15 Bionic', specifications: '6-core CPU, 5-core GPU, 16-core Neural Engine' },
            { name: 'Super Retina XDR', type: 'Display', manufacturer: 'Apple', modelNumber: '', specifications: '6.1" OLED, 60Hz' },
            { name: 'Dual Camera System', type: 'Camera', manufacturer: 'Apple', modelNumber: '', specifications: '12MP Main, 12MP Ultrawide with Photonic Engine' }
          ]
        },

        // SAMSUNG
        {
          name: 'Galaxy S21',
          description: 'Standard 2021 Samsung Galaxy flagship.',
          content: 'Features a 120Hz AMOLED display and pro-grade camera.',
          manufacturer: 'Samsung Electronics',
          modelNumber: 'SM-G991U',
          category: phoneCategory.id,
          company: samsungCo.id,
          status: 'published',
          components: [
            { name: 'Snapdragon 888', type: 'SoC', manufacturer: 'Qualcomm', modelNumber: 'Snapdragon 888', specifications: 'Octa-core 2.84 GHz' },
            { name: 'Dynamic AMOLED 2X', type: 'Display', manufacturer: 'Samsung Display', modelNumber: '', specifications: '6.2" 1080p, 120Hz' },
            { name: 'Triple Camera System', type: 'Camera', manufacturer: 'Samsung', modelNumber: '', specifications: '12MP Main, 12MP Ultrawide, 64MP Telephoto' }
          ]
        },
        {
          name: 'Galaxy S22 Ultra',
          description: 'Premium built-in S-Pen 2022 Samsung Galaxy.',
          content: 'Features a massive 6.8" 120Hz AMOLED display and 100x Space Zoom.',
          manufacturer: 'Samsung Electronics',
          modelNumber: 'SM-S908U',
          category: phoneCategory.id,
          company: samsungCo.id,
          status: 'published',
          components: [
            { name: 'Snapdragon 8 Gen 1', type: 'SoC', manufacturer: 'Qualcomm', modelNumber: 'Snapdragon 8 Gen 1', specifications: 'Octa-core 3.00 GHz' },
            { name: 'Dynamic AMOLED 2X', type: 'Display', manufacturer: 'Samsung Display', modelNumber: '', specifications: '6.8" 1440p, 120Hz' },
            { name: 'Quad Camera System', type: 'Camera', manufacturer: 'Samsung', modelNumber: '', specifications: '108MP Main, 12MP Ultrawide, dual 10MP Telephoto' }
          ]
        },
        {
          name: 'Galaxy S23',
          description: 'Standard 2023 Samsung Galaxy flagship.',
          content: 'Features the custom Snapdragon 8 Gen 2 for Galaxy.',
          manufacturer: 'Samsung Electronics',
          modelNumber: 'SM-S911U',
          category: phoneCategory.id,
          company: samsungCo.id,
          status: 'published',
          components: [
            { name: 'Snapdragon 8 Gen 2 for Galaxy', type: 'SoC', manufacturer: 'Qualcomm', modelNumber: 'Snapdragon 8 Gen 2', specifications: 'Octa-core 3.36 GHz' },
            { name: 'Dynamic AMOLED 2X', type: 'Display', manufacturer: 'Samsung Display', modelNumber: '', specifications: '6.1" 1080p, 120Hz' },
            { name: 'Triple Camera System', type: 'Camera', manufacturer: 'Samsung', modelNumber: '', specifications: '50MP Main, 12MP Ultrawide, 10MP Telephoto' }
          ]
        },
        {
          name: 'Galaxy S24',
          description: 'Standard 2024 Samsung Galaxy flagship.',
          content: 'Compact design featuring Galaxy AI.',
          manufacturer: 'Samsung Electronics',
          modelNumber: 'SM-S921U',
          category: phoneCategory.id,
          company: samsungCo.id,
          status: 'published',
          components: [
            { name: 'Snapdragon 8 Gen 3 for Galaxy', type: 'SoC', manufacturer: 'Qualcomm', modelNumber: 'Snapdragon 8 Gen 3', specifications: 'Octa-core 3.39 GHz' },
            { name: 'Dynamic AMOLED 2X', type: 'Display', manufacturer: 'Samsung Display', modelNumber: '', specifications: '6.2" 1080p, 120Hz, 2600 nits' }
          ]
        },

        // MSI DESKTOPS
        {
          name: 'MSI Aegis RS',
          description: 'High-end gaming desktop PC by MSI.',
          content: 'Pre-built desktop aimed at esports and heavy gaming, featuring standard components.',
          manufacturer: 'MSI',
          modelNumber: 'Aegis RS 13th',
          category: compCategory.id,
          company: msiCo.id,
          status: 'published',
          components: [
            { name: 'Core i7 Processor', type: 'CPU', manufacturer: 'Intel', modelNumber: 'i7-13700KF', specifications: '16 Cores, up to 5.4 GHz' },
            { name: 'GeForce RTX Graphics', type: 'GPU', manufacturer: 'NVIDIA', modelNumber: 'RTX 4070', specifications: '12GB GDDR6X' },
            { name: 'DDR5 Memory', type: 'RAM', manufacturer: 'Kingston', modelNumber: 'FURY Beast', specifications: '32GB 5600MHz' },
            { name: 'Z790 Motherboard', type: 'Motherboard', manufacturer: 'MSI', modelNumber: 'PRO Z790-P WIFI', specifications: 'ATX form factor' }
          ]
        },
        {
          name: 'MSI Codex R',
          description: 'Mid-range gaming desktop PC by MSI.',
          content: 'Solid entry to mid-level gaming PC with reliable airflow and standardized layout.',
          manufacturer: 'MSI',
          modelNumber: 'Codex R 13th',
          category: compCategory.id,
          company: msiCo.id,
          status: 'published',
          components: [
            { name: 'Core i5 Processor', type: 'CPU', manufacturer: 'Intel', modelNumber: 'i5-13400F', specifications: '10 Cores, up to 4.6 GHz' },
            { name: 'GeForce RTX Graphics', type: 'GPU', manufacturer: 'NVIDIA', modelNumber: 'RTX 4060', specifications: '8GB GDDR6' },
            { name: 'DDR5 Memory', type: 'RAM', manufacturer: 'Crucial', modelNumber: '', specifications: '16GB 4800MHz' },
            { name: 'B760 Motherboard', type: 'Motherboard', manufacturer: 'MSI', modelNumber: 'B760M-P', specifications: 'Micro-ATX form factor' }
          ]
        },
        {
          name: 'MSI PRO DP series desktop',
          description: 'Compact business desktop PC by MSI.',
          content: 'Small form factor (SFF) desktop for office environments and productivity.',
          manufacturer: 'MSI',
          modelNumber: 'PRO DP21 13th',
          category: compCategory.id,
          company: msiCo.id,
          status: 'published',
          components: [
            { name: 'Core i5 Processor', type: 'CPU', manufacturer: 'Intel', modelNumber: 'i5-13400', specifications: '10 Cores, integrated graphics' },
            { name: 'DDR4 Memory', type: 'RAM', manufacturer: 'Crucial', modelNumber: '', specifications: '16GB SO-DIMM' },
            { name: 'NVMe SSD', type: 'Storage', manufacturer: 'Western Digital', modelNumber: 'SN570', specifications: '500GB PCIe 3.0' }
          ]
        },

        // LENOVO DESKTOPS
        {
          name: 'Lenovo Legion Tower 5',
          description: 'Mainstream gaming tower by Lenovo.',
          content: 'Optimized cooling and performance for gaming and content creation.',
          manufacturer: 'Lenovo',
          modelNumber: 'Legion T5 26IRB8',
          category: compCategory.id,
          company: lenovoCo.id,
          status: 'published',
          components: [
            { name: 'Core i5 Processor', type: 'CPU', manufacturer: 'Intel', modelNumber: 'i5-13400F', specifications: '10 Cores, up to 4.6 GHz' },
            { name: 'GeForce RTX Graphics', type: 'GPU', manufacturer: 'NVIDIA', modelNumber: 'RTX 4070', specifications: '12GB GDDR6X' },
            { name: 'DDR5 Memory', type: 'RAM', manufacturer: 'Samsung', modelNumber: '', specifications: '32GB 5600MHz' },
            { name: 'B760 Motherboard', type: 'Motherboard', manufacturer: 'Lenovo', modelNumber: '', specifications: 'Custom Micro-ATX' }
          ]
        },
        {
          name: 'Lenovo ThinkCentre M90t',
          description: 'Enterprise tower desktop PC.',
          content: 'Highly secure, manageable, and expandable desktop for heavy corporate use.',
          manufacturer: 'Lenovo',
          modelNumber: 'ThinkCentre M90t Gen 4',
          category: compCategory.id,
          company: lenovoCo.id,
          status: 'published',
          components: [
            { name: 'Core i7 vPro Processor', type: 'CPU', manufacturer: 'Intel', modelNumber: 'i7-13700', specifications: '16 Cores, vPro Enterprise' },
            { name: 'UHD Graphics 770', type: 'GPU', manufacturer: 'Intel', modelNumber: '', specifications: 'Integrated' },
            { name: 'DDR5 Memory', type: 'RAM', manufacturer: 'SK Hynix', modelNumber: '', specifications: '16GB 4400MHz' },
            { name: 'Q670 Motherboard', type: 'Motherboard', manufacturer: 'Lenovo', modelNumber: '', specifications: 'Custom ATX' }
          ]
        },
        {
          name: 'Lenovo ThinkStation P360',
          description: 'Entry-level professional workstation.',
          content: 'ISV-certified workstation designed for CAD, BIM, and reliable 3D design tasks.',
          manufacturer: 'Lenovo',
          modelNumber: 'ThinkStation P360 Tower',
          category: compCategory.id,
          company: lenovoCo.id,
          status: 'published',
          components: [
            { name: 'Core i9 Processor', type: 'CPU', manufacturer: 'Intel', modelNumber: 'i9-12900K', specifications: '16 Cores, up to 5.2 GHz' },
            { name: 'Quadro/RTX Professional Graphics', type: 'GPU', manufacturer: 'NVIDIA', modelNumber: 'RTX A4000', specifications: '16GB GDDR6 ECC' },
            { name: 'DDR5 Memory', type: 'RAM', manufacturer: 'Micron', modelNumber: '', specifications: '64GB 4400MHz ECC' },
            { name: 'W680 Motherboard', type: 'Motherboard', manufacturer: 'Lenovo', modelNumber: '', specifications: 'Custom Workstation ATX' }
          ]
        }
      ];

      // --- WAIT FOR EMBEDDING SERVICE ---
      // Faster check for bootstrap (5 retries, 1s delay)
      const serviceReady = await sails.services.searchservice.ensureServiceReady(5, 1000);
      if (!serviceReady) {
        sails.log.warn('BOOTSTRAP: Embedding service not ready yet. Generating embeddings for new products will be skipped today.');
      }

      for (const p of productsToSeed) {
        let currentProduct;
        const existing = await Product.findOne({ name: p.name });
        
        if (!existing) {
          currentProduct = await Product.create(p).fetch();
          sails.log.info(`Seeded realistic product: ${p.name}`);
        } else {
          // Only update if forced or if data looks basic
          currentProduct = await Product.updateOne({ id: existing.id }).set({ 
            components: p.components, 
            description: p.description, 
            manufacturer: p.manufacturer, 
            modelNumber: p.modelNumber, 
            company: p.company 
          });
        }

        // Generate embedding ONLY if missing or forced
        const needsEmbedding = currentProduct && (!currentProduct.embedding || currentProduct.embedding.length === 0);
        
        if (serviceReady && (needsEmbedding || isForced)) {
          try {
            await sails.services.productembeddingservice.updateEmbedding(currentProduct.id);
            sails.log.info(`Generated embedding for: ${p.name}`);
          } catch (e) {
            sails.log.debug(`Could not generate embedding for: ${p.name}`);
          }
        }
      }
    }
  }

};
