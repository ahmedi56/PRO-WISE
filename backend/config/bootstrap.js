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


  // check if ORM loaded
  // sails.log.info('Loaded hooks:', Object.keys(sails.hooks));
  if (!sails.models) {
    sails.log.error('ORM hook present in hooks?', !!sails.hooks.orm);
    throw new Error('ORM hook not loaded! The application cannot start without a database connection. Please ensure MongoDB is running (mongod) and try again.');
  }

  // Seed default roles if they don't exist

  const defaultRoles = sails.config.custom.defaultRoles || [];
  const Role = sails.models.role;
  const User = sails.models.user;

  if (Role && User) {
    for (const roleData of defaultRoles) {
      const existing = await Role.findOne({ name: roleData.name });
      if (!existing) {
        await Role.create(roleData);
        sails.log.info(`Seeded role: ${roleData.name}`);
      } else {
        // Update existing roles with latest permissions and description
        await Role.updateOne({ id: existing.id }).set({
          description: roleData.description,
          permissions: roleData.permissions
        });
        sails.log.info(`Updated profile for role: ${roleData.name}`);
      }
    }

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
        sails.log.info(`Seeded default Super Admin: superadmin@prowise.com / ${process.env.INITIAL_ADMIN_PASSWORD ? '********' : 'Admin123!'}`);
      }
    }

    // Seed a default company_admin user if no admins exist
    const adminRole = await Role.findOne({ name: 'company_admin' }) || await Role.findOne({ name: 'administrator' });
    if (adminRole) {
      const adminExists = await User.findOne({ username: 'admin' });
      if (!adminExists) {
        // We'll assign it to the company seeded below if it exists, but for now just seed it
        await User.create({
          name: 'Company Admin',
          username: 'admin',
          email: 'admin@prowise.com',
          password: process.env.INITIAL_ADMIN_PASSWORD || 'Admin123!',
          role: adminRole.id,
          status: 'active'
        });
        sails.log.info(`Seeded default Company Admin: admin@prowise.com / ${process.env.INITIAL_ADMIN_PASSWORD ? '********' : 'Admin123!'}`);
      }
    }

    // Seed a default technician user
    const techRole = await Role.findOne({ name: 'technician' });
    if (techRole) {
      const techExists = await User.findOne({ username: 'technician' });
      if (!techExists) {
        await User.create({
          name: 'Tech Person',
          username: 'technician',
          email: 'technician@prowise.com',
          password: process.env.INITIAL_ADMIN_PASSWORD || 'Admin123!',
          role: techRole.id,
          status: 'active'
        });
        sails.log.info(`Seeded default Technician: technician@prowise.com / ${process.env.INITIAL_ADMIN_PASSWORD ? '********' : 'Admin123!'}`);
      }
    }

    // Seed a default company for initial testing
    const Company = sails.models.company;
    if (Company) {
      const companyExists = await Company.count();
      if (companyExists === 0) {
        const seededCompany = await Company.create({
          name: 'Atlas Copco (Industrial)',
          description: 'A world-leading provider of sustainable productivity solutions.'
        }).fetch();
        sails.log.info('Seeded default company: Atlas Copco');
        // We'll use this company for product seeding below
        sails.config.custom.defaultCompanyId = seededCompany.id;
      } else {
        const existingCompany = await Company.findOne({ name: 'Atlas Copco (Industrial)' });
        if (existingCompany) {
          sails.config.custom.defaultCompanyId = existingCompany.id;
        }
      }
    }
  }

  // Seed Guide Types
  const GuideType = sails.models.guidetype;
  if (!GuideType) {
    sails.log.warn('GuideType model not found, skipping seed.');
  } else {
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
  }

  // ── Clean up legacy seeded demo products ──
  // Remove only the known demo products that were previously auto-seeded.
  // This is safe to run repeatedly; if the products don't exist, nothing happens.
  const DEMO_PRODUCT_NAMES = ['Galaxy S23', 'iPhone 15', 'Pixel 8'];
  const Product = sails.models.product;
  if (Product) {
    const removed = await Product.destroy({ name: { in: DEMO_PRODUCT_NAMES } }).fetch();
    if (removed.length > 0) {
      sails.log.info(`Cleaned up ${removed.length} legacy demo product(s): ${removed.map(p => p.name).join(', ')}`);
    }
  }

  // Seed Root Categories (L0)
  const Category = sails.models.category;
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
      { name: 'Appliances', summary: 'Large and small household appliances', icon: 'microwave-outline' },
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

};
