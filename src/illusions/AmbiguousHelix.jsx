import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Sparkles, Eye, Info, RotateCw, RotateCcw, Sliders, Layers } from 'lucide-react';

export const AmbiguousHelix = ({ onExportReady }) => {
  const canvasRef = useRef(null);

  // Controls
  const [speed, setSpeed] = useState(1.0);
  const [helperMode, setHelperMode] = useState('none'); // 'none' | 'clockwise' | 'counter-clockwise' | 'depth'
  const [dotCount, setDotCount] = useState(60);
  const [structureType, setStructureType] = useState('double-helix'); // 'double-helix' | 'ring-torus' | 'cylinder'
  const [colorTheme, setColorTheme] = useState('cyan'); // 'cyan' | 'monochrome' | 'rainbow'

  // Brain flip tracking
  const [perceivedDir, setPerceivedDir] = useState(null);
  const [flipCount, setFlipCount] = useState(0);

  // Standalone draw function
  const drawFrame = useCallback((ctx, width, height, time, duration = 0, options = {}) => {
    ctx.clearRect(0, 0, width, height);

    // Dark background
    ctx.fillStyle = '#080a0f';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.28;
    const heightSpan = Math.min(width, height) * 0.58;
    const rotSpeed = time * speed * 2.2;

    // Check if options override helperMode (e.g. for automatic reveal during video export)
    const activeHelper = options.helperOverride !== undefined ? options.helperOverride : helperMode;

    ctx.save();

    // Generate and project 3D points
    const points = [];
    const n = dotCount;

    if (structureType === 'double-helix') {
      // Two interlocking intertwined helices
      for (let strand = 0; strand < 2; strand++) {
        const strandOffset = strand * Math.PI;
        for (let i = 0; i < n; i++) {
          const t = (i / (n - 1)) * 2 - 1; // -1 to 1 along Y axis
          const angle = t * Math.PI * 3 + rotSpeed + strandOffset;
          const x = radius * Math.cos(angle);
          const y = t * (heightSpan / 2);
          const z = radius * Math.sin(angle);
          points.push({ x, y, z, strand, t });
        }
      }
    } else if (structureType === 'ring-torus') {
      // Rotating ring of rings / torus
      const ringCount = 12;
      const dotsPerRing = Math.floor(n / ringCount);
      for (let r = 0; r < ringCount; r++) {
        const ringAngle = (r / ringCount) * Math.PI * 2 + rotSpeed;
        for (let d = 0; d < dotsPerRing; d++) {
          const theta = (d / dotsPerRing) * Math.PI * 2;
          const tubeR = radius * 0.35;
          const mainR = radius * 0.75;
          const localX = (mainR + tubeR * Math.cos(theta)) * Math.cos(ringAngle);
          const localZ = (mainR + tubeR * Math.cos(theta)) * Math.sin(ringAngle);
          const localY = tubeR * Math.sin(theta);
          points.push({ x: localX, y: localY, z: localZ, strand: r % 2, t: 0 });
        }
      }
    } else {
      // Spinning Cylinder
      const rings = 8;
      const dotsPerRing = Math.floor(n / rings);
      for (let r = 0; r < rings; r++) {
        const y = ((r / (rings - 1)) * 2 - 1) * (heightSpan / 2);
        for (let d = 0; d < dotsPerRing; d++) {
          const angle = (d / dotsPerRing) * Math.PI * 2 + rotSpeed;
          const x = radius * Math.cos(angle);
          const z = radius * Math.sin(angle);
          points.push({ x, y, z, strand: r % 2, t: r / rings });
        }
      }
    }

    // Sort points: In pure ambiguous mode, we DO NOT depth-sort!
    // That is the exact mathematical secret: without depth sorting or shading,
    // +Z and -Z are completely identical, causing spontaneous bistable direction reversals!
    if (activeHelper === 'depth') {
      points.sort((a, b) => a.z - b.z); // Render back-to-front
    }

    // Draw connecting lines if double helix
    if (structureType === 'double-helix') {
      const halfN = points.length / 2;
      for (let i = 0; i < halfN; i += 2) {
        const p1 = points[i];
        const p2 = points[i + halfN];
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(cx + p1.x, cy + p1.y);
          ctx.lineTo(cx + p2.x, cy + p2.y);
          ctx.strokeStyle = activeHelper === 'none' 
            ? 'rgba(100, 116, 139, 0.25)'
            : 'rgba(0, 242, 254, 0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // Draw points
    for (const pt of points) {
      const screenX = cx + pt.x;
      const screenY = cy + pt.y;

      let ptColor = '#00f2fe';
      let dotSize = 4.5;

      if (colorTheme === 'monochrome') {
        ptColor = '#ffffff';
      } else if (colorTheme === 'rainbow') {
        const hue = (pt.strand * 180 + ((pt.t + 1) * 90)) % 360;
        ptColor = `hsl(${hue}, 100%, 65%)`;
      }

      // Visual Helper Cues to force direction
      if (activeHelper === 'clockwise') {
        // Highlight front dots when moving right
        if (pt.z > 0) {
          ptColor = '#00f2fe';
          dotSize = 6;
        } else {
          ptColor = 'rgba(71, 85, 105, 0.4)';
          dotSize = 3;
        }
      } else if (activeHelper === 'counter-clockwise') {
        // Highlight back dots
        if (pt.z < 0) {
          ptColor = '#ff007f';
          dotSize = 6;
        } else {
          ptColor = 'rgba(71, 85, 105, 0.4)';
          dotSize = 3;
        }
      } else if (activeHelper === 'depth') {
        // Genuine 3D depth cueing: closer points are brighter and larger
        const depthNorm = (pt.z + radius) / (2 * radius); // 0 to 1
        dotSize = 2.5 + depthNorm * 4.5;
        ptColor = depthNorm > 0.5 ? '#00f2fe' : '#334155';
      }

      // Draw dot
      ctx.beginPath();
      ctx.arc(screenX, screenY, dotSize, 0, Math.PI * 2);
      ctx.fillStyle = ptColor;
      ctx.fill();

      // Glow on highlight dots
      if (dotSize > 5) {
        ctx.shadowColor = ptColor;
        ctx.shadowBlur = 8;
      }
    }

    // Direction indicators if in helper mode
    if (activeHelper === 'clockwise' || activeHelper === 'counter-clockwise') {
      const isCW = activeHelper === 'clockwise';
      ctx.save();
      ctx.font = "bold 14px 'Inter', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillStyle = isCW ? '#00f2fe' : '#ff007f';
      ctx.fillText(isCW ? "FORCING: CLOCKWISE ROTATION" : "FORCING: COUNTER-CLOCKWISE", cx, height - 30);
      ctx.restore();
    }

    ctx.restore();

  }, [speed, helperMode, dotCount, structureType, colorTheme]);

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

  // Export Hook with Truth-Reveal logic
  useEffect(() => {
    if (onExportReady) {
      onExportReady({
        name: "Ambiguous Spinning Helix",
        drawFrame: (ctx, width, height, time, duration) => {
          // Halfway through video, trigger automatic truth reveal!
          const isSecondHalf = duration > 0 && time > (duration / 2);
          const helperOverride = isSecondHalf ? 'depth' : 'none';
          drawFrame(ctx, width, height, time, duration, { helperOverride });
        },
        defaultOverlay: "WHICH DIRECTION IS THIS SPINNING? 🌀",
        defaultSubtext: "Focus on the left vs right edge to reverse it!",
        suggestedDurations: [10, 14, 18],
        hasRevealSequence: true,
        revealTimeRatio: 0.5,
        revealOverlay: "REVEALING THE TRUTH 🤯",
        revealSubtext: "There is NO depth! Your brain invents the spin!"
      });
    }
  }, [onExportReady, drawFrame]);

  const handleFlip = (dir) => {
    setPerceivedDir(dir);
    setFlipCount(prev => prev + 1);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
      {/* Canvas Card */}
      <div className="flex-1 w-full flex flex-col items-center bg-lab-900 border border-lab-700/60 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-4 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-cyan-500/10 text-neon-cyan border border-cyan-500/30 rounded-full text-xs font-mono font-semibold tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> BISTABLE KINETIC DEPTH
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">Wallach & O'Connell</span>
          </div>

          {/* Quick Brain Flip Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFlip('CW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                perceivedDir === 'CW'
                  ? 'bg-cyan-500 text-lab-950 shadow-lg shadow-cyan-500/30'
                  : 'bg-lab-800 text-slate-300 hover:bg-lab-750 border border-lab-700'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" /> Turning Right / CW
            </button>
            <button
              onClick={() => handleFlip('CCW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                perceivedDir === 'CCW'
                  ? 'bg-neon-magenta text-white shadow-lg shadow-magenta-500/30'
                  : 'bg-lab-800 text-slate-300 hover:bg-lab-750 border border-lab-700'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Turning Left / CCW
            </button>
          </div>
        </div>

        {/* Canvas Display */}
        <div className="relative w-full max-w-[500px] aspect-[4/5] bg-lab-950 rounded-xl border border-lab-800 shadow-inner flex items-center justify-center p-2">
          <canvas
            ref={canvasRef}
            width={720}
            height={900}
            className="w-full h-full object-contain rounded-lg"
          />

          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-lab-900/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-cyan-500/30 shadow-lg flex items-center gap-2 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-neon-cyan animate-ping" />
            <span className="text-xs font-semibold text-slate-200">
              Shift your focus: it will reverse directions!
            </span>
          </div>

          {flipCount > 0 && (
            <div className="absolute bottom-4 left-4 bg-lab-900/80 backdrop-blur-md px-3 py-1 rounded-lg border border-lab-700 text-xs font-mono text-slate-300">
              Brain Flips: <span className="text-neon-cyan font-bold">{flipCount}</span>
            </div>
          )}
        </div>

        {/* Brain Guide */}
        <div className="w-full mt-4 p-3.5 bg-lab-850 border border-lab-700/50 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-neon-cyan shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">Mental Reversal Trick:</strong> Look at the outer left edge and imagine it moving towards you. Then suddenly look at the outer right edge and imagine <em>that</em> side moving towards you. Without changing a single pixel in the code, the rotation will flip in your mind!
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-full xl:w-96 flex flex-col gap-4">
        {/* Visual Cues */}
        <div className="bg-lab-900 border border-lab-700/60 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Eye className="w-4 h-4 text-neon-cyan" /> Visual Training Cues
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setHelperMode('none')}
              className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                helperMode === 'none'
                  ? 'bg-cyan-500/20 border-cyan-500 text-neon-cyan'
                  : 'bg-lab-800 border-lab-700 text-slate-300'
              }`}
            >
              <div className="font-bold mb-0.5">Pure Ambiguous</div>
              <div className="text-[10px] text-slate-400">Zero depth (pure mind)</div>
            </button>

            <button
              onClick={() => setHelperMode('clockwise')}
              className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                helperMode === 'clockwise'
                  ? 'bg-cyan-500/20 border-cyan-500 text-neon-cyan'
                  : 'bg-lab-800 border-lab-700 text-slate-300'
              }`}
            >
              <div className="font-bold mb-0.5 flex items-center gap-1">
                <RotateCw className="w-3 h-3" /> Force Clockwise
              </div>
              <div className="text-[10px] text-slate-400">Right-turning cue</div>
            </button>

            <button
              onClick={() => setHelperMode('counter-clockwise')}
              className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                helperMode === 'counter-clockwise'
                  ? 'bg-magenta-500/20 border-neon-magenta text-neon-magenta'
                  : 'bg-lab-800 border-lab-700 text-slate-300'
              }`}
            >
              <div className="font-bold mb-0.5 flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Force Counter-CW
              </div>
              <div className="text-[10px] text-slate-400">Left-turning cue</div>
            </button>

            <button
              onClick={() => setHelperMode('depth')}
              className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                helperMode === 'depth'
                  ? 'bg-purple-500/20 border-neon-purple text-neon-purple'
                  : 'bg-lab-800 border-lab-700 text-slate-300'
              }`}
            >
              <div className="font-bold mb-0.5 flex items-center gap-1">
                <Layers className="w-3 h-3" /> True 3D Depth
              </div>
              <div className="text-[10px] text-slate-400">Front vs back sorted</div>
            </button>
          </div>

          {/* Structure Type */}
          <div>
            <label className="text-xs text-slate-300 font-medium block mb-2">Kinetic Geometry</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'double-helix', label: '🧬 Double Helix' },
                { id: 'ring-torus', label: '🍩 Torus Ring' },
                { id: 'cylinder', label: '🥫 Cylinder' }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setStructureType(st.id)}
                  className={`p-2 rounded-xl text-xs border text-center transition-all ${
                    structureType === st.id
                      ? 'bg-cyan-500/20 border-cyan-500 text-neon-cyan font-bold'
                      : 'bg-lab-800 border-lab-700 text-slate-400'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Speed slider */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Kinetic Speed</span>
              <span className="text-neon-cyan font-mono">{speed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="2.5"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-lab-800 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
            />
          </div>

          {/* Color Themes */}
          <div>
            <label className="text-xs text-slate-300 font-medium block mb-2">Color Palette</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cyan', label: 'Neon Cyan' },
                { id: 'monochrome', label: 'Pure White' },
                { id: 'rainbow', label: 'Prism Spectral' }
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => setColorTheme(c.id)}
                  className={`p-1.5 rounded-lg text-xs border text-center ${
                    colorTheme === c.id
                      ? 'bg-cyan-500/20 border-cyan-500 text-white font-bold'
                      : 'bg-lab-800 border-lab-700 text-slate-400'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
