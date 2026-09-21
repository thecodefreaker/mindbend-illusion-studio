import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Eye, EyeOff, Sparkles, Gauge, Info, Sliders } from 'lucide-react';

export const SteppingFeet = ({ onExportReady }) => {
  const canvasRef = useRef(null);

  // Controls
  const [showStripes, setShowStripes] = useState(true);
  const [showGuideLines, setShowGuideLines] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [stripeWidth, setStripeWidth] = useState(24);
  const [contrastTheme, setContrastTheme] = useState('yellow-blue'); // 'yellow-blue' | 'white-black'

  // Standalone draw function
  const drawFrame = useCallback((ctx, width, height, time, duration = 0, options = {}) => {
    ctx.clearRect(0, 0, width, height);

    // If in reveal phase, hide stripes automatically to reveal equal speed!
    const effectiveShowStripes = options.isRevealPhase ? false : showStripes;

    // 1. Draw Background
    if (effectiveShowStripes) {
      // Draw alternating black and white vertical bars
      const numBars = Math.ceil(width / stripeWidth) + 1;
      for (let i = 0; i < numBars; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#000000' : '#ffffff';
        ctx.fillRect(i * stripeWidth, 0, stripeWidth, height);
      }
    } else {
      // Reveal mode: Uniform neutral gray background
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Block geometry and motion
    const blockWidth = stripeWidth * 2;
    const blockHeight = Math.min(80, height * 0.14);
    const speedPx = 70 * speed;
    const travelDistance = width + blockWidth * 2;
    const currentX = ((time * speedPx) % travelDistance) - blockWidth;

    const block1Y = height * 0.32;
    const block2Y = height * 0.54;

    // Block colors
    let topColor = '#ffea00'; // Bright light yellow
    let bottomColor = '#0f172a'; // Dark navy / black
    if (contrastTheme === 'white-black') {
      topColor = '#ffffff';
      bottomColor = '#000000';
    }

    // Draw Top Light Block
    ctx.save();
    ctx.fillStyle = topColor;
    ctx.fillRect(currentX, block1Y, blockWidth, blockHeight);

    // Draw Bottom Dark Block
    ctx.fillStyle = bottomColor;
    ctx.fillRect(currentX, block2Y, blockWidth, blockHeight);
    ctx.restore();

    // 3. Optional Vertical Laser Alignment Guide
    if (showGuideLines) {
      ctx.save();
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);

      // Front alignment line
      ctx.beginPath();
      ctx.moveTo(currentX + blockWidth, 0);
      ctx.lineTo(currentX + blockWidth, height);
      ctx.stroke();

      // Rear alignment line
      ctx.strokeStyle = '#00f2fe';
      ctx.beginPath();
      ctx.moveTo(currentX, 0);
      ctx.lineTo(currentX, height);
      ctx.stroke();

      // Front indicator dot
      ctx.fillStyle = '#00ff88';
      ctx.beginPath();
      ctx.arc(currentX + blockWidth, block1Y + blockHeight / 2, 6, 0, Math.PI * 2);
      ctx.arc(currentX + blockWidth, block2Y + blockHeight / 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

  }, [showStripes, showGuideLines, speed, stripeWidth, contrastTheme]);

  // Animation Loop
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

  // Pass export hook
  useEffect(() => {
    if (onExportReady) {
      onExportReady({
        name: "Stepping Feet Illusion",
        drawFrame,
        defaultOverlay: "DO THESE BLOCKS MOVE AT THE SAME SPEED? 🤔",
        defaultSubtext: "Watch what happens when you remove the stripes!",
        suggestedDurations: [8, 12, 16],
        hasRevealSequence: true,
        revealOverlay: "REVEALING THE TRUTH 🤯",
        revealSubtext: "Removing the stripes... They move at identical speed!"
      });
    }
  }, [onExportReady, drawFrame]);

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
      {/* Canvas Display */}
      <div className="flex-1 w-full flex flex-col items-center bg-lab-900 border border-lab-700/60 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-4 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/10 text-neon-amber border border-amber-500/30 rounded-full text-xs font-mono font-semibold tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> CONTRAST & VELOCITY ILLUSION
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">Stuart Anstis (2001)</span>
          </div>

          {/* Quick Reveal Toggle */}
          <button
            onClick={() => setShowStripes(!showStripes)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              !showStripes
                ? 'bg-neon-lime text-lab-950 shadow-lg shadow-lime-500/30'
                : 'bg-lab-800 text-slate-200 hover:bg-lab-750 border border-lab-700'
            }`}
          >
            {showStripes ? <EyeOff className="w-4 h-4 text-neon-cyan" /> : <Eye className="w-4 h-4" />}
            {showStripes ? 'Hide Stripes (Reveal Truth)' : 'Show Stripes'}
          </button>
        </div>

        {/* Canvas */}
        <div className="relative w-full aspect-[16/9] max-w-[640px] bg-black rounded-xl border border-lab-800 shadow-inner flex items-center justify-center overflow-hidden">
          <canvas
            ref={canvasRef}
            width={960}
            height={540}
            className="w-full h-full object-contain rounded-lg"
          />

          {/* Guide Line Status Pill */}
          {showGuideLines && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-lab-950/90 border border-neon-lime/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono text-neon-lime">
              Laser Guide: Perfectly locked side-by-side!
            </div>
          )}
        </div>

        {/* Scientific Explanation */}
        <div className="w-full mt-4 p-3.5 bg-lab-850 border border-lab-700/50 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-neon-amber shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">Why they appear to step:</strong> Human visual edge detectors perceive speed based on edge contrast. When the light block moves over white stripes, its leading edge loses contrast and appears to slow down or halt. Meanwhile, the dark block has high contrast against white and appears to speed up! When they cross black bars, the roles reverse, creating the vivid illusion of walking feet.
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-full xl:w-96 flex flex-col gap-4">
        <div className="bg-lab-900 border border-lab-700/60 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-neon-amber" /> Illusion Controls
          </h3>

          {/* Reveal Strip / Laser Toggles */}
          <div className="space-y-2">
            <button
              onClick={() => setShowStripes(!showStripes)}
              className={`w-full p-3 rounded-xl text-xs font-medium border flex items-center justify-between transition-all ${
                !showStripes
                  ? 'bg-lime-500/20 border-neon-lime text-neon-lime font-bold'
                  : 'bg-lab-800 border-lab-700 text-slate-300 hover:bg-lab-750'
              }`}
            >
              <span>Stripes Background</span>
              <span className="font-mono text-xs">{showStripes ? 'STRIPES ON' : 'REVEALED (OFF)'}</span>
            </button>

            <button
              onClick={() => setShowGuideLines(!showGuideLines)}
              className={`w-full p-3 rounded-xl text-xs font-medium border flex items-center justify-between transition-all ${
                showGuideLines
                  ? 'bg-cyan-500/20 border-cyan-500 text-neon-cyan font-bold'
                  : 'bg-lab-800 border-lab-700 text-slate-300 hover:bg-lab-750'
              }`}
            >
              <span>Alignment Laser Guide</span>
              <span className="font-mono text-xs">{showGuideLines ? 'ACTIVE' : 'OFF'}</span>
            </button>
          </div>

          {/* Speed slider */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Movement Speed</span>
              <span className="text-neon-amber font-mono">{speed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="2.5"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-lab-800 rounded-lg appearance-none cursor-pointer accent-neon-amber"
            />
          </div>

          {/* Stripe Width slider */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Stripe Width</span>
              <span className="text-neon-amber font-mono">{stripeWidth}px</span>
            </div>
            <input
              type="range"
              min="12"
              max="48"
              step="4"
              value={stripeWidth}
              onChange={(e) => setStripeWidth(parseInt(e.target.value))}
              className="w-full h-1.5 bg-lab-800 rounded-lg appearance-none cursor-pointer accent-neon-amber"
            />
          </div>

          {/* Color Themes */}
          <div>
            <label className="text-xs text-slate-300 font-medium block mb-2">Block Color Scheme</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setContrastTheme('yellow-blue')}
                className={`p-2 rounded-xl text-xs border text-left ${
                  contrastTheme === 'yellow-blue'
                    ? 'bg-amber-500/20 border-neon-amber text-neon-amber font-bold'
                    : 'bg-lab-800 border-lab-700 text-slate-400'
                }`}
              >
                Yellow & Dark Blue
                <span className="block text-[10px] text-slate-400 font-normal">Classic Anstis colors</span>
              </button>
              <button
                onClick={() => setContrastTheme('white-black')}
                className={`p-2 rounded-xl text-xs border text-left ${
                  contrastTheme === 'white-black'
                    ? 'bg-amber-500/20 border-neon-amber text-neon-amber font-bold'
                    : 'bg-lab-800 border-lab-700 text-slate-400'
                }`}
              >
                Pure White & Black
                <span className="block text-[10px] text-slate-400 font-normal">Maximum edge contrast</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
