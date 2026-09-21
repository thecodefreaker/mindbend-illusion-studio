// High-Quality Video Recording Engine for Optical Illusions
// Optimized for Instagram Reels (9:16), TikTok, YouTube Shorts with Two-Stage Truth Reveal
import { audioSynth } from './audioSynthesizer';

export class VideoRecorder {
  constructor() {
    this.isRecording = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.animationFrameId = null;
  }

  // Get best supported video mime type - Prioritizes MP4 for Instagram Reels
  static getSupportedMimeType() {
    const types = [
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ];
    for (const t of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  }

  async recordIllusion({
    drawFrame, // (ctx, width, height, timeElapsed, totalDuration, options) => void
    aspectRatio = '9:16', // '9:16' | '1:1' | '16:9'
    duration = 20, // seconds (min 20s)
    fps = 60,
    includeAudio = true,
    overlayText = "Reverse this spin in your mind 🧠",
    subText = "Can you make it switch directions?",
    enableTruthReveal = true,
    revealTimeRatio = 0.75, // Switch to reveal phase at 75% mark (last 25% of video) for max retention
    revealOverlayText = "REVEALING THE TRUTH 🤯",
    revealSubText = "Notice the visual cues: both directions are mind illusions!",
    onProgress = () => {},
    onComplete = () => {},
    onError = () => {}
  }) {
    if (this.isRecording) {
      onError(new Error("Recording already in progress"));
      return;
    }

    try {
      // Dimensions (1080x1920 Full HD default for Instagram Reels)
      let width = 1080;
      let height = 1920; // 9:16 Instagram Reels Full HD standard
      if (aspectRatio === '1:1') {
        width = 1080;
        height = 1080;
      } else if (aspectRatio === '16:9') {
        width = 1920;
        height = 1080;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });

      // Video Stream
      const canvasStream = canvas.captureStream(fps);
      const combinedStream = new MediaStream();

      canvasStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));

      // Audio track
      if (includeAudio) {
        try {
          audioSynth.startHypnoticDrone();
          const audioDest = audioSynth.getMediaStreamDestination();
          audioDest.stream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
        } catch (e) {
          console.warn("Audio synthesis error during recording:", e);
        }
      }

      const mimeType = VideoRecorder.getSupportedMimeType();
      const options = {
        mimeType: mimeType || undefined,
        videoBitsPerSecond: 10_000_000 // 10 Mbps high bitrate for ultra-crisp Full HD Reels
      };

      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(combinedStream, options);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      const startTime = performance.now();
      const durationMs = duration * 1000;
      const revealThresholdMs = durationMs * revealTimeRatio;
      this.isRecording = true;

      const render = (now) => {
        if (!this.isRecording) return;
        const elapsedMs = now - startTime;
        const progress = Math.min(1, elapsedMs / durationMs);
        const isRevealPhase = enableTruthReveal && elapsedMs >= revealThresholdMs;

        // 1. Background
        ctx.fillStyle = '#080a0f';
        ctx.fillRect(0, 0, width, height);

        // Subtle gradient backdrop
        const grad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, Math.max(width, height) / 1.3);
        grad.addColorStop(0, '#111827');
        grad.addColorStop(1, '#080a0f');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // 2. Render Illusion with reveal phase flag
        ctx.save();
        drawFrame(ctx, width, height, elapsedMs / 1000, duration, { isRevealPhase });
        ctx.restore();

        // 3. Render Storyboard Captions (Hook vs Reveal)
        const currentMainText = isRevealPhase ? revealOverlayText : overlayText;
        const currentSubText = isRevealPhase ? revealSubText : subText;

        this.drawInstagramOverlay(
          ctx, width, height,
          currentMainText, currentSubText,
          elapsedMs / 1000, duration,
          aspectRatio, isRevealPhase
        );

        onProgress({
          percent: Math.round(progress * 100),
          elapsedSec: (elapsedMs / 1000).toFixed(1),
          totalSec: duration,
          isRevealPhase
        });

