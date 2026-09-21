// Automated Posting Scheduler & Queue Engine
// Supports Hourly, Every N Hours, Daily at HH:MM, Custom Cron with Content Rotation
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderWorker } from './renderWorker.js';
import { instagramApi } from './instagramApi.js';
import { instagramDirect } from './instagramDirect.js';
import { tunnelManager } from './tunnelManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.join(__dirname, 'scheduler_config.json');
const LOGS_FILE = path.join(__dirname, 'posting_logs.json');

// Default Content Rotation Pool
const DEFAULT_HOOKS = [
  {
    hook: "Reverse this spin in your mind 🧠",
    sub: "Are you seeing clockwise or counter-clockwise? Comment below! 👇",
    reveal: "REVEALING THE TRUTH 🤯",
    revealSub: "Both directions are 100% visual mind tricks!"
  },
  {
    hook: "95% of people CANNOT reverse this 🌀",
    sub: "Focus on the outer edge to snap the direction!",
    reveal: "THE REVEAL IS HERE 🤯",
    revealSub: "Your brain invents the depth where none exists!"
  },
  {
    hook: "Which direction is this spinning? 🤔",
    sub: "Left or Right? Drop your answer in comments! 👇",
    reveal: "LOOK AT THE VISUAL CUE ⚡",
    revealSub: "The animation never changed—only your mind did!"
  },
  {
    hook: "Do these blocks move at the same speed? 🏎️",
    sub: "Watch closely: do they look like they are stepping?",
    reveal: "REMOVING THE STRIPES... 🤯",
    revealSub: "They move at the exact same constant speed side-by-side!"
  },
  {
    hook: "Are these horizontal lines parallel? 📐",
    sub: "Every row looks tilted, but are they?",
    reveal: "LASER RULER REVEAL 📐",
    revealSub: "Every line is 100% horizontal and straight!"
  },
  {
    hook: "Count the black dots in this grid 👁️",
    sub: "Notice how they vanish when you look directly at them! 👇",
    reveal: "REVEALING THE TRUTH 🤯",
    revealSub: "There are ZERO black dots! Your retinal ganglion cells invented them."
  },
  {
    hook: "Do you see the white triangle in front? 👁️",
    sub: "Look closely at the borders: does it look brighter?",
    reveal: "REVEALING THE TRUTH 🤯",
    revealSub: "There is NO triangle! Your visual cortex fabricated the edges."
  },
  {
    hook: "Which color is brighter: Left or Right? 🎨",
    sub: "Left looks dark green, right looks neon cyan! 👇",
    reveal: "REVEALING THE TRUTH 🤯",
    revealSub: "Both sides are the EXACT same color! The stripes tricked your brain."
  }
];

export class Scheduler {
  constructor() {
    this.cronTask = null;
    this.config = this.loadConfig();
    this.logs = this.loadLogs();
    this.isJobRunning = false;
  }

  loadConfig() {
    const defaultConfig = {
      enabled: false,
      frequencyType: 'hours', // 'hours' | 'daily' | 'cron'
      intervalHours: 4, // Every 4 hours default
      dailyTime: '09:00',
      cronExpression: '0 */4 * * *',
      accessToken: '',
      igUserId: '',
      shareToFeed: true,
      customPublicUrl: '',
      activeIllusions: ['dancer', 'helix', 'feet', 'cafe'],
      currentIndex: 0,
      hashtags: '#opticalillusion #mindtrick #brainteaser #reelsviral #neuroscience #mindbending'
    };

    try {
      if (fs.existsSync(CONFIG_FILE)) {
        return { ...defaultConfig, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')) };
      }
    } catch (e) {
      console.warn("[Scheduler] Error loading config, using defaults");
    }
    return defaultConfig;
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
    } catch (e) {
      console.error("[Scheduler] Error saving config:", e);
    }
    this.restartSchedule();
  }

  loadLogs() {
    try {
      if (fs.existsSync(LOGS_FILE)) {
        return JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
      }
    } catch (e) {}
    return [];
  }

  addLog(entry) {
    const logItem = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.logs.unshift(logItem);
    if (this.logs.length > 100) this.logs = this.logs.slice(0, 100);
    try {
      fs.writeFileSync(LOGS_FILE, JSON.stringify(this.logs, null, 2));
    } catch (e) {}
    return logItem;
  }

  getCronExpression() {
    if (this.config.frequencyType === 'cron') {
      return this.config.cronExpression || '0 */4 * * *';
    }
    if (this.config.frequencyType === 'daily') {
      const [hour, minute] = (this.config.dailyTime || '09:00').split(':');
      return `${minute || 0} ${hour || 9} * * *`;
    }
    // 'hours' interval
    const h = Math.max(1, Math.min(24, parseInt(this.config.intervalHours) || 4));
    return `0 */${h} * * *`;
  }

  startSchedule() {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
    }

    if (!this.config.enabled) {
      console.log("[Scheduler] Auto-posting is currently DISABLED.");
      return;
    }

    const expr = this.getCronExpression();
    console.log(`[Scheduler] Starting cron job with expression: "${expr}"`);

