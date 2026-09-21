import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Eye, Sparkles, Sliders, Info, Zap } from 'lucide-react';

export const KanizsaTriangle = ({ onExportReady }) => {
  const canvasRef = useRef(null);
  const [pacmanRadius, setPacmanRadius] = useState(48);
  const [rotationSpeed, setRotationSpeed] = useState(1);
  const [discColor, setDiscColor] = useState('#0f172a');
  const [showContoursManual, setShowContoursManual] = useState(false);

  // Standalone draw function for interactive canvas & 1080p video recording
  const drawFrame = useCallback((ctx, width, height, time, duration = 0, options = {}) => {
    ctx.clearRect(0, 0, width, height);

    const isReveal = options.isRevealPhase;

    // Background (neutral dark gray)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height * 0.50;
    const size = Math.min(width, height) * 0.65;
    const r = (pacmanRadius / 400) * size;

    // Vertices of the 3 Pac-Man discs (inverted triangle)
    // Top-Left, Top-Right, Bottom
    const p1 = { x: cx - size * 0.38, y: cy - size * 0.22 };
    const p2 = { x: cx + size * 0.38, y: cy - size * 0.22 };
    const p3 = { x: cx, y: cy + size * 0.44 };

    // Vertices of the 3 line-segment triangle (upright triangle)
    const l1 = { x: cx, y: cy - size * 0.44 };
    const l2 = { x: cx - size * 0.38, y: cy + size * 0.22 };
    const l3 = { x: cx + size * 0.38, y: cy + size * 0.22 };

    // In reveal phase: smoothly rotate Pac-Men so their mouths face outward!
    // When mouths face outward, the illusory triangle instantly dematerializes!
    let angleOffset = 0;
    if (isReveal) {
      // Oscillate mouths open and closed
      const tProgress = Math.min(1, ((time % 4) / 2));
      angleOffset = Math.sin(time * 3) * (Math.PI / 1.5);
    }

    // Helper: Draw Pac-Man disc with mouth pointing toward centroid (cx, cy)
    const drawPacman = (pos, baseAngle) => {
      ctx.save();
      ctx.fillStyle = discColor;
      ctx.beginPath();
      const mouthSpread = Math.PI / 3; // 60 degrees
      const startAngle = baseAngle + mouthSpread / 2 + angleOffset;
      const endAngle = baseAngle - mouthSpread / 2 - angleOffset + Math.PI * 2;
      ctx.moveTo(pos.x, pos.y);
      ctx.arc(pos.x, pos.y, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // 1. Draw the 3 outer inverted line angles
    ctx.save();
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = Math.max(3, size * 0.012);
    ctx.beginPath();
    // Angle at top (l1) pointing down to l2 & l3
    ctx.moveTo(l1.x, l1.y);
    ctx.lineTo(l2.x, l2.y);
    ctx.lineTo(l3.x, l3.y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // 2. Draw the 3 Pac-Man discs
    // Disc 1 (Top-Left): mouth points toward bottom-right (down + right)
    drawPacman(p1, Math.PI / 6);
    // Disc 2 (Top-Right): mouth points toward bottom-left (down + left)
    drawPacman(p2, (5 * Math.PI) / 6);
    // Disc 3 (Bottom): mouth points straight up
    drawPacman(p3, -Math.PI / 2);

    // 3. Reveal Phase or Manual Helper: Draw laser outline around the "invisible" triangle
    if (isReveal) {
      ctx.save();
      const pulse = 0.5 + 0.5 * Math.sin(time * 6);
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + 0.6 * pulse})`;
      ctx.lineWidth = Math.max(2.5, size * 0.008);
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.stroke();

      // Banner text
      ctx.fillStyle = '#ef4444';
      ctx.font = `bold ${Math.round(size * 0.045)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('NO REAL TRIANGLE EXISTS', cx, cy - size * 0.48);
      ctx.restore();
    } else if (showContoursManual) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  }, [pacmanRadius, rotationSpeed, discColor, showContoursManual]);

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
        name: "Kanizsa Ghost Triangle",
        drawFrame,
        defaultOverlay: "Do you see the white triangle in front? 👁️",
        defaultSubtext: "Look closely at the borders: does it look brighter?",
        suggestedDurations: [8, 10, 12],
        hasRevealSequence: true,
        revealOverlay: "REVEALING THE TRUTH 🤯",
        revealSubtext: "There is NO triangle! Your visual cortex fabricated the edges."
      });
    }
  }, [onExportReady, drawFrame]);

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
      {/* Visual Canvas Card */}
      <div className="flex-1 w-full flex flex-col items-center bg-lab-900 border border-lab-700/60 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-neon-purple animate-ping" />
            <span className="text-xs font-mono text-neon-purple uppercase tracking-wider">
              Illusory Contours & Gestalt Completion
            </span>
          </div>
          <button
            onClick={() => setShowContoursManual(prev => !prev)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
              showContoursManual
                ? 'bg-purple-500/20 border-neon-purple text-neon-purple'
                : 'bg-lab-800 border-lab-700 text-slate-400 hover:text-white'
            }`}
          >
            {showContoursManual ? 'Dashed Contour ON' : 'Outline Contour'}
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
          Notice how the inverted white triangle appears distinctly brighter and seems to hover in front, 
          with crisp boundary lines. In reality, not a single line or boundary has been drawn!
        </p>
      </div>

      {/* Controls Card */}
      <div className="w-full xl:w-80 bg-lab-900 border border-lab-700/60 rounded-2xl p-5 shadow-2xl space-y-5">
        <div className="flex items-center gap-2 border-b border-lab-800 pb-3">
          <Sliders className="w-4 h-4 text-neon-purple" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Disc Controls</h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300">Pac-Man Radius</span>
              <span className="text-neon-purple font-mono">{pacmanRadius}px</span>
            </div>
            <input
              type="range"
              min="30"
              max="70"
              value={pacmanRadius}
              onChange={(e) => setPacmanRadius(parseInt(e.target.value))}
              className="w-full h-1.5 bg-lab-800 rounded-lg appearance-none cursor-pointer accent-neon-purple"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-lab-800 space-y-2 text-xs text-slate-400">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <Info className="w-4 h-4 text-neon-amber" />
            <span>The Neuroscience:</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            Described by Italian psychologist Gaetano Kanizsa in 1955. Visual cortex area <strong>V2</strong> contains 
            specialized neurons that respond to <em>illusory contours</em>. The brain hypothesizes a white opaque triangle 
            occluding 3 complete black circles and a thin-lined triangle.
          </p>
        </div>
      </div>
    </div>
  );
};
