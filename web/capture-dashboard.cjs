const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1440, height: 1080 });
  await page.goto('http://localhost:5173/login');
  
  // Login first
  await page.type('input[type="email"]', 'admin@example.com');
  await page.type('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  // Wait for login and navigation
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  
  // Now navigate to the dashboard explicitly if not already there
  await page.goto('http://localhost:5173/admin/dashboard', { waitUntil: 'networkidle0' });
  
  // Wait for 2 seconds to let animations settle
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: 'dashboard-defect.png', fullPage: true });
  await browser.close();
  
  console.log('Screenshot saved to dashboard-defect.png');
})();
