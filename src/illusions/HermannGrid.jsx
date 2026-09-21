import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Eye, Sparkles, Sliders, Info, Zap } from 'lucide-react';

export const HermannGrid = ({ onExportReady }) => {
  const canvasRef = useRef(null);
  const [gridSize, setGridSize] = useState(5); // 5x5 squares
  const [lineWidth, setLineWidth] = useState(14);
  const [squareColor, setSquareColor] = useState('#0d1117');
  const [laneColor, setLaneColor] = useState('#f8fafc');
  const [showHelperFocus, setShowHelperFocus] = useState(false);

  // Standalone draw function for interactive canvas & 1080p video recording
  const drawFrame = useCallback((ctx, width, height, time, duration = 0, options = {}) => {
    ctx.clearRect(0, 0, width, height);

    const isReveal = options.isRevealPhase;

    // Background
    ctx.fillStyle = '#080a0f';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height * 0.50;
    const arenaSize = Math.min(width, height) * 0.72;

    const totalLines = gridSize - 1;
    const totalGaps = gridSize;
    const scaledLaneWidth = Math.max(10, (lineWidth / 500) * arenaSize);
    const squareSize = (arenaSize - totalLines * scaledLaneWidth) / totalGaps;

    const startX = cx - arenaSize / 2;
    const startY = cy - arenaSize / 2;

    // 1. Draw lanes background
    ctx.fillStyle = laneColor;
    ctx.fillRect(startX, startY, arenaSize, arenaSize);

    // 2. Draw black squares
    ctx.fillStyle = squareColor;
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const x = startX + c * (squareSize + scaledLaneWidth);
        const y = startY + r * (squareSize + scaledLaneWidth);
        ctx.fillRect(x, y, squareSize, squareSize);
      }
    }

    // 3. Hermann / Scintillating Intersection Dots
    // In peripheral vision, human retinal ganglion cells produce lateral inhibition (dark spots appear at white intersections)
    // In the reveal phase, highlight the truth: the intersections are 100% pure white!
    if (isReveal) {
      // Pulsing laser rings around intersections proving they are pure white
      ctx.save();
      const pulse = 0.5 + 0.5 * Math.sin(time * 6);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = Math.max(2, arenaSize * 0.006);

      for (let r = 0; r < totalLines; r++) {
        for (let c = 0; c < totalLines; c++) {
          const ix = startX + (c + 1) * squareSize + (c + 0.5) * scaledLaneWidth;
          const iy = startY + (r + 1) * squareSize + (r + 0.5) * scaledLaneWidth;

          // Target crosshairs
          const rSize = scaledLaneWidth * (1.1 + 0.3 * pulse);
          ctx.beginPath();
          ctx.arc(ix, iy, rSize, 0, Math.PI * 2);
          ctx.stroke();

          // Green check mark inside center intersection
          if (r === Math.floor(totalLines / 2) && c === Math.floor(totalLines / 2)) {
            ctx.fillStyle = '#22c55e';
            ctx.font = `bold ${Math.round(arenaSize * 0.04)}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✓ 100% WHITE', ix, iy - scaledLaneWidth * 2);
          }
        }
      }
      ctx.restore();
    } else if (showHelperFocus) {
      // Highlight single intersection to demonstrate that looking directly at any dot makes it disappear
      const ix = startX + squareSize + scaledLaneWidth * 0.5;
      const iy = startY + squareSize + scaledLaneWidth * 0.5;
      ctx.save();
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ix, iy, scaledLaneWidth * 1.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }, [gridSize, lineWidth, squareColor, laneColor, showHelperFocus]);

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
        name: "Hermann Ghost Grid",
        drawFrame,
        defaultOverlay: "Count the black dots in this grid 👁️",
        defaultSubtext: "Notice how they disappear when you look directly at them! 👇",
        suggestedDurations: [8, 10, 12],
        hasRevealSequence: true,
        revealOverlay: "REVEALING THE TRUTH 🤯",
        revealSubtext: "There are ZERO black dots! Your retinal ganglion cells invented them."
      });
    }
  }, [onExportReady, drawFrame]);

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
      {/* Visual Canvas Card */}
      <div className="flex-1 w-full flex flex-col items-center bg-lab-900 border border-lab-700/60 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-neon-cyan animate-ping" />
            <span className="text-xs font-mono text-neon-cyan uppercase tracking-wider">
              Lateral Inhibition Phenomenon
            </span>
          </div>
          <button
            onClick={() => setShowHelperFocus(prev => !prev)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
              showHelperFocus
                ? 'bg-cyan-500/20 border-neon-cyan text-neon-cyan'
                : 'bg-lab-800 border-lab-700 text-slate-400 hover:text-white'
            }`}
          >
            {showHelperFocus ? 'Focus Ring ON' : 'Show Focus Ring'}
          </button>
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
          Look across the grid: ghost-like dark dots flash at the white intersections. 
          When you stare directly at any specific intersection, the dot instantly vanishes!
        </p>
      </div>

      {/* Controls Card */}
      <div className="w-full xl:w-80 bg-lab-900 border border-lab-700/60 rounded-2xl p-5 shadow-2xl space-y-5">
        <div className="flex items-center gap-2 border-b border-lab-800 pb-3">
          <Sliders className="w-4 h-4 text-neon-cyan" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Grid Parameters</h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300">Grid Density</span>
              <span className="text-neon-cyan font-mono">{gridSize}×{gridSize}</span>
            </div>
            <input
              type="range"
              min="3"
              max="7"
              value={gridSize}
              onChange={(e) => setGridSize(parseInt(e.target.value))}
              className="w-full h-1.5 bg-lab-800 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300">Lane Width</span>
              <span className="text-neon-cyan font-mono">{lineWidth}px</span>
            </div>
            <input
              type="range"
              min="8"
              max="24"
              value={lineWidth}
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="w-full h-1.5 bg-lab-800 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-lab-800 space-y-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <Info className="w-4 h-4 text-neon-amber" />
            <span>The Neuroscience:</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            Discovered by Ludimar Hermann in 1870. Receptive fields in the peripheral retina experience 
            greater <strong>lateral inhibition</strong> at intersection crossings (surrounded by 4 white corridors) 
            than along straight avenues (surrounded by only 2 white corridors), causing the brain to perceive 
            reduced brightness (dark phantom dots).
          </p>
        </div>
      </div>
    </div>
  );
};
