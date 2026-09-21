// Direct Instagram Web Automation Client (No Facebook Required)
// Features Multi-Account Isolation: Each account has its own independent session profile
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROFILES_BASE_DIR = path.join(__dirname, '..', 'instagram_profiles');
const ACCOUNTS_INDEX_FILE = path.join(__dirname, 'instagram_accounts.json');

export class InstagramDirectClient {
  constructor() {
    this.profilesBaseDir = PROFILES_BASE_DIR;
    this.indexFile = ACCOUNTS_INDEX_FILE;
    if (!fs.existsSync(this.profilesBaseDir)) {
      fs.mkdirSync(this.profilesBaseDir, { recursive: true });
    }
  }

  // Get isolated browser profile directory for a specific username
  getAccountDir(username) {
    const safeName = (username || 'default').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const dir = path.join(this.profilesBaseDir, safeName);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  // Load list of all connected accounts
  getAccountsData() {
    const defaultData = { activeAccount: null, accounts: [] };
    try {
      if (fs.existsSync(this.indexFile)) {
        return { ...defaultData, ...JSON.parse(fs.readFileSync(this.indexFile, 'utf-8')) };
      }
    } catch (e) {}
    return defaultData;
  }

  saveAccountsData(data) {
    try {
      fs.writeFileSync(this.indexFile, JSON.stringify(data, null, 2));
    } catch (e) {}
  }

  // Check if an account has valid authenticated session cookies in its isolated profile
  isAccountAuthenticated(username) {
    if (!username) return false;
    const accountDir = this.getAccountDir(username);
    const backupJson = path.join(accountDir, 'cookies.json');
    if (fs.existsSync(backupJson)) {
      try {
        const raw = fs.readFileSync(backupJson, 'utf-8');
        if (raw.includes('sessionid')) return true;
      } catch (e) {}
    }
    const possibleCookies = [
      path.join(accountDir, 'Default', 'Network', 'Cookies'),
      path.join(accountDir, 'Default', 'Cookies')
    ];
    for (const cp of possibleCookies) {
      if (fs.existsSync(cp)) {
        try {
          const data = fs.readFileSync(cp);
          if (data.includes(Buffer.from('sessionid'))) {
            return true;
          }
        } catch (e) {}
      }
    }
    return false;
  }

  // Check overall session status and active account
  async checkSession() {
    const data = this.getAccountsData();
    if (!data.activeAccount || data.accounts.length === 0) {
      return {
        loggedIn: false,
        activeAccount: null,
        accounts: []
      };
    }

    const verifiedAccounts = data.accounts.map(acc => {
      const isAuth = this.isAccountAuthenticated(acc.username);
      return {
        ...acc,
        authenticated: isAuth
      };
    });

    const active = verifiedAccounts.find(a => a.username.toLowerCase() === data.activeAccount.toLowerCase());
    const isOverallLoggedIn = active ? !!active.authenticated : false;

    return {
      loggedIn: isOverallLoggedIn,
      activeAccount: data.activeAccount,
      accounts: verifiedAccounts,
      currentAccount: active || { username: data.activeAccount, authenticated: false }
    };
  }

  // Switch which account is currently active for posting
  setActiveAccount(username) {
    const data = this.getAccountsData();
    const clean = username.toLowerCase();
    const exists = data.accounts.find(a => a.username.toLowerCase() === clean);
    if (!exists) {
      throw new Error(`Account @${username} is not registered yet.`);
    }
    data.activeAccount = exists.username;
    this.saveAccountsData(data);
    return { ok: true, activeAccount: exists.username, accounts: data.accounts };
  }

  // Remove an account profile
  removeAccount(username) {
    const data = this.getAccountsData();
    const clean = username.toLowerCase();
    data.accounts = data.accounts.filter(a => a.username.toLowerCase() !== clean);
    if (data.activeAccount && data.activeAccount.toLowerCase() === clean) {
      data.activeAccount = data.accounts.length > 0 ? data.accounts[0].username : null;
    }
    this.saveAccountsData(data);

    // Remove directory
    try {
      const dir = this.getAccountDir(clean);
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } catch (e) {}

    return { ok: true, accounts: data.accounts, activeAccount: data.activeAccount };
  }

  // Add or update an account in index
  registerAccount(username) {
    const data = this.getAccountsData();
    const clean = username.toLowerCase();
    const existingIndex = data.accounts.findIndex(a => a.username.toLowerCase() === clean);
    const accountObj = {
      username: username.replace('@', ''),
      lastActive: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      data.accounts[existingIndex] = { ...data.accounts[existingIndex], ...accountObj };
    } else {
      data.accounts.push(accountObj);
    }

    data.activeAccount = accountObj.username;
    this.saveAccountsData(data);
  }

  // Parse any cookie format (raw token, key=value, header, JSON array, Netscape)
  parseCookieInput(input) {
    if (!input || typeof input !== 'string') return [];
    input = input.trim();
    const cookies = [];

    // 1. JSON Array format (Cookie-Editor, EditThisCookie)
    if ((input.startsWith('[') && input.endsWith(']')) || (input.startsWith('{') && input.endsWith('}'))) {
      try {
        const parsed = JSON.parse(input);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of arr) {
          if (item.name && item.value) {
            cookies.push({
              name: item.name,
              value: item.value,
              domain: item.domain || '.instagram.com',
              path: item.path || '/',
              secure: true,
              httpOnly: item.name === 'sessionid',
              expires: item.expirationDate || (Math.floor(Date.now() / 1000) + 31536000)
            });
          }
        }
        if (cookies.length > 0) return cookies;
      } catch (e) {}
    }

    // 2. Netscape format (tab separated lines)
    if (input.includes('\t')) {
      const lines = input.split('\n');
      for (const line of lines) {
        const parts = line.split('\t').map(p => p.trim());
        if (parts.length >= 7) {
          cookies.push({
            name: parts[5],
            value: parts[6],
            domain: parts[0] || '.instagram.com',
            path: parts[2] || '/',
            secure: parts[3] === 'TRUE',
            httpOnly: parts[5] === 'sessionid',
            expires: parseInt(parts[4]) || (Math.floor(Date.now() / 1000) + 31536000)
          });
        }
      }
      if (cookies.length > 0) return cookies;
    }

    // 3. Cookie Header string (key=val; key2=val2)
    if (input.includes('=') || input.includes(';')) {
      const pairs = input.split(';');
      for (const pair of pairs) {
        const idx = pair.indexOf('=');
        if (idx > -1) {
          const name = pair.slice(0, idx).trim();
          const value = pair.slice(idx + 1).trim();
          if (name && value) {
            cookies.push({
              name,
              value,
              domain: '.instagram.com',
              path: '/',
              secure: true,
              httpOnly: name === 'sessionid',
              expires: Math.floor(Date.now() / 1000) + 31536000
            });
          }
        }
      }
      if (cookies.some(c => c.name === 'sessionid')) return cookies;
    }

    // 4. Pure raw sessionid token (e.g. 69482938472%3AS7d8g...)
    if (input.length > 10 && !input.includes(' ') && !input.includes('\n')) {
      cookies.push({
        name: 'sessionid',
        value: input,
        domain: '.instagram.com',
        path: '/',
        secure: true,
        httpOnly: true,
        expires: Math.floor(Date.now() / 1000) + 31536000
      });
      const match = input.match(/^([0-9]+)(?:%3A|:)/);
      if (match) {
        cookies.push({
          name: 'ds_user_id',
          value: match[1],
          domain: '.instagram.com',
          path: '/',
          secure: true,
          httpOnly: false,
          expires: Math.floor(Date.now() / 1000) + 31536000
        });
      }
      return cookies;
    }

    return cookies;
  }

