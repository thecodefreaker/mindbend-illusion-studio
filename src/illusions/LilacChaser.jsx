import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Sparkles, Eye, Info, Sliders, CheckCircle } from 'lucide-react';

export const LilacChaser = ({ onExportReady }) => {
  const canvasRef = useRef(null);

  // Settings
  const [dotCount, setDotCount] = useState(12);
  const [speedMs, setSpeedMs] = useState(120); // ms per step
  const [blurRadius, setBlurRadius] = useState(18);
  const [baseColor, setBaseColor] = useState('#db2777'); // Lilac / Magenta -> produces Green
  const [showHelperCross, setShowHelperCross] = useState(true);

  // Standalone draw function
  const drawFrame = useCallback((ctx, width, height, time, duration = 0) => {
    ctx.clearRect(0, 0, width, height);

    // Neutral gray background is essential for Troxler's fading & color afterimage
    ctx.fillStyle = '#6b7280';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const ringRadius = Math.min(width, height) * 0.32;
    const dotRadius = Math.min(width, height) * 0.055;

    // Current invisible gap index
    const totalSteps = dotCount;
    const stepDurationSec = speedMs / 1000;
    const currentStep = Math.floor(time / stepDurationSec) % totalSteps;

    // Draw blurred discs
    ctx.save();
    for (let i = 0; i < totalSteps; i++) {
      if (i === currentStep) continue; // The gap!

      const angle = (i * (2 * Math.PI)) / totalSteps - Math.PI / 2;
      const x = cx + ringRadius * Math.cos(angle);
      const y = cy + ringRadius * Math.sin(angle);

      // Draw radial gradient for soft/fuzzy edge
      const radGrad = ctx.createRadialGradient(x, y, 0, x, y, dotRadius + blurRadius);
      radGrad.addColorStop(0, baseColor);
      radGrad.addColorStop(0.5, baseColor);
      radGrad.addColorStop(1, 'rgba(107, 114, 128, 0)'); // Fades into gray

      ctx.beginPath();
      ctx.arc(x, y, dotRadius + blurRadius, 0, Math.PI * 2);
      ctx.fillStyle = radGrad;
      ctx.fill();
    }
    ctx.restore();

    // Central Fixation Cross (+)
    if (showHelperCross) {
      ctx.save();
      const crossSize = 10;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(cx - crossSize, cy);
      ctx.lineTo(cx + crossSize, cy);
      ctx.moveTo(cx, cy - crossSize);
      ctx.lineTo(cx, cy + crossSize);
      ctx.stroke();

      // Fixation aid ring
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, crossSize * 1.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

  }, [dotCount, speedMs, blurRadius, baseColor, showHelperCross]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let startTime = performance.now();

    const render = (time) => {
      const elapsed = (time - startTime) / 1000;
      drawFrame(ctx, canvas.width, canvas.height, elapsed);
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [drawFrame]);

  // Export hook
  useEffect(() => {
    if (onExportReady) {
      onExportReady({
        name: "Lilac Chaser (Pac-Man)",
        drawFrame,
        defaultOverlay: "STARE AT THE CENTER CROSS ➕",
        defaultSubtext: "1) A green dot appears  2) The purple dots vanish!",
        suggestedDurations: [12, 16, 24]
      });
    }
  }, [onExportReady, drawFrame]);

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
      {/* Canvas */}
      <div className="flex-1 w-full flex flex-col items-center bg-lab-900 border border-lab-700/60 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-4 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-neon-magenta/10 text-neon-magenta border border-neon-magenta/30 rounded-full text-xs font-mono font-semibold tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> TROXLER'S FADING & OPPONENT COLOR
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">Jeremy Hinton (2005)</span>
          </div>

          <div className="text-xs text-slate-400">
            Keep eyes locked on the <strong>+</strong> cross
          </div>
        </div>

        {/* Canvas Display */}
        <div className="relative w-full max-w-[500px] aspect-square bg-[#6b7280] rounded-xl border border-lab-800 shadow-inner flex items-center justify-center p-2">
          <canvas
            ref={canvasRef}
            width={720}
            height={720}
            className="w-full h-full object-contain rounded-lg cursor-crosshair"
          />

          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-lab-950/85 backdrop-blur-md px-4 py-1.5 rounded-full border border-lab-700 shadow-lg flex items-center gap-2 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-neon-magenta animate-ping" />
            <span className="text-xs font-semibold text-slate-200">
              Stare directly at the + without blinking
            </span>
          </div>
        </div>

        {/* Scientific Explanation */}
        <div className="w-full mt-4 p-3.5 bg-lab-850 border border-lab-700/50 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-neon-magenta shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">The double illusion:</strong> First, neural adaptation creates a running <strong className="text-neon-lime">green afterimage</strong> in the gap because the red/magenta cones in your retina are fatigued. Second, due to <strong>Troxler's Fading</strong>, stationary blurry shapes outside your fovea fade completely into the gray background within 5 seconds!
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-full xl:w-96 flex flex-col gap-4">
        <div className="bg-lab-900 border border-lab-700/60 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-neon-magenta" /> Illusion Parameters
          </h3>

          {/* Speed */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Gap Orbit Speed</span>
              <span className="text-neon-magenta font-mono">{speedMs} ms/step</span>
            </div>
            <input
              type="range"
              min="60"
              max="240"
              step="10"
              value={speedMs}
              onChange={(e) => setSpeedMs(parseInt(e.target.value))}
              className="w-full h-1.5 bg-lab-800 rounded-lg appearance-none cursor-pointer accent-neon-magenta"
            />
          </div>

          {/* Dot Count */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Number of Discs</span>
              <span className="text-neon-magenta font-mono">{dotCount} discs</span>
            </div>
            <div className="flex gap-2">
              {[8, 10, 12, 16].map(n => (
                <button
                  key={n}
                  onClick={() => setDotCount(n)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    dotCount === n ? 'bg-neon-magenta text-white font-bold' : 'bg-lab-800 text-slate-400 hover:bg-lab-750'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Blur softness */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Edge Softness (Troxler Blur)</span>
              <span className="text-neon-magenta font-mono">{blurRadius}px</span>
            </div>
            <input
              type="range"
              min="6"
              max="32"
              step="2"
              value={blurRadius}
              onChange={(e) => setBlurRadius(parseInt(e.target.value))}
              className="w-full h-1.5 bg-lab-800 rounded-lg appearance-none cursor-pointer accent-neon-magenta"
            />
          </div>

          {/* Color Pair Selection */}
          <div>
            <label className="text-xs text-slate-300 font-medium block mb-2">Color Complementarity</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { name: 'Lilac', color: '#db2777', afterimage: 'Green' },
                { name: 'Cyan', color: '#06b6d4', afterimage: 'Red' },
                { name: 'Yellow', color: '#eab308', afterimage: 'Blue' }
              ].map(c => (
                <button
                  key={c.name}
                  onClick={() => setBaseColor(c.color)}
                  className={`p-2 rounded-xl text-xs border text-center transition-all ${
                    baseColor === c.color
                      ? 'bg-magenta-500/20 border-neon-magenta text-white font-bold'
                      : 'bg-lab-800 border-lab-700 text-slate-400'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full mx-auto mb-1" style={{ backgroundColor: c.color }} />
                  <div>{c.name}</div>
                  <div className="text-[10px] text-slate-400">→ {c.afterimage}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
