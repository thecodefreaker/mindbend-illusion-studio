// Cloudflare Tunnel Manager for Meta Webhook / Video Download URL
// Exposes local Express server to a public HTTPS URL (e.g. https://xxx.trycloudflare.com)
import { spawn } from 'child_process';

export class TunnelManager {
  constructor(port = 5182) {
    this.port = port;
    this.process = null;
    this.publicUrl = null;
    this.isStarting = false;
    this.customPublicUrl = null;
  }

  setCustomUrl(url) {
    if (url && url.startsWith('http')) {
      this.customPublicUrl = url.replace(/\/+$/, '');
    } else {
      this.customPublicUrl = null;
    }
  }

  getPublicUrl() {
    return this.customPublicUrl || this.publicUrl || `http://localhost:${this.port}`;
  }

  getVideoPublicUrl(filename) {
    const base = this.getPublicUrl();
    return `${base}/videos/${filename}`;
  }

  async start() {
    if (this.publicUrl) return this.publicUrl;
    if (this.isStarting) {
      // Wait for ongoing start
      await new Promise(r => setTimeout(r, 2000));
      return this.publicUrl;
    }

    this.isStarting = true;
    const cloudflaredPath = '/home/kaliuser/.local/bin/cloudflared';

    return new Promise((resolve) => {
      try {
        this.process = spawn(cloudflaredPath, ['tunnel', '--url', `http://localhost:${this.port}`]);

        const urlRegex = /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/;

        const handleData = (data) => {
          const str = data.toString();
          const match = str.match(urlRegex);
          if (match && !this.publicUrl) {
            this.publicUrl = match[0];
            this.isStarting = false;
            console.log(`[TunnelManager] Public HTTPS Tunnel Live: ${this.publicUrl}`);
            resolve(this.publicUrl);
          }
        };

        this.process.stdout.on('data', handleData);
        this.process.stderr.on('data', handleData);

        this.process.on('error', (err) => {
          console.warn('[TunnelManager] Failed to launch cloudflared:', err.message);
          this.isStarting = false;
          resolve(null);
        });

        // Timeout fallback after 10s
        setTimeout(() => {
          if (!this.publicUrl) {
            console.warn('[TunnelManager] Tunnel connection timeout. Falling back to local/manual URL.');
            this.isStarting = false;
            resolve(null);
          }
        }, 10000);

      } catch (err) {
        console.warn('[TunnelManager] Exception:', err);
        this.isStarting = false;
        resolve(null);
      }
    });
  }

  stop() {
    if (this.process) {
      try {
        this.process.kill();
      } catch (e) {}
      this.process = null;
      this.publicUrl = null;
    }
  }
}

export const tunnelManager = new TunnelManager(5182);
