import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Eye, Sparkles, Sliders, Info, Zap } from 'lucide-react';

export const MunkerWhite = ({ onExportReady }) => {
  const canvasRef = useRef(null);
  const [targetColor, setTargetColor] = useState('#00f2fe'); // Cyan
  const [barCount, setBarCount] = useState(12);
  const [stripesOffset, setStripesOffset] = useState(0);

  // Standalone draw function for interactive canvas & 1080p video recording
  const drawFrame = useCallback((ctx, width, height, time, duration = 0, options = {}) => {
    ctx.clearRect(0, 0, width, height);

    const isReveal = options.isRevealPhase;

    // Background
    ctx.fillStyle = '#080a0f';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height * 0.50;
    const arenaW = Math.min(width, height) * 0.80;
    const arenaH = arenaW * 0.70;

    const startX = cx - arenaW / 2;
    const startY = cy - arenaH / 2;

    const barH = arenaH / (barCount * 2);

    // In reveal phase: stripes slide away to reveal both targets are 100% the same color!
    let slideOffset = 0;
    if (isReveal) {
      const revealProgress = Math.min(1, (time % 4) / 1.5);
      slideOffset = arenaW * 1.1 * revealProgress;
    }

    // 1. Draw Target Color Blocks (Left block vs Right block)
    // Both blocks use the exact same targetColor!
    const blockW = arenaW * 0.38;
    const leftBlockX = startX + arenaW * 0.08;
    const rightBlockX = startX + arenaW * 0.54;

    ctx.fillStyle = targetColor;
    // Left target bars
    for (let i = 0; i < barCount; i++) {
      const y = startY + (i * 2) * barH;
      ctx.fillRect(leftBlockX, y, blockW, barH * 2);
    }
    // Right target bars
    for (let i = 0; i < barCount; i++) {
      const y = startY + (i * 2) * barH;
      ctx.fillRect(rightBlockX, y, blockW, barH * 2);
    }

    // 2. Draw Foreground Stripes
    // Over Left Block: White stripes cross in front
    // Over Right Block: Black stripes cross in front
    // Slide away if in reveal phase
    ctx.save();
    for (let i = 0; i < barCount * 2; i++) {
      const y = startY + i * barH;
      const isBlackStripe = i % 2 === 0;

      // Left area stripes
      ctx.fillStyle = isBlackStripe ? '#000000' : '#ffffff';
      if (slideOffset > 0) {
        // Slide left
        ctx.fillRect(startX - slideOffset, y, arenaW, barH);
      } else {
        ctx.fillRect(startX, y, arenaW, barH);
      }
    }
    ctx.restore();

    // 3. Reveal Phase: Draw connecting bridge between left and right blocks proving they match
    if (isReveal) {
      ctx.save();
      const pulse = 0.5 + 0.5 * Math.sin(time * 6);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = Math.max(3, arenaW * 0.008);

      // Draw connecting laser bar
      const midY = cy;
      ctx.fillStyle = targetColor;
      ctx.fillRect(leftBlockX, midY - barH, rightBlockX + blockW - leftBlockX, barH * 2);
      ctx.strokeRect(leftBlockX, midY - barH, rightBlockX + blockW - leftBlockX, barH * 2);

      // Text banner
      ctx.fillStyle = '#22c55e';
      ctx.font = `bold ${Math.round(arenaW * 0.04)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('✓ 100% IDENTICAL HEX COLOR', cx, startY - 20);
      ctx.restore();
    }
  }, [targetColor, barCount]);

  // Main interactive render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const startTime = performance.now();

    const render = (now) => {
      const time = (now - startTime) / 1000;
      drawFrame(ctx, canvas.width, canvas.height, time);
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [drawFrame]);

  // Register with Studio Exporter
  useEffect(() => {
    if (onExportReady) {
      onExportReady({
        name: "Munker Color Illusion",
        drawFrame,
        defaultOverlay: "Which color is brighter: Left or Right? 🎨",
        defaultSubtext: "Left looks darker green, right looks neon cyan! 👇",
        suggestedDurations: [8, 10, 12],
        hasRevealSequence: true,
        revealOverlay: "REVEALING THE TRUTH 🤯",
        revealSubtext: "Both sides are the EXACT same color! The stripes tricked your brain."
      });
    }
  }, [onExportReady, drawFrame]);

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
      {/* Visual Canvas Card */}
      <div className="flex-1 w-full flex flex-col items-center bg-lab-900 border border-lab-700/60 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-neon-green animate-ping" />
            <span className="text-xs font-mono text-neon-green uppercase tracking-wider">
              Color Assimilation & White's Effect
            </span>
          </div>
        </div>

        <div className="relative w-full max-w-[540px] aspect-square rounded-xl overflow-hidden bg-black/40 border border-lab-800 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={540}
            height={540}
            className="w-full h-full object-contain"
          />
        </div>

        <p className="text-xs text-slate-400 mt-4 text-center max-w-md">
          The bars on the left and right appear to be two completely different colors (dark green vs neon cyan). 
          They are 100% identical in RGB color value!
        </p>
      </div>

      {/* Controls Card */}
      <div className="w-full xl:w-80 bg-lab-900 border border-lab-700/60 rounded-2xl p-5 shadow-2xl space-y-5">
        <div className="flex items-center gap-2 border-b border-lab-800 pb-3">
          <Sliders className="w-4 h-4 text-neon-green" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Color Controls</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-300 block mb-2">Target Color</label>
            <div className="flex gap-2">
              {[
                { label: 'Cyan', color: '#00f2fe' },
                { label: 'Magenta', color: '#ec4899' },
                { label: 'Yellow', color: '#eab308' },
                { label: 'Orange', color: '#f97316' }
              ].map(c => (
                <button
                  key={c.color}
                  onClick={() => setTargetColor(c.color)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    targetColor === c.color
                      ? 'border-white text-white shadow-lg'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                  style={{ backgroundColor: `${c.color}33`, borderColor: targetColor === c.color ? c.color : undefined }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300">Stripe Density</span>
              <span className="text-neon-green font-mono">{barCount}</span>
            </div>
            <input
              type="range"
              min="6"
              max="20"
              value={barCount}
              onChange={(e) => setBarCount(parseInt(e.target.value))}
              className="w-full h-1.5 bg-lab-800 rounded-lg appearance-none cursor-pointer accent-neon-green"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-lab-800 space-y-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <Info className="w-4 h-4 text-neon-amber" />
            <span>The Neuroscience:</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            Known as the <strong>Munker-White illusion</strong>. When a color is bordered by black stripes, 
            the visual system assimilates the darker luminance. When bordered by white, it assimilates 
            the lighter luminance, shifting the perceived brightness and saturation dramatically.
          </p>
        </div>
      </div>
    </div>
  );
};
