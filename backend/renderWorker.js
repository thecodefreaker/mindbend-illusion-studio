// Headless Video Rendering Worker using Puppeteer
// Generates 60FPS MP4 videos in the background without needing a user browser open
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { gpuManager } from './gpuManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REELS_DIR = path.join(__dirname, '..', 'rendered_reels');

export class RenderWorker {
  constructor() {
    this.isRendering = false;
  }

  // Render video from illusion canvas
  async renderIllusionReel({
    illusionId = 'dancer',
    duration = 20,
    hookText = 'Reverse this spin in your mind 🧠',
    subText = 'Focus on the center: snap the direction!',
    enableTruthReveal = true,
    revealText = 'REVEALING THE TRUTH 🤯',
    revealSubText = 'Both directions are visual mind tricks!'
  }) {
    if (this.isRendering) {
      throw new Error("Render pipeline is currently busy rendering another video.");
    }

    this.isRendering = true;
    let browser = null;

    try {
      if (!fs.existsSync(REELS_DIR)) {
        fs.mkdirSync(REELS_DIR, { recursive: true });
      }

      console.log(`[RenderWorker] 🎮 Launching GPU-accelerated browser for ${illusionId} (${duration}s)...`);
      browser = await puppeteer.launch({
        headless: 'new',
        executablePath: '/usr/bin/brave-browser',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--ignore-gpu-blocklist',
          '--enable-gpu',
          '--enable-gpu-rasterization',
          '--enable-zero-copy',
          '--enable-accelerated-video-decode',
          '--use-gl=angle',
          '--use-fake-ui-for-media-stream',
          '--autoplay-policy=no-user-gesture-required'
        ]
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1400, height: 1000 });

      // Navigate to the app (running on port 5180)
      const appUrl = process.env.APP_URL || 'http://localhost:5180/';
      await page.goto(appUrl, { waitUntil: 'networkidle0' });

      // Switch to the target illusion tab
      await page.evaluate((targetId) => {
        const btns = Array.from(document.querySelectorAll('button'));
        const tabBtn = btns.find(b => b.textContent.toLowerCase().includes(targetId));
        if (tabBtn) tabBtn.click();
      }, illusionId);

      await new Promise(r => setTimeout(r, 800));

      // Open Video Studio
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.textContent.includes('Create Reel') || b.textContent.includes('Create Instagram Reel') || b.textContent.includes('Create Video Clip'));
        if (btn) btn.click();
      });

      // Configure settings in modal
      await page.waitForFunction(() => {
        return document.body.textContent.includes('Instagram Reels') || document.body.textContent.includes('Short Video Studio');
      }, { timeout: 6000 });

      // Inject custom text and duration into modal
      await page.evaluate(({ duration, hookText, subText, enableTruthReveal, revealText, revealSubText }) => {
        // Find inputs
        const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
        if (inputs.length >= 1 && hookText) {
          inputs[0].value = hookText;
          inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (inputs.length >= 2 && subText) {
          inputs[1].value = subText;
          inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (inputs.length >= 3 && revealText) {
          inputs[2].value = revealText;
          inputs[2].dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (inputs.length >= 4 && revealSubText) {
          inputs[3].value = revealSubText;
          inputs[3].dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Pick duration button
        const durBtns = Array.from(document.querySelectorAll('button'));
        const targetDurBtn = durBtns.find(b => b.textContent.trim() === `${duration}s`);
        if (targetDurBtn) targetDurBtn.click();

        // Click Start / Generate
        const generateBtn = durBtns.find(b => b.textContent.includes('Generate') || b.textContent.includes('Start Recording'));
        if (generateBtn) generateBtn.click();
      }, { duration, hookText, subText, enableTruthReveal, revealText, revealSubText });

      // Wait for rendering to complete
      console.log(`[RenderWorker] Recording canvas stream for ${duration}s...`);
      await page.waitForFunction(() => {
        return document.body.textContent.includes('Ready for Instagram') || document.body.textContent.includes('Rendered Successfully');
      }, { timeout: (duration + 20) * 1000 });

      // Extract video blob data via page evaluate
      console.log(`[RenderWorker] Extracting rendered video buffer...`);
      const base64Data = await page.evaluate(async () => {
        const videoEl = document.querySelector('video');
        if (!videoEl || !videoEl.src) throw new Error("Video element not found");
        const res = await fetch(videoEl.src);
        const blob = await res.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(blob);
        });
      });

      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `reel_${illusionId}_${Date.now()}.mp4`;
      const outputPath = path.join(REELS_DIR, filename);
      const rawPath = path.join(REELS_DIR, `raw_${Date.now()}.webm`);

      fs.writeFileSync(rawPath, buffer);
      console.log(`[RenderWorker] Raw recording captured (${(buffer.length / (1024 * 1024)).toFixed(2)} MB). Processing with GPU...`);

      const gpuResult = await gpuManager.transcodeWithGpu(rawPath, outputPath);
      const finalStats = fs.statSync(outputPath);
      const finalSizeMB = (finalStats.size / (1024 * 1024)).toFixed(2);

      console.log(`[RenderWorker] 🚀 Video encoded with ${gpuResult.encoder}: ${outputPath} (${finalSizeMB} MB)`);

      return {
        ok: true,
        filename,
        outputPath,
        sizeMB: finalSizeMB,
        gpuAccelerated: gpuResult.gpuAccelerated,
        encoder: gpuResult.encoder
      };

    } finally {
      this.isRendering = false;
      if (browser) {
        try {
          await browser.close();
        } catch (e) {}
      }
    }
  }
}

export const renderWorker = new RenderWorker();
