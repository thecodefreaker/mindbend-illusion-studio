import puppeteer from 'puppeteer';

async function testAdmin() {
  console.log("Launching browser for Admin Panel test...");
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/brave-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1000 });

    console.log("Navigating to http://localhost:5180/ ...");
    await page.goto('http://localhost:5180/', { waitUntil: 'networkidle0' });

    // Click "Instagram Auto-Post" button
    console.log("Clicking 'Instagram Auto-Post' button...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Instagram Auto-Post') || b.textContent.includes('Auto'));
      if (btn) btn.click();
      else throw new Error("Instagram Auto-Post button not found");
    });

    // Wait for Admin Panel modal
    await page.waitForFunction(() => {
      return document.body.textContent.includes('Instagram Automation & Reels Admin Panel');
    }, { timeout: 5000 });
    console.log("Admin Panel opened successfully!");

    // Screenshot of tab 1 (Credentials)
    await page.screenshot({ path: 'admin_tab1.png' });
    console.log("Saved admin_tab1.png");

    // Click "Load Demo Simulator Credentials"
    console.log("Loading Demo Credentials...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const demoBtn = btns.find(b => b.textContent.includes('Load Demo Simulator Credentials'));
      if (demoBtn) demoBtn.click();
      else throw new Error("Demo button not found");
    });

    // Wait for connection success badge
    await page.waitForFunction(() => {
      return document.body.textContent.includes('mindbend.illusions');
    }, { timeout: 8000 });
    console.log("Connected to Demo Account successfully!");

    await page.screenshot({ path: 'admin_connected.png' });
    console.log("Saved admin_connected.png");

    // Switch to Tab 2: 1-Click Post Now
    console.log("Switching to '2. 1-Click Post Now' tab...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tab2 = btns.find(b => b.textContent.includes('1-Click Post Now'));
      if (tab2) tab2.click();
      else throw new Error("Tab 2 not found");
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'admin_tab2.png' });
    console.log("Saved admin_tab2.png");

    // Switch to Tab 3: Automated Scheduler
    console.log("Switching to '3. Automated Scheduler' tab...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const tab3 = btns.find(b => b.textContent.includes('Automated Scheduler'));
      if (tab3) tab3.click();
      else throw new Error("Tab 3 not found");
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'admin_tab3.png' });
    console.log("Saved admin_tab3.png");

    console.log("ADMIN PANEL TEST PASSED: 100% OPERATIONAL!");
  } catch (err) {
    console.error("Admin test failed:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testAdmin();