  // Import session cookies directly (Bypasses 2FA & automation verification completely)
  async importCookies({ cookieInput, username = '' }) {
    const cookies = this.parseCookieInput(cookieInput);
    const sessionCookie = cookies.find(c => c.name === 'sessionid');
    if (!sessionCookie || !sessionCookie.value) {
      throw new Error("Could not find 'sessionid' in the provided cookies. Please make sure you paste the sessionid cookie value or the full cookie list.");
    }

    const defaultUsername = username ? username.trim().replace('@', '') : 'active_account';
    const accountDir = this.getAccountDir(defaultUsername);
    let browser = null;

    try {
      console.log(`[InstagramDirect] Importing cookies for @${defaultUsername} into ${accountDir}...`);
      browser = await puppeteer.launch({
        headless: 'new',
        executablePath: '/usr/bin/brave-browser',
        userDataDir: accountDir,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled'
        ]
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Inject cookies with proper url and expiration
      const preparedCookies = cookies.map(c => ({
        name: c.name,
        value: c.value,
        domain: '.instagram.com',
        path: c.path || '/',
        url: 'https://www.instagram.com',
        secure: true,
        httpOnly: c.name === 'sessionid',
        expires: c.expires || (Math.floor(Date.now() / 1000) + 31536000)
      }));

      await page.setCookie(...preparedCookies);

      // Verify on Instagram
      console.log(`[InstagramDirect] Verifying cookie session on https://www.instagram.com/...`);
      await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2', timeout: 35000 });
      await new Promise(r => setTimeout(r, 2000));

      const pageUrl = page.url();
      const isLoginPage = pageUrl.includes('/accounts/login') || pageUrl.includes('/challenge');
      const hasLoginInput = await page.$('input[name="username"], input[name="email"], input[name="pass"]');

      if (isLoginPage || hasLoginInput) {
        throw new Error("The sessionid cookie appears to be invalid or expired. Instagram redirected to the login page. Please check that you copied a fresh sessionid from an active Instagram tab.");
      }

      // Try to detect username from page
      let detectedUsername = await page.evaluate(() => {
        const avatar = document.querySelector('img[alt$="\'s profile picture"]');
        if (avatar) {
          const alt = avatar.getAttribute('alt');
          const m = alt.match(/^(.+?)'s profile picture$/);
          if (m && m[1]) return m[1].trim();
        }
        const reserved = ['accounts', 'explore', 'reels', 'direct', 'stories', 'create', 'your_activity', 'legal', 'help', 'about', 'privacy', 'terms', 'reset', 'password', 'login', 'emailsignup', 'p'];
        const links = Array.from(document.querySelectorAll('a[href^="/"]'));
        for (const l of links) {
          const href = l.getAttribute('href') || '';
          const match = href.match(/^\/([a-zA-Z0-9._]{2,30})\/?$/);
          if (match && match[1] && !reserved.includes(match[1].toLowerCase())) {
            return match[1].trim();
          }
        }
        return null;
      });

      const finalUsername = (detectedUsername && detectedUsername.length > 1) 
        ? detectedUsername 
        : (defaultUsername !== 'active_account' ? defaultUsername : 'instagram_user');

      // If directory name differs, copy/move profile
      const actualDir = this.getAccountDir(finalUsername);
      if (accountDir !== actualDir && fs.existsSync(accountDir)) {
        try {
          fs.cpSync(accountDir, actualDir, { recursive: true });
        } catch (e) {}
      }

      // Save cookie backup JSON
      try {
        const currentCookies = await page.cookies();
        fs.writeFileSync(path.join(actualDir, 'cookies.json'), JSON.stringify(currentCookies, null, 2));
      } catch (e) {}

      // Register and set active
      this.registerAccount(finalUsername);
      console.log(`[InstagramDirect] Cookie import SUCCESS for @${finalUsername}!`);

      return {
        ok: true,
        username: finalUsername,
        activeAccount: finalUsername,
        accounts: this.getAccountsData().accounts,
        message: `Successfully authenticated @${finalUsername} using your session cookie!`
      };

    } finally {
      if (browser) {
        try { await browser.close(); } catch (e) {}
      }
    }
  }

  // Automated Login for a specific account using Username & Password
  async loginWithCredentials(username, password) {
    if (!username || !password) {
      throw new Error("Please provide both Instagram username and password.");
    }

    const cleanUsername = username.trim().replace('@', '');
    const accountDir = this.getAccountDir(cleanUsername);
    let browser = null;

    try {
      console.log(`[InstagramDirect] Logging in for @${cleanUsername} in isolated directory: ${accountDir}`);
      browser = await puppeteer.launch({
        headless: 'new',
        executablePath: '/usr/bin/brave-browser',
        userDataDir: accountDir,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled'
        ]
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));

      // Check if genuinely authenticated via session cookie
      const initialCookies = await page.cookies();
      if (initialCookies.some(c => c.name === 'sessionid')) {
        console.log(`[InstagramDirect] Confirmed active session for @${cleanUsername}!`);
        this.registerAccount(cleanUsername);
        return { ok: true, username: cleanUsername, accounts: (await this.checkSession()).accounts };
      }

      // Auto-dismiss cookie consent banner if present
      try {
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button, div[role="button"]'));
          const target = btns.find(b => {
            const txt = (b.textContent || '').toLowerCase();
            return txt.includes('allow all cookies') || txt.includes('allow essential') || txt.includes('accept all') || txt.includes('decline optional');
          });
          if (target) target.click();
        });
      } catch (e) {}
      await new Promise(r => setTimeout(r, 1000));

      // Enter credentials (supports both standard 'username' and Meta 'email' fields)
      const usernameSelectors = [
        'input[name="email"]',
        'input[name="username"]',
        'input[autocomplete="username"]',
        'input[type="text"]'
      ];
      let usernameInput = null;
      for (const sel of usernameSelectors) {
        try {
          usernameInput = await page.waitForSelector(sel, { timeout: 3500 });
          if (usernameInput) break;
        } catch (e) {}
      }

      if (!usernameInput) {
        throw new Error("Could not find Instagram login field. Please click 'Log In via Browser Window' to log in on screen.");
      }

      const passwordSelectors = [
        'input[name="pass"]',
        'input[name="password"]',
        'input[type="password"]'
      ];
      let passwordInput = null;
      for (const sel of passwordSelectors) {
        try {
          passwordInput = await page.waitForSelector(sel, { timeout: 3000 });
          if (passwordInput) break;
        } catch (e) {}
      }

      if (!passwordInput) {
        throw new Error("Could not find Instagram password field. Please click 'Log In via Browser Window'.");
      }

      await usernameInput.click({ clickCount: 3 });
      await usernameInput.type(cleanUsername, { delay: 35 });
      await new Promise(r => setTimeout(r, 300));

      await passwordInput.click({ clickCount: 3 });
      await passwordInput.type(password, { delay: 35 });
      await new Promise(r => setTimeout(r, 500));

      // Click submit
      const submitSelectors = [
        'input[type="submit"]',
        'button[type="submit"]',
        'form input[type="submit"]',
        'form button'
      ];
      let clickedSubmit = false;
      for (const sel of submitSelectors) {
        try {
          const btn = await page.$(sel);
          if (btn) {
            await btn.click();
            clickedSubmit = true;
            break;
          }
        } catch (e) {}
      }
      if (!clickedSubmit) {
        await page.keyboard.press('Enter');
      }

      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 25000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 3000));

      const postLoginUrl = page.url();

      if (postLoginUrl.includes('/two_factor') || postLoginUrl.includes('/challenge/')) {
        throw new Error("Two-Factor Authentication (2FA) or Security Checkpoint detected. Please click 'Log In via Browser Window' to complete it on screen.");
      }

      const errorEl = await page.$('#slfErrorAlert, div[role="alert"], p[role="alert"]');
      if (errorEl) {
        const errorText = await page.evaluate(el => el.textContent, errorEl);
        if (errorText && errorText.trim()) {
          throw new Error(`Instagram error: ${errorText.trim()}`);
        }
      }

      // Check cookies to confirm session
      const cookies = await page.cookies();
      const hasSession = cookies.some(c => c.name === 'sessionid');
      if (!hasSession) {
        throw new Error("Instagram authentication requires 2FA or security verification on screen. Please click 'Log In via Browser Window'.");
      }

      // Dismiss "Save Info" or "Notifications"
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const saveBtn = btns.find(b => 
          b.textContent.includes('Save info') || 
          b.textContent.includes('Not now') || 
          b.textContent.includes('Cancel')
        );
        if (saveBtn) saveBtn.click();
      });

      this.registerAccount(cleanUsername);
      console.log(`[InstagramDirect] Successfully saved session for @${cleanUsername}!`);

      return {
        ok: true,
        username: cleanUsername,
        activeAccount: cleanUsername,
        accounts: this.getAccountsData().accounts
      };

    } finally {
      if (browser) {
        try { await browser.close(); } catch (e) {}
      }
    }
  }

  // Open a visible browser window for interactive login (supports 2FA / account switching)
  async openInteractiveLogin(targetUsername = '') {
    const cleanUsername = targetUsername ? targetUsername.trim().replace('@', '') : 'active_account';
    const accountDir = this.getAccountDir(cleanUsername);

    console.log(`[InstagramDirect] Launching visible browser in: ${accountDir}`);
    const browser = await puppeteer.launch({
      headless: false,
      executablePath: '/usr/bin/brave-browser',
      userDataDir: accountDir,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' });

    // Poll to detect when user actually completes login
    const checkInterval = setInterval(async () => {
      try {
        const cookies = await page.cookies();
        const hasSession = cookies.some(c => c.name === 'sessionid');
        const url = page.url();

        // Must have verified session cookie and not be on login/reset pages
        if (hasSession && !url.includes('/login') && !url.includes('/challenge') && !url.includes('/two_factor') && !url.includes('/password/reset')) {
          // Detect logged-in username
          let detectedUsername = await page.evaluate(() => {
            // Check profile avatar alt
            const avatar = document.querySelector('img[alt$="\'s profile picture"]');
            if (avatar) {
              const alt = avatar.getAttribute('alt');
              const match = alt.match(/^(.+?)'s profile picture$/);
              if (match && match[1]) return match[1].trim();
            }

            // Check sidebar navigation link
            const reserved = ['accounts', 'explore', 'reels', 'direct', 'stories', 'create', 'your_activity', 'legal', 'help', 'about', 'privacy', 'terms', 'reset', 'password', 'login', 'emailsignup', 'p'];
            const links = Array.from(document.querySelectorAll('a[href^="/"]'));
            for (const l of links) {
              const href = l.getAttribute('href') || '';
              const match = href.match(/^\/([a-zA-Z0-9._]{2,30})\/?$/);
              if (match && match[1] && !reserved.includes(match[1].toLowerCase())) {
                return match[1].trim();
              }
            }
            return null;
          });

          if (!detectedUsername && cleanUsername && cleanUsername !== 'active_account') {
            detectedUsername = cleanUsername;
          }

          if (detectedUsername && detectedUsername.length > 1 && !detectedUsername.toLowerCase().includes('password')) {
            clearInterval(checkInterval);
            const actualDir = this.getAccountDir(detectedUsername);
            if (accountDir !== actualDir && fs.existsSync(accountDir)) {
              try {
                fs.cpSync(accountDir, actualDir, { recursive: true });
              } catch (e) {}
            }
            try {
              const currentCookies = await page.cookies();
              fs.writeFileSync(path.join(actualDir, 'cookies.json'), JSON.stringify(currentCookies, null, 2));
              if (accountDir !== actualDir) {
                fs.writeFileSync(path.join(accountDir, 'cookies.json'), JSON.stringify(currentCookies, null, 2));
              }
            } catch (e) {}
            this.registerAccount(detectedUsername);
            console.log(`[InstagramDirect] Detected active login for @${detectedUsername} and saved cookies.json!`);
          }
        }
      } catch (e) {}
    }, 2000);

    return { ok: true, message: "Browser window opened! Log in with whichever Instagram account you want to use." };
  }

  // Direct Reel Upload to the Active Account
  async publishReelDirect({ videoPath, caption, targetAccount = null, onProgress = () => {} }) {
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found at ${videoPath}`);
    }

    const accountsData = this.getAccountsData();
    const accountToUse = targetAccount || accountsData.activeAccount;

    if (!accountToUse) {
      throw new Error("No active Instagram account selected. Please log in in Tab 1.");
    }

    const accountDir = this.getAccountDir(accountToUse);
    let browser = null;

    try {
      onProgress({ step: 1, message: `Opening Instagram session for @${accountToUse}...` });
      console.log(`[InstagramDirect] Uploading Reel for @${accountToUse} using dir: ${accountDir}`);

      // Ensure no lingering browser process is locking this profile directory
      try {
        execSync(`pkill -f "${accountDir}"`, { stdio: 'ignore' });
        await new Promise(r => setTimeout(r, 600));
      } catch (e) {}

      browser = await puppeteer.launch({
        headless: 'new',
        executablePath: '/usr/bin/brave-browser',
        userDataDir: accountDir,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled'
        ]
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Re-apply backup cookies if present
      const backupCookiesFile = path.join(accountDir, 'cookies.json');
      if (fs.existsSync(backupCookiesFile)) {
        try {
          const raw = JSON.parse(fs.readFileSync(backupCookiesFile, 'utf-8'));
          if (Array.isArray(raw) && raw.length > 0) {
            await page.setCookie(...raw);
          }
        } catch (e) {}
      }

      await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2500));

      // 1. Verify active session
      const cookies = await page.cookies();
      const hasSession = cookies.some(c => c.name === 'sessionid');
      const hasLoginInput = await page.$('input[name="email"], input[name="username"], input[name="pass"]');

      if (!hasSession || hasLoginInput) {
        throw new Error(`Instagram account @${accountToUse} is not logged in yet. Please go to Tab 1 (Connect Accounts) and import your session cookie or click 'Log In via Browser Window'.`);
      }

      onProgress({ step: 2, message: "Selecting video upload..." });

      // 2. Dismiss any overlays ("Save info", "Turn on notifications", "Cookies")
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, div[role="button"]'));
        for (const b of btns) {
          const txt = (b.textContent || '').trim().toLowerCase();
          if (txt === 'not now' || txt === 'cancel' || txt.includes('allow all') || txt.includes('accept all')) {
            b.click();
          }
        }
      });
      await new Promise(r => setTimeout(r, 1200));

      // 3. Click "Create" button with robust multi-strategy detection
      const clickedCreate = await page.evaluate(() => {
        // Strategy A: SVG with aria-label
        const svgs = Array.from(document.querySelectorAll('svg')).filter(s => {
          const l = (s.getAttribute('aria-label') || '').toLowerCase();
          return l === 'new post' || l === 'create' || l.includes('post');
        });
        if (svgs.length > 0) {
          const parent = svgs[0].closest('a, div[role="button"], button') || svgs[0];
          parent.click();
          return true;
        }

        // Strategy B: Sidebar navigation element with text "Create"
        const navElements = Array.from(document.querySelectorAll('nav a, div[role="navigation"] a, a[role="link"], div[role="button"]'));
        for (const el of navElements) {
          if ((el.textContent || '').trim().toLowerCase() === 'create') {
            el.click();
            return true;
          }
        }
        return false;
      });

      if (!clickedCreate) {
        const createSelector = 'svg[aria-label="New post"], svg[aria-label="Create"], a[href="#"], div[role="button"]:has(svg)';
        await page.waitForSelector(createSelector, { timeout: 8000 });
        await page.click(createSelector);
      }

      await new Promise(r => setTimeout(r, 1200));

      // If a dropdown menu appeared with "Post", click it
      await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('a, div[role="button"], button, span'));
        for (const item of items) {
          const t = (item.textContent || '').trim();
          if (t === 'Post' || t === 'New post') {
            const clickable = item.closest('a, div[role="button"], button') || item;
            clickable.click();
            return;
          }
        }
      });

      await new Promise(r => setTimeout(r, 1800));

      // 4. Upload video file
      const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 15000 });
      await fileInput.uploadFile(videoPath);
      await new Promise(r => setTimeout(r, 3500));

      onProgress({ step: 3, message: "Formatting Reel 9:16 and applying captions..." });

      // Dismiss "Post as Reel" modal if prompted
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const okBtn = btns.find(b => b.textContent.includes('OK') || b.textContent.includes('Continue'));
        if (okBtn) okBtn.click();
      });
      await new Promise(r => setTimeout(r, 1200));

      // 4.1 Explicitly select 9:16 portrait crop to avoid Instagram desktop defaulting to 1:1 square crop
      try {
        console.log(`[InstagramDirect] Selecting 9:16 aspect ratio in crop tool...`);
        const cropClicked = await page.evaluate(() => {
          const cropSvg = document.querySelector('svg[aria-label="Select crop"]');
          if (cropSvg) {
            const btn = cropSvg.closest('button, div[role="button"]') || cropSvg;
            btn.click();
            return true;
          }
          return false;
        });

        if (cropClicked) {
          await new Promise(r => setTimeout(r, 800));
          const selected = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('button, div[role="button"], span'));
            const target = items.find(e => (e.innerText || e.textContent || '').trim() === '9:16') ||
                           items.find(e => (e.innerText || e.textContent || '').trim().startsWith('Original'));
            if (target) {
              const btn = target.closest('button, div[role="button"]') || target;
              btn.click();
              return (target.innerText || target.textContent || '').trim();
            }
            return null;
          });
          console.log(`[InstagramDirect] Crop aspect ratio set to: ${selected || 'default'}`);
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (cropErr) {
        console.warn(`[InstagramDirect] Aspect ratio selection note:`, cropErr.message);
      }

      const clickButtonByText = async (targetText, timeout = 12000) => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
          const found = await page.evaluate((text) => {
            const elements = Array.from(document.querySelectorAll('div[role="button"], button, [tabindex="0"]'));
            const match = elements.find(el => {
              const t = (el.innerText || el.textContent || '').trim().toLowerCase();
              return t === text.toLowerCase();
            });
            if (match) {
              match.scrollIntoView?.();
              match.click();
              return true;
            }
            return false;
          }, targetText);
          if (found) return true;
          await new Promise(r => setTimeout(r, 600));
        }
        return false;
      };

      console.log(`[InstagramDirect] Clicking Next (Crop -> Trim)...`);
      await clickButtonByText('Next', 10000);
      await new Promise(r => setTimeout(r, 2000));

      console.log(`[InstagramDirect] Clicking Next (Trim -> Caption)...`);
      await clickButtonByText('Next', 10000);
      await new Promise(r => setTimeout(r, 2000));

      // Enter caption (matches both "Add a caption...", "Write a caption...", and Lexical textbox)
      console.log(`[InstagramDirect] Locating caption input field...`);
      const captionSelector = 'div[aria-label*="caption" i], div[role="textbox"][contenteditable="true"], div[data-lexical-editor="true"], textarea';
      const captionBox = await page.waitForSelector(captionSelector, { timeout: 15000 });
      if (captionBox) {
        await captionBox.click();
        await new Promise(r => setTimeout(r, 400));
        await page.keyboard.type(caption, { delay: 10 });
        console.log(`[InstagramDirect] Caption entered.`);
      }

      onProgress({ step: 4, message: `Publishing Reel live to @${accountToUse}...` });
      await new Promise(r => setTimeout(r, 1200));

      // Locate the Share button specifically in the dialog header (y < 250)
      const shareElement = await page.evaluate(() => {
        const dialog = document.querySelector('div[role="dialog"]');
        if (!dialog) return null;
        const all = Array.from(dialog.querySelectorAll('*'));
        for (const el of all) {
          const text = (el.innerText || el.textContent || '').trim();
          if (text.toLowerCase() === 'share') {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0 && rect.y < 250) {
              return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
            }
          }
        }
        return null;
      });

      if (!shareElement) {
        throw new Error('Share button not found in Instagram dialog header');
      }

      const clickX = shareElement.x + shareElement.width / 2;
      const clickY = shareElement.y + shareElement.height / 2;
      console.log(`[InstagramDirect] Clicking Share button at (${clickX}, ${clickY}) with real mouse...`);
      await page.mouse.click(clickX, clickY);

      console.log(`[InstagramDirect] Monitoring upload progress until completion...`);
      let publishedSuccessfully = false;

      for (let i = 1; i <= 60; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const status = await page.evaluate(() => {
          const dialog = document.querySelector('div[role="dialog"]');
          if (!dialog) return { isClosed: true };
          const text = (dialog.innerText || '').toLowerCase();
          return {
            isClosed: false,
            isSharing: text.includes('sharing') || text.includes('uploading'),
            isShared: text.includes('your reel has been shared') || 
                     text.includes('your post has been shared') || 
                     text.includes('reel shared') || 
                     text.includes('post shared') || 
                     text.includes('view post')
          };
        });

        if (status.isSharing) {
          onProgress({ step: 4, message: `Uploading video bytes to Instagram CDN (${i * 2}s)...` });
        }

        if (status.isShared) {
          console.log(`[InstagramDirect] 🎉 Instagram confirmed Reel has been shared!`);
          publishedSuccessfully = true;
          break;
        }

        if (status.isClosed && i > 5) {
          console.log(`[InstagramDirect] Dialog closed cleanly. Upload finished.`);
          publishedSuccessfully = true;
          break;
        }
      }

      if (!publishedSuccessfully) {
        throw new Error("Instagram Reel upload timed out before confirmation.");
      }

      // Allow 4 seconds for Instagram server-side video transcoding
      await new Promise(r => setTimeout(r, 4000));

      // Fetch published post link
      let permalink = `https://www.instagram.com/${accountToUse}/`;
      try {
        await page.goto(`https://www.instagram.com/${accountToUse}/`, { waitUntil: 'networkidle2' });
        const postHref = await page.evaluate(() => {
          const link = document.querySelector('a[href*="/reel/"], a[href*="/p/"]');
          return link ? link.href : null;
        });
        if (postHref) permalink = postHref;
      } catch (e) {}

      console.log(`[InstagramDirect] Reel posted successfully to @${accountToUse}! Permalink: ${permalink}`);
      return {
        ok: true,
        account: accountToUse,
        permalink,
        method: `Direct Instagram (@${accountToUse})`,
        message: `Your Reel has been uploaded and is live on Instagram!`
      };

    } finally {
      if (browser) {
        try { await browser.close(); } catch (e) {}
      }
    }
  }
}

export const instagramDirect = new InstagramDirectClient();