        if (elapsedMs < durationMs) {
          this.animationFrameId = requestAnimationFrame(render);
        } else {
          this.finishRecording(onComplete, onError, mimeType, aspectRatio);
        }
      };

      this.mediaRecorder.start(250);
      this.animationFrameId = requestAnimationFrame(render);

    } catch (err) {
      this.isRecording = false;
      if (includeAudio) audioSynth.stop();
      onError(err);
    }
  }

  // Draw Instagram Reels Safe-Zone Compliant Overlays
  drawInstagramOverlay(ctx, width, height, mainText, subText, elapsed, total, aspectRatio, isRevealPhase) {
    const isVertical = aspectRatio === '9:16';
    const isSquare = aspectRatio === '1:1';
    const scale = width / 720; // Proportional scale for 1080p Full HD

    // Instagram Safe Zones:
    // In 9:16, Top 140px and Bottom 260px are often covered by Reels UI (profile, caption, music, comments)
    const topY = Math.round((isVertical ? 150 : isSquare ? 50 : 40) * scale);
    const bottomY = Math.round(isVertical ? height - (260 * scale) : isSquare ? height - (90 * scale) : height - (60 * scale));

    // Top Hook Box
    if (mainText && mainText.trim().length > 0) {
      ctx.save();
      const fontSize = Math.round((isVertical ? 32 : isSquare ? 26 : 24) * scale);
      ctx.font = `800 ${fontSize}px 'Inter', system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const metrics = ctx.measureText(mainText);
      const pillWidth = Math.min(width - Math.round(50 * scale), metrics.width + Math.round(48 * scale));
      const pillHeight = fontSize + Math.round(28 * scale);
      const radius = Math.round(16 * scale);

      // When in reveal phase: glowing amber/pink outline
      ctx.fillStyle = isRevealPhase ? 'rgba(239, 68, 68, 0.92)' : 'rgba(13, 17, 26, 0.92)';
      ctx.strokeStyle = isRevealPhase ? '#fbbf24' : 'rgba(0, 242, 254, 0.6)';
      ctx.lineWidth = Math.round(2.5 * scale);

      ctx.beginPath();
      ctx.roundRect(width / 2 - pillWidth / 2, topY, pillWidth, pillHeight, radius);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = isRevealPhase ? 'rgba(251, 191, 36, 0.8)' : 'rgba(0, 242, 254, 0.8)';
      ctx.shadowBlur = Math.round(10 * scale);
      ctx.fillText(mainText, width / 2, topY + pillHeight / 2);
      ctx.restore();
    }

    // Bottom Hook / CTA Box
    if (subText && subText.trim().length > 0) {
      ctx.save();
      const subFontSize = Math.round((isVertical ? 22 : isSquare ? 18 : 16) * scale);
      ctx.font = `600 ${subFontSize}px 'Inter', system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const metrics = ctx.measureText(subText);
      const pillWidth = Math.min(width - Math.round(60 * scale), metrics.width + Math.round(36 * scale));
      const pillHeight = subFontSize + Math.round(22 * scale);
      const radius = Math.round(12 * scale);

      ctx.fillStyle = 'rgba(8, 10, 15, 0.90)';
      ctx.strokeStyle = isRevealPhase ? 'rgba(239, 68, 68, 0.5)' : 'rgba(157, 78, 221, 0.5)';
      ctx.lineWidth = Math.round(1.5 * scale);

      ctx.beginPath();
      ctx.roundRect(width / 2 - pillWidth / 2, bottomY, pillWidth, pillHeight, radius);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f1f5f9';
      ctx.shadowColor = 'rgba(157, 78, 221, 0.6)';
      ctx.shadowBlur = Math.round(6 * scale);
      ctx.fillText(subText, width / 2, bottomY + pillHeight / 2);
      ctx.restore();
    }

    // Top Right Timer Pill
    ctx.save();
    const remaining = Math.max(0, total - elapsed).toFixed(0);
    ctx.font = `700 ${Math.round(15 * scale)}px 'JetBrains Mono', monospace`;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`${remaining}s`, width - Math.round((isVertical ? 40 : 25) * scale), Math.round((isVertical ? 65 : 35) * scale));

    // Bottom Subtle Progress Line
    const progressRatio = Math.min(1, elapsed / total);
    const lineH = Math.round(6 * scale);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(0, height - lineH, width, lineH);
    ctx.fillStyle = isRevealPhase ? '#fbbf24' : '#00f2fe';
    ctx.fillRect(0, height - lineH, width * progressRatio, lineH);
    ctx.restore();
  }

  finishRecording(onComplete, onError, mimeType, aspectRatio) {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.onstop = () => {
      this.isRecording = false;
      audioSynth.stop();

      const blobType = mimeType || 'video/mp4';
      const blob = new Blob(this.recordedChunks, { type: blobType });
      const videoUrl = URL.createObjectURL(blob);
      const fileExt = blobType.includes('mp4') ? 'mp4' : 'webm';
      const filename = `insta-reel-illusion-${aspectRatio.replace(':', 'x')}-${Date.now()}.${fileExt}`;

      onComplete({
        blob,
        videoUrl,
        filename,
        format: fileExt.toUpperCase(),
        sizeMB: (blob.size / (1024 * 1024)).toFixed(2)
      });
    };

    try {
      this.mediaRecorder.stop();
    } catch (e) {
      onError(e);
    }
  }

  cancelRecording() {
    this.isRecording = false;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {}
    }
    audioSynth.stop();
  }
}

export const videoRecorder = new VideoRecorder();
