import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { instagramApi } from './instagramApi.js';
import { instagramDirect } from './instagramDirect.js';
import { tunnelManager } from './tunnelManager.js';
import { scheduler } from './scheduler.js';

import { gpuManager } from './gpuManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REELS_DIR = path.join(__dirname, '..', 'rendered_reels');

const app = express();
const PORT = 5182;

app.use(cors());
app.use(express.json());

// Serve rendered videos publicly for Meta download
app.use('/videos', express.static(REELS_DIR));

// 1. System Status & Config (with GPU hardware acceleration info)
app.get('/api/status', (req, res) => {
  res.json({
    ok: true,
    config: scheduler.config,
    gpu: gpuManager.getLiveStats(),
    publicUrl: tunnelManager.getPublicUrl(),
    isJobRunning: scheduler.isJobRunning,
    cronExpression: scheduler.getCronExpression()
  });
});

// 1b. GPU Hardware Status
app.get('/api/gpu', (req, res) => {
  res.json({
    ok: true,
    gpu: gpuManager.getLiveStats()
  });
});

// 2. Update Settings
app.post('/api/settings', (req, res) => {
  try {
    scheduler.saveConfig(req.body);
    if (req.body.customPublicUrl !== undefined) {
      tunnelManager.setCustomUrl(req.body.customPublicUrl);
    }
    res.json({ ok: true, config: scheduler.config, cronExpression: scheduler.getCronExpression() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 3. Test Instagram Connection
app.post('/api/test-connection', async (req, res) => {
  try {
    const { accessToken, igUserId } = req.body;
    const info = await instagramApi.testConnection(
      accessToken || scheduler.config.accessToken,
      igUserId || scheduler.config.igUserId
    );
    res.json(info);
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// 3b. Auto-Discover Instagram Accounts from User Token (Meta API)
app.post('/api/auto-discover', async (req, res) => {
  try {
    const { token } = req.body;
    const result = await instagramApi.autoDiscoverAccounts(token || scheduler.config.accessToken);
    res.json(result);
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// 3c. Direct Instagram Login (Zero Facebook Needed!)
app.post('/api/direct/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await instagramDirect.loginWithCredentials(username, password);
    res.json(result);
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// 3d. Direct Interactive Browser Login (For 2FA / Human Verification)
app.post('/api/direct/interactive-login', async (req, res) => {
  try {
    const { username } = req.body || {};
    const result = await instagramDirect.openInteractiveLogin(username);
    res.json(result);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 3d-2. Import Session Cookies directly (Bypasses 2FA & automation verification)
app.post('/api/direct/import-cookies', async (req, res) => {
  try {
    const { cookieInput, username } = req.body;
    const result = await instagramDirect.importCookies({ cookieInput, username });
    res.json(result);
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// 3e. Check Direct Session Status
app.get('/api/direct/session', async (req, res) => {
  try {
    const result = await instagramDirect.checkSession();
    res.json(result);
  } catch (e) {
    res.json({ loggedIn: false, accounts: [] });
  }
});

// 3f. Switch Active Account (Multi-Account Support)
app.post('/api/direct/switch-account', (req, res) => {
  try {
    const { username } = req.body;
    const result = instagramDirect.setActiveAccount(username);
    res.json(result);
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// 3g. Remove an Account
app.post('/api/direct/remove-account', (req, res) => {
  try {
    const { username } = req.body;
    const result = instagramDirect.removeAccount(username);
    res.json(result);
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// 3h. Direct Logout / Clear All
app.post('/api/direct/logout', async (req, res) => {
  const { username } = req.body;
  if (username) {
    instagramDirect.removeAccount(username);
  }
  res.json({ ok: true });
});

// 4. One-Click Instant Post Now
app.post('/api/post-now', async (req, res) => {
  try {
    const { connectionMode = 'direct', targetAccount } = req.body;
    if (connectionMode === 'direct') {
      const activeAccount = targetAccount || instagramDirect.getAccountsData().activeAccount;
      if (!activeAccount || !instagramDirect.isAccountAuthenticated(activeAccount)) {
        return res.status(400).json({
          ok: false,
          error: `Instagram account @${activeAccount || 'unknown'} is not logged in yet. Please click 'Log In via Browser Window' in Tab 1 to complete your login.`
        });
      }
    }
    const result = await scheduler.executePost(req.body);
    res.json(result);
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// 5. Get Posting History Logs
app.get('/api/logs', (req, res) => {
  res.json({ ok: true, logs: scheduler.logs });
});

// 5b. List Rendered Reels Library (Instant Posting without re-rendering)
app.get('/api/rendered-videos', (req, res) => {
  try {
    if (!fs.existsSync(REELS_DIR)) {
      return res.json({ ok: true, videos: [] });
    }
    const files = fs.readdirSync(REELS_DIR)
      .filter(f => f.endsWith('.mp4'))
      .map(filename => {
        const fullPath = path.join(REELS_DIR, filename);
        const stats = fs.statSync(fullPath);
        let illusionType = 'custom';
        if (filename.includes('dancer')) illusionType = 'dancer';
        else if (filename.includes('helix')) illusionType = 'helix';
        else if (filename.includes('feet')) illusionType = 'feet';
        else if (filename.includes('cafe')) illusionType = 'cafe';

        return {
          filename,
          path: fullPath,
          sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
          createdAt: stats.mtime.toISOString(),
          mtimeMs: stats.mtimeMs,
          url: `/videos/${filename}`,
          illusionType
        };
      })
      .filter(v => parseFloat(v.sizeMB) > 0.05)
      .sort((a, b) => b.mtimeMs - a.mtimeMs);

    res.json({ ok: true, videos: files });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 5c. Delete a rendered video
app.delete('/api/rendered-videos/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(REELS_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.json({ ok: true, message: `Deleted ${filename}` });
    }
    res.status(404).json({ ok: false, error: 'File not found' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 6. Start Public Cloudflare Tunnel
app.post('/api/tunnel/start', async (req, res) => {
  try {
    const url = await tunnelManager.start();
    res.json({ ok: true, publicUrl: url });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Start Server and Scheduler
app.listen(PORT, async () => {
  console.log(`[MindBend API Server] Running on http://localhost:${PORT}`);
  scheduler.startSchedule();
  // Auto-start tunnel in background
  tunnelManager.start().catch(() => {});
});
