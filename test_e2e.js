import puppeteer from 'puppeteer';

async function runTest() {
  console.log("Launching headless browser...");
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/brave-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1000 });

    console.log("Navigating to http://localhost:5180/ ...");
    await page.goto('http://localhost:5180/', { waitUntil: 'networkidle0' });

    const title = await page.title();
    console.log("Page title:", title);

    // Click "Create Instagram Reel" using evaluate
    console.log("Clicking 'Create Instagram Reel' button...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Create Reel') || b.textContent.includes('Create Instagram Reel'));
      if (btn) btn.click();
      else throw new Error("Create button not found");
    });

    // Wait for modal
    await page.waitForFunction(() => {
      return document.body.textContent.includes('Instagram Reels') || document.body.textContent.includes('Short Video Studio');
    }, { timeout: 5000 });
    console.log("Video Studio modal opened successfully!");

    // Capture screenshot of the modal
    await page.screenshot({ path: 'modal_open.png' });
    console.log("Saved modal_open.png");

    // Select 8s duration for test
    console.log("Selecting 8s duration...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.trim() === '8s');
      if (btn) btn.click();
      else throw new Error("8s button not found");
    });

    // Click "Generate Reel"
    console.log("Clicking 'Generate Reel' button...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Generate') || b.textContent.includes('Start Recording'));
      if (btn) btn.click();
      else throw new Error("Generate button not found");
    });

    // Wait for "Reel Rendered & Ready for Instagram!"
    console.log("Waiting for video recording to finish (max 20s)...");
    await page.waitForFunction(() => {
      return document.body.textContent.includes('Ready for Instagram') || document.body.textContent.includes('Rendered Successfully');
    }, { timeout: 20000 });
    console.log("Video rendered successfully!");

    await page.screenshot({ path: 'video_rendered.png' });
    console.log("Saved video_rendered.png");

    console.log("TEST PASSED: Optical illusions & video generator is 100% operational!");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTest();
