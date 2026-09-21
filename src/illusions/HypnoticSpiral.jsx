import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, RotateCcw, Sparkles, Eye, Info, Clock, CheckCircle } from 'lucide-react';

export const HypnoticSpiral = ({ onExportReady }) => {
  const canvasRef = useRef(null);

  // Spiral settings
  const [direction, setDirection] = useState(1); // 1: Inward (causes expansion aftereffect), -1: Outward (shrink)
  const [speed, setSpeed] = useState(1.2);
  const [arms, setArms] = useState(4);
  const [colorTheme, setColorTheme] = useState('bw'); // 'bw' | 'cyber' | 'magenta'
  const [tightness, setTightness] = useState(0.25);

  // Stare test challenge state
  const [isChallengeActive, setIsChallengeActive] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [showAftereffectTarget, setShowAftereffectTarget] = useState(false);
  const [targetType, setTargetType] = useState('galaxy'); // 'galaxy' | 'grid' | 'rings'

  // Standalone draw function
  const drawFrame = useCallback((ctx, width, height, time, duration = 0) => {
    ctx.clearRect(0, 0, width, height);
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.hypot(width, height) / 1.8;

    // Check if showing aftereffect target
    if (showAftereffectTarget) {
      // Draw static high-detail image that will appear to warp!
      ctx.fillStyle = '#080a0f';
      ctx.fillRect(0, 0, width, height);

      if (targetType === 'galaxy') {
        // Draw static starfield nebula
        const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, maxR);
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(0.3, '#818cf8');
        grad.addColorStop(0.7, '#312e81');
        grad.addColorStop(1, '#080a0f');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Static stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 150; i++) {
          const r = ((i * 137.5) % maxR);
          const a = i * 2.39996;
          const x = cx + r * Math.cos(a);
          const y = cy + r * Math.sin(a);
          ctx.beginPath();
          ctx.arc(x, y, (i % 3) + 1, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (targetType === 'grid') {
        // High contrast geometric checkerboard/grid
        ctx.fillStyle = '#0d111a';
        ctx.fillRect(0, 0, width, height);
        const gridSize = 40;
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        for (let x = 0; x <= width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y <= height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      } else {
        // Concentric stationary rings
        ctx.fillStyle = '#0d111a';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3;
        for (let r = 20; r < maxR; r += 25) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Center red fixation dot
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      return;
    }

    // Colors
    let colorA = '#ffffff';
    let colorB = '#000000';
    if (colorTheme === 'cyber') {
      colorA = '#00f2fe';
      colorB = '#090d16';
    } else if (colorTheme === 'magenta') {
      colorA = '#ff007f';
      colorB = '#120318';
    }

    // Base background
    ctx.fillStyle = colorB;
    ctx.fillRect(0, 0, width, height);

    // Draw logarithmic multi-arm spiral
    const rot = time * speed * 3.5 * direction;
    const numSteps = 750;
    const maxRadius = Math.max(width, height) * 0.8;

    ctx.save();
    ctx.translate(cx, cy);

    for (let i = 0; i < arms; i++) {
      const armOffset = (i * (2 * Math.PI)) / arms;

      ctx.beginPath();
      ctx.moveTo(0, 0);

      // Construct polygon arm
      for (let s = 1; s <= numSteps; s++) {
        const t = s / numSteps;
        const r = Math.pow(t, tightness * 3) * maxRadius;
        const theta = rot + armOffset + Math.log(r + 1) * 3;
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        ctx.lineTo(x, y);
      }

      // Backwards along next arm boundary
      for (let s = numSteps; s >= 1; s--) {
        const t = s / numSteps;
        const r = Math.pow(t, tightness * 3) * maxRadius;
        const theta = rot + armOffset + (Math.PI / arms) + Math.log(r + 1) * 3;
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        ctx.lineTo(x, y);
      }

      ctx.closePath();
      ctx.fillStyle = colorA;
      ctx.fill();
    }

    ctx.restore();

    // Central fixation point (pulsing red or cyan beacon)
    const pulse = 6 + Math.sin(time * 6) * 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, pulse + 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 0, 80, 0.4)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0055';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

  }, [direction, speed, arms, colorTheme, tightness, showAftereffectTarget, targetType]);

  // Main animation loop
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

  // Stare countdown logic
  useEffect(() => {
    let timer;
    if (isChallengeActive && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (isChallengeActive && countdown === 0) {
      // Countdown finished! Show static target
      setShowAftereffectTarget(true);
      // Revert after 8 seconds of testing
      const revertTimer = setTimeout(() => {
        setShowAftereffectTarget(false);
        setIsChallengeActive(false);
        setCountdown(15);
      }, 8000);
      return () => clearTimeout(revertTimer);
    }
    return () => clearInterval(timer);
  }, [isChallengeActive, countdown]);

  // Pass export hook to parent
  useEffect(() => {
    if (onExportReady) {
      onExportReady({
        name: "Hypnotic Spiral Vortex",
        drawFrame,
        defaultOverlay: "STARE AT THE RED DOT FOR 15s 🌀",
        defaultSubtext: "Then look away at your hand or room — it will warp!",
        suggestedDurations: [15, 20, 30]
      });
    }
  }, [onExportReady, drawFrame]);

  const startChallenge = () => {
    setShowAftereffectTarget(false);
    setCountdown(15);
    setIsChallengeActive(true);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
      {/* Canvas Area */}
      <div className="flex-1 w-full flex flex-col items-center bg-lab-900 border border-lab-700/60 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-4 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-neon-purple/10 text-neon-purple border border-neon-purple/30 rounded-full text-xs font-mono font-semibold tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> MOTION AFTEREFFECT (MAE)
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">Waterfall Illusion</span>
          </div>

          {/* Test Challenge Button */}
          <button
            onClick={startChallenge}
            disabled={isChallengeActive}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              isChallengeActive
                ? 'bg-amber-500/20 text-neon-amber border border-amber-500/40 animate-pulse'
                : 'bg-gradient-to-r from-neon-purple to-neon-cyan text-lab-950 hover:brightness-110 shadow-lg shadow-cyan-500/20'
            }`}
          >
            {isChallengeActive ? (
              <>
                <Clock className="w-4 h-4 animate-spin" /> Stare! {countdown}s remaining
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Start 15s Brain Challenge
              </>
            )}
          </button>
        </div>

        {/* Canvas Display */}
        <div className="relative w-full max-w-[500px] aspect-square bg-black rounded-xl border border-lab-800 shadow-inner flex items-center justify-center overflow-hidden">
          <canvas
            ref={canvasRef}
            width={800}
            height={800}
            className="w-full h-full object-cover rounded-lg cursor-crosshair"
          />

          {/* Challenge Mode Overlay */}
          {isChallengeActive && !showAftereffectTarget && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-lab-950/90 border border-red-500/50 backdrop-blur-md px-5 py-2 rounded-full shadow-2xl flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-bold text-white tracking-wide">
                STARE AT THE CENTER: <span className="text-neon-cyan font-mono text-sm">{countdown}s</span>
              </span>
            </div>
          )}

          {/* Aftereffect Test Target Overlay Announcement */}
          {showAftereffectTarget && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-neon-cyan/95 text-lab-950 px-5 py-2 rounded-full shadow-2xl flex items-center gap-2 font-bold text-xs animate-bounce">
              <CheckCircle className="w-4 h-4" /> LOOK NOW! IS THE IMAGE BREATHING & SWIRLING?
            </div>
          )}
        </div>

        {/* Explanation Alert */}
        <div className="w-full mt-4 p-3.5 bg-lab-850 border border-lab-700/50 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-neon-purple shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">The Waterfall Effect:</strong> When you stare at inward motion, motion-sensitive neurons (in cortical area MT/V5) become fatigued. When you look away, resting baseline neurons for the <em>opposite</em> direction dominate, causing static objects in real life to melt, stretch, and expand!
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-full xl:w-96 flex flex-col gap-4">
        <div className="bg-lab-900 border border-lab-700/60 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Eye className="w-4 h-4 text-neon-purple" /> Spiral Parameters
          </h3>

          {/* Spin Direction */}
          <div>
            <label className="text-xs text-slate-300 font-medium block mb-2">Perceptual Aftereffect</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDirection(1)}
                className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                  direction === 1
                    ? 'bg-purple-500/20 border-neon-purple text-neon-purple font-bold'
                    : 'bg-lab-800 border-lab-700 text-slate-400 hover:bg-lab-750'
                }`}
              >
                Inward Spiral
                <span className="block text-[10px] text-slate-400 font-normal">Causes Expansion</span>
              </button>
              <button
                onClick={() => setDirection(-1)}
                className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                  direction === -1
                    ? 'bg-purple-500/20 border-neon-purple text-neon-purple font-bold'
                    : 'bg-lab-800 border-lab-700 text-slate-400 hover:bg-lab-750'
                }`}
              >
                Outward Spiral
                <span className="block text-[10px] text-slate-400 font-normal">Causes Shrinking</span>
              </button>
            </div>
          </div>

          {/* Speed */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Vortex Speed</span>
              <span className="text-neon-purple font-mono">{speed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="2.5"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-lab-800 rounded-lg appearance-none cursor-pointer accent-neon-purple"
            />
          </div>

          {/* Arms */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Spiral Arms Count</span>
              <span className="text-neon-purple font-mono">{arms} arms</span>
            </div>
            <div className="flex gap-2">
              {[2, 3, 4, 6, 8].map(a => (
                <button
                  key={a}
                  onClick={() => setArms(a)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    arms === a ? 'bg-neon-purple text-white font-bold' : 'bg-lab-800 text-slate-400 hover:bg-lab-750'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Color Themes */}
          <div>
            <label className="text-xs text-slate-300 font-medium block mb-2">Contrast Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'bw', label: 'Monochrome', desc: 'Max Contrast' },
                { id: 'cyber', label: 'Neon Cyan', desc: 'Cyber Lab' },
                { id: 'magenta', label: 'Hot Pink', desc: 'Hypnotic' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setColorTheme(t.id)}
                  className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    colorTheme === t.id
                      ? 'bg-purple-500/20 border-neon-purple text-neon-purple'
                      : 'bg-lab-800 border-lab-700 text-slate-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aftereffect Test Target Selector */}
          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1.5">Test Image (Revealed After 15s)</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'galaxy', label: '🌌 Nebula' },
                { id: 'grid', label: '🏁 Grid' },
                { id: 'rings', label: '⭕ Rings' }
              ].map(tg => (
                <button
                  key={tg.id}
                  onClick={() => setTargetType(tg.id)}
                  className={`py-1.5 px-2 rounded-lg text-xs border text-center ${
                    targetType === tg.id
                      ? 'bg-cyan-500/20 border-cyan-500 text-neon-cyan font-bold'
                      : 'bg-lab-800 border-lab-700 text-slate-400'
                  }`}
                >
                  {tg.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
