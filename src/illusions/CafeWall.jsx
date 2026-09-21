import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Sparkles, Eye, Info, Sliders, Ruler } from 'lucide-react';

export const CafeWall = ({ onExportReady }) => {
  const canvasRef = useRef(null);

  // Settings
  const [showRulers, setShowRulers] = useState(false);
  const [mortarThickness, setMortarThickness] = useState(3);
  const [mortarColor, setMortarColor] = useState('#888888');
  const [rowOffsetRatio, setRowOffsetRatio] = useState(0.5); // 0 to 1
  const [tileSize, setTileSize] = useState(48);

  // Standalone draw function
  const drawFrame = useCallback((ctx, width, height, time, duration = 0, options = {}) => {
    ctx.clearRect(0, 0, width, height);

    // If in reveal phase, show laser rulers automatically!
    const effectiveShowRulers = options.isRevealPhase ? true : showRulers;

    // Background
    ctx.fillStyle = '#080a0f';
    ctx.fillRect(0, 0, width, height);

    const numRows = Math.ceil(height / (tileSize + mortarThickness)) + 2;
    const numCols = Math.ceil(width / tileSize) + 4;

    ctx.save();
    for (let r = 0; r < numRows; r++) {
      const y = r * (tileSize + mortarThickness);

      // Horizontal Mortar Line
      ctx.fillStyle = mortarColor;
      ctx.fillRect(0, y - mortarThickness, width, mortarThickness);

      // Row offset pattern: 0, 0.5, 0, 0.5...
      // Or subtle shifting wave if animated
      const offset = (r % 2 === 1 ? rowOffsetRatio : 0) * tileSize;

      // Draw black and white alternating tiles
      for (let c = -2; c < numCols; c++) {
        const x = c * tileSize + offset;
        ctx.fillStyle = (c % 2 === 0) ? '#000000' : '#ffffff';
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
    ctx.restore();

    // Laser Rulers to prove lines are 100% horizontal & parallel
    if (effectiveShowRulers) {
      ctx.save();
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 4]);
      ctx.shadowColor = '#00f2fe';
      ctx.shadowBlur = 8;

      for (let r = 0; r < numRows; r++) {
        const y = r * (tileSize + mortarThickness) - (mortarThickness / 2);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();
    }

  }, [showRulers, mortarThickness, mortarColor, rowOffsetRatio, tileSize]);

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

  // Export hook
  useEffect(() => {
    if (onExportReady) {
      onExportReady({
        name: "Café Wall Illusion",
        drawFrame,
        defaultOverlay: "ARE THESE HORIZONTAL LINES STRAIGHT? 📐",
        defaultSubtext: "Focus on the rows: do they look tilted to you?",
        suggestedDurations: [8, 12, 16],
        hasRevealSequence: true,
        revealOverlay: "REVEALING THE TRUTH 🤯",
        revealSubtext: "Laser guide: Every line is 100% straight and parallel!"
      });
    }
  }, [onExportReady, drawFrame]);

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
      {/* Canvas */}
      <div className="flex-1 w-full flex flex-col items-center bg-lab-900 border border-lab-700/60 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-4 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-cyan-500/10 text-neon-cyan border border-cyan-500/30 rounded-full text-xs font-mono font-semibold tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> GEOMETRIC PARALLEL TILT
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">Richard Gregory (1973)</span>
          </div>

          {/* Toggle Ruler Guide */}
          <button
            onClick={() => setShowRulers(!showRulers)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              showRulers
                ? 'bg-neon-cyan text-lab-950 shadow-lg shadow-cyan-500/30'
                : 'bg-lab-800 text-slate-200 hover:bg-lab-750 border border-lab-700'
            }`}
          >
            <Ruler className="w-4 h-4" />
            {showRulers ? 'Hide Laser Rulers' : 'Show 100% Straight Laser Rulers'}
          </button>
        </div>

        {/* Canvas Display */}
        <div className="relative w-full max-w-[640px] aspect-[16/10] bg-black rounded-xl border border-lab-800 shadow-inner flex items-center justify-center p-1 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={960}
            height={600}
            className="w-full h-full object-cover rounded-lg"
          />

          {showRulers && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-lab-950/90 border border-cyan-500/50 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-mono text-neon-cyan shadow-xl">
              Cyan Guide Rulers: 100% Horizontal & Parallel!
            </div>
          )}
        </div>

        {/* Scientific Explanation */}
        <div className="w-full mt-4 p-3.5 bg-lab-850 border border-lab-700/50 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-neon-cyan shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">Why lines look slanted:</strong> First discovered on the tiled wall of a Bristol café, the illusion is caused by <strong>border locking and irradiation</strong>. The gray mortar line is perceived as brighter where it touches black tiles and darker where it touches white tiles. Your brain's orientation detectors interpret these contrast shifts as small wedges, slanting the lines!
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-full xl:w-96 flex flex-col gap-4">
        <div className="bg-lab-900 border border-lab-700/60 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-neon-cyan" /> Mortar & Tile Geometry
          </h3>

          {/* Laser ruler button */}
          <button
            onClick={() => setShowRulers(!showRulers)}
            className={`w-full p-3 rounded-xl text-xs font-medium border flex items-center justify-between transition-all ${
              showRulers
                ? 'bg-cyan-500/20 border-cyan-500 text-neon-cyan font-bold'
                : 'bg-lab-800 border-lab-700 text-slate-300 hover:bg-lab-750'
            }`}
          >
            <span>Parallel Laser Rulers</span>
            <span className="font-mono text-xs">{showRulers ? 'ON' : 'OFF'}</span>
          </button>

          {/* Mortar Thickness */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Mortar Line Thickness</span>
              <span className="text-neon-cyan font-mono">{mortarThickness}px</span>
            </div>
            <input
              type="range"
              min="1"
              max="12"
              step="1"
              value={mortarThickness}
              onChange={(e) => setMortarThickness(parseInt(e.target.value))}
              className="w-full h-1.5 bg-lab-800 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
            />
            <span className="text-[10px] text-slate-400">Notice: Thicker mortar breaks the illusion!</span>
          </div>

          {/* Row Offset */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Row Stagger Offset</span>
              <span className="text-neon-cyan font-mono">{(rowOffsetRatio * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={rowOffsetRatio}
              onChange={(e) => setRowOffsetRatio(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-lab-800 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
            />
          </div>

          {/* Mortar Luminance */}
          <div>
            <label className="text-xs text-slate-300 font-medium block mb-2">Mortar Shade</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Gray (#888)', value: '#888888', note: 'Max Illusion' },
                { label: 'White', value: '#ffffff', note: 'No Tilt' },
                { label: 'Black', value: '#000000', note: 'No Tilt' }
              ].map(m => (
                <button
                  key={m.label}
                  onClick={() => setMortarColor(m.value)}
                  className={`p-2 rounded-xl text-xs border text-center transition-all ${
                    mortarColor === m.value
                      ? 'bg-cyan-500/20 border-cyan-500 text-neon-cyan font-bold'
                      : 'bg-lab-800 border-lab-700 text-slate-400'
                  }`}
                >
                  <div>{m.label}</div>
                  <div className="text-[10px] text-slate-400">{m.note}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