    this.cronTask = cron.schedule(expr, async () => {
      console.log(`[Scheduler] Cron trigger fired! Executing scheduled post...`);
      try {
        await this.executePost();
      } catch (err) {
        console.error("[Scheduler] Scheduled post failed:", err);
      }
    });
  }

  restartSchedule() {
    this.startSchedule();
  }

  // Execute a post (called either manually or via cron)
  async executePost(options = {}) {
    if (this.isJobRunning) {
      throw new Error("A post execution is already in progress");
    }

    this.isJobRunning = true;
    const startTime = Date.now();

    try {
      const connectionMode = options.connectionMode || this.config.connectionMode || 'direct';
      const { accessToken, igUserId, activeIllusions, hashtags, shareToFeed } = this.config;
      const effectiveToken = options.accessToken || accessToken;
      const effectiveUserId = options.igUserId || igUserId;

      if (connectionMode === 'meta_api') {
        if (!effectiveToken || !effectiveUserId) {
          throw new Error("Instagram Access Token or User ID is not configured in Admin Settings");
        }
      }

      // Pick illusion from rotation
      const illusions = activeIllusions && activeIllusions.length > 0 ? activeIllusions : ['dancer', 'helix'];
      const illusionId = options.illusionId || illusions[this.config.currentIndex % illusions.length];
      this.config.currentIndex = (this.config.currentIndex + 1) % illusions.length;
      this.saveConfig({ currentIndex: this.config.currentIndex });

      // Pick hook & caption
      const randomHook = DEFAULT_HOOKS[Math.floor(Math.random() * DEFAULT_HOOKS.length)];
      const hookText = options.hookText || randomHook.hook;
      const subText = options.subText || randomHook.sub;
      const revealText = options.revealText || randomHook.reveal;
      const revealSubText = options.revealSubText || randomHook.revealSub;

      const fullCaption = `${hookText}\n\n${subText}\n\nFollow for daily visual neuroscience hacks! 🧠\n\n${hashtags || ''}`;

      // 1. Resolve Video: Use existing rendered video OR render fresh
      let renderResult = null;
      let usedExisting = false;
      const reelsDir = path.join(__dirname, '..', 'rendered_reels');

      if (!options.renderFresh) {
        let candidatePath = null;

        if (options.videoPath && fs.existsSync(options.videoPath)) {
          candidatePath = options.videoPath;
        } else if (options.videoFilename) {
          const directFile = path.join(reelsDir, options.videoFilename);
          if (fs.existsSync(directFile)) {
            candidatePath = directFile;
          }
        } else if (options.useLatestVideo) {
          if (fs.existsSync(reelsDir)) {
            const mp4s = fs.readdirSync(reelsDir)
              .filter(f => f.endsWith('.mp4'))
              .map(f => {
                const fullP = path.join(reelsDir, f);
                const s = fs.statSync(fullP);
                return { filename: f, path: fullP, mtime: s.mtimeMs, size: s.size };
              })
              .filter(f => f.size > 10000)
              .sort((a, b) => b.mtime - a.mtime);

            if (mp4s.length > 0) {
              candidatePath = mp4s[0].path;
            }
          }
        }

        if (candidatePath && fs.existsSync(candidatePath)) {
          const stats = fs.statSync(candidatePath);
          const fname = path.basename(candidatePath);
          const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          console.log(`[Scheduler] ⚡ Using existing rendered video: ${fname} (${sizeMB} MB) - SKIPPING rendering!`);
          renderResult = {
            ok: true,
            filename: fname,
            outputPath: candidatePath,
            sizeMB,
            gpuAccelerated: false,
            isExisting: true
          };
          usedExisting = true;
        }
      }

      if (!renderResult) {
        // Render Video Headlessly
        console.log(`[Scheduler] [1/4] Rendering fresh 60FPS video for ${illusionId}...`);
        renderResult = await renderWorker.renderIllusionReel({
          illusionId,
          duration: options.duration || 10,
          hookText,
          subText,
          revealText,
          revealSubText
        });
      }

      // 2. Publish based on connection mode
      let publishResult = null;

      if (connectionMode === 'direct') {
        // Option A: Direct Instagram Web (Zero Facebook Required!)
        console.log(`[Scheduler] [2/3] Uploading Reel directly to Instagram Web...`);
        publishResult = await instagramDirect.publishReelDirect({
          videoPath: renderResult.outputPath,
          caption: fullCaption,
          targetAccount: options.targetAccount,
          onProgress: (p) => console.log(`[Scheduler Progress] ${p.message}`)
        });
      } else {
        // Option B: Meta Graph API (Requires Facebook Page)
        console.log(`[Scheduler] [2/3] Ensuring public HTTPS tunnel for Meta...`);
        await tunnelManager.start();
        const videoPublicUrl = tunnelManager.getVideoPublicUrl(renderResult.filename);
        console.log(`[Scheduler] Public video URL for Meta: ${videoPublicUrl}`);

        console.log(`[Scheduler] [3/3] Uploading container and publishing to Meta API...`);
        publishResult = await instagramApi.executeFullPublish({
          accessToken: effectiveToken,
          igUserId: effectiveUserId,
          videoPublicUrl,
          caption: fullCaption,
          shareToFeed: shareToFeed ?? true,
          onProgress: (p) => console.log(`[Scheduler Progress] ${p.message}`)
        });
      }

      // 3. Log Success
      const logEntry = this.addLog({
        status: 'SUCCESS',
        method: connectionMode === 'direct' ? 'Direct Instagram (No Facebook)' : 'Meta Graph API',
        illusionId,
        hookText,
        mediaId: publishResult.mediaId || `reel_${Date.now()}`,
        permalink: publishResult.permalink || 'https://www.instagram.com/',
        videoFile: renderResult.filename,
        usedExisting: !!usedExisting,
        durationSec: ((Date.now() - startTime) / 1000).toFixed(1)
      });

      return {
        ok: true,
        logEntry,
        publishResult
      };

    } catch (err) {
      this.addLog({
        status: 'FAILED',
        error: err.message,
        durationSec: ((Date.now() - startTime) / 1000).toFixed(1)
      });
      throw err;
    } finally {
      this.isJobRunning = false;
    }
  }
}

export const scheduler = new Scheduler();
