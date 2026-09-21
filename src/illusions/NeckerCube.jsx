import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Box, Sparkles, Eye, Info, RotateCw, Grid } from 'lucide-react';

export const NeckerCube = ({ onExportReady }) => {
  const canvasRef = useRef(null);

  // Cube state
  const [speed, setSpeed] = useState(1.0);
  const [helperState, setHelperState] = useState('none'); // 'none' | 'faceA' | 'faceB'
  const [gridMode, setGridMode] = useState(false); // Single cube vs 3x3 cube field
  const [cubeColor, setCubeColor] = useState('#00f2fe');

  // 3D vertices of a unit cube centered at origin [-1 to 1]
  const vertices = [
    [-1, -1, -1], // 0
    [ 1, -1, -1], // 1
    [ 1,  1, -1], // 2
    [-1,  1, -1], // 3
    [-1, -1,  1], // 4
    [ 1, -1,  1], // 5
    [ 1,  1,  1], // 6
    [-1,  1,  1], // 7
  ];

  // 12 Edges connecting vertices
  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0], // back face
    [4, 5], [5, 6], [6, 7], [7, 4], // front face
    [0, 4], [1, 5], [2, 6], [3, 7]  // connecting edges
  ];

  // Faces for helper shading
  const faceA = [0, 1, 2, 3]; // Face A
  const faceB = [4, 5, 6, 7]; // Face B

  // 3D Rotation and Orthographic Projection
  const projectPoint = useCallback((pt, rotY, rotX, scale, cx, cy) => {
    let [x, y, z] = pt;

    // Rotate around Y axis
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const rx = x * cosY - z * sinY;
    const rz = x * sinY + z * cosY;

    // Rotate around X axis
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const ry = y * cosX - rz * sinX;
    const fz = y * sinX + rz * cosX;

    // Orthographic projection: no perspective divide!
    return {
      x: cx + rx * scale,
      y: cy + ry * scale,
      z: fz
    };
  }, []);

  // Standalone draw function
  const drawFrame = useCallback((ctx, width, height, time, duration = 0) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#080a0f';
    ctx.fillRect(0, 0, width, height);

    const rotY = time * 0.8 * speed;
    const rotX = 0.45; // Fixed isometric tilt

    // Draw single cube or 3x3 matrix
    const drawSingleCube = (cx, cy, scale) => {
      const proj = vertices.map(v => projectPoint(v, rotY, rotX, scale, cx, cy));

      // Draw Face Helper if enabled
      if (helperState === 'faceA' || helperState === 'faceB') {
        const targetFace = helperState === 'faceA' ? faceA : faceB;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(proj[targetFace[0]].x, proj[targetFace[0]].y);
        for (let i = 1; i < targetFace.length; i++) {
          ctx.lineTo(proj[targetFace[i]].x, proj[targetFace[i]].y);
        }
        ctx.closePath();
        ctx.fillStyle = helperState === 'faceA' ? 'rgba(0, 242, 254, 0.35)' : 'rgba(255, 0, 127, 0.35)';
        ctx.fill();
        ctx.strokeStyle = helperState === 'faceA' ? '#00f2fe' : '#ff007f';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }

      // Draw Edges
      ctx.save();
      ctx.strokeStyle = cubeColor;
      ctx.lineWidth = scale > 80 ? 3.5 : 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Subtle glow
      ctx.shadowColor = cubeColor;
      ctx.shadowBlur = 10;

      for (const [i1, i2] of edges) {
        ctx.beginPath();
        ctx.moveTo(proj[i1].x, proj[i1].y);
        ctx.lineTo(proj[i2].x, proj[i2].y);
        ctx.stroke();
      }

      // Draw Vertices
      ctx.fillStyle = '#ffffff';
      for (const p of proj) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, scale > 80 ? 4.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    if (gridMode) {
      // 3x3 Grid
      const rows = 3;
      const cols = 3;
      const cellW = width / cols;
      const cellH = height / rows;
      const subScale = Math.min(cellW, cellH) * 0.28;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cx = (c + 0.5) * cellW;
          const cy = (r + 0.5) * cellH;
          drawSingleCube(cx, cy, subScale);
        }
      }
    } else {
      // Single Large Cube
      const scale = Math.min(width, height) * 0.26;
      drawSingleCube(width / 2, height / 2, scale);
    }
  }, [speed, helperState, gridMode, cubeColor, projectPoint]);

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

  // Pass export hook
  useEffect(() => {
    if (onExportReady) {
      onExportReady({
        name: "3D Bistable Necker Cube",
        drawFrame,
        defaultOverlay: "WHICH FACE IS IN FRONT? 🧊",
        defaultSubtext: "Blink and reverse the depth in your mind!",
        suggestedDurations: [10, 15, 20]
      });
    }
  }, [onExportReady, drawFrame]);

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
      {/* Canvas Area */}
      <div className="flex-1 w-full flex flex-col items-center bg-lab-900 border border-lab-700/60 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-4 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-cyan-500/10 text-neon-cyan border border-cyan-500/30 rounded-full text-xs font-mono font-semibold tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> BISTABLE ORTHOGRAPHIC FLIP
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">Louis Albert Necker (1832)</span>
          </div>

          {/* Mode Switcher */}
          <button
            onClick={() => setGridMode(!gridMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              gridMode
                ? 'bg-purple-500/20 border-neon-purple text-neon-purple'
                : 'bg-lab-800 border-lab-700 text-slate-300 hover:bg-lab-750'
            }`}
          >
            <Grid className="w-3.5 h-3.5" /> {gridMode ? '3x3 Matrix Grid' : 'Single Cube'}
          </button>
        </div>

        {/* Canvas Display */}
        <div className="relative w-full max-w-[500px] aspect-square bg-lab-950 rounded-xl border border-lab-800 shadow-inner flex items-center justify-center p-2">
          <canvas
            ref={canvasRef}
            width={720}
            height={720}
            className="w-full h-full object-contain rounded-lg"
          />

          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-lab-900/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-cyan-500/30 shadow-lg flex items-center gap-2 pointer-events-none">
            <span className="text-xs font-semibold text-slate-200">
              {helperState === 'none' ? 'Which face is pointing towards you?' : `Forced Front: ${helperState.toUpperCase()}`}
            </span>
          </div>
        </div>

        {/* Scientific Explanation */}
        <div className="w-full mt-4 p-3.5 bg-lab-850 border border-lab-700/50 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-neon-cyan shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">Why it flips:</strong> In an orthographic line drawing of a 3D cube, there are two distinct 3D orientations that create the exact same 2D silhouette. Because your retinas receive no cues as to which vertex is closer, your visual cortex generates two spontaneous perceptual states and toggles between them every few seconds!
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-full xl:w-96 flex flex-col gap-4">
        <div className="bg-lab-900 border border-lab-700/60 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Box className="w-4 h-4 text-neon-cyan" /> Mental Flip Training
          </h3>

          {/* Forced State Buttons */}
          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-medium block">Perceptual Override Cues</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setHelperState('none')}
                className={`p-2.5 rounded-xl text-xs border text-center transition-all ${
                  helperState === 'none'
                    ? 'bg-cyan-500/20 border-neon-cyan text-neon-cyan font-bold'
                    : 'bg-lab-800 border-lab-700 text-slate-400'
                }`}
              >
                Ambiguous
                <span className="block text-[10px] text-slate-400 font-normal">Mind flip</span>
              </button>

              <button
                onClick={() => setHelperState('faceA')}
                className={`p-2.5 rounded-xl text-xs border text-center transition-all ${
                  helperState === 'faceA'
                    ? 'bg-cyan-500/20 border-neon-cyan text-neon-cyan font-bold'
                    : 'bg-lab-800 border-lab-700 text-slate-400'
                }`}
              >
                Force Face A
                <span className="block text-[10px] text-slate-400 font-normal">Cyan front</span>
              </button>

              <button
                onClick={() => setHelperState('faceB')}
                className={`p-2.5 rounded-xl text-xs border text-center transition-all ${
                  helperState === 'faceB'
                    ? 'bg-magenta-500/20 border-neon-magenta text-neon-magenta font-bold'
                    : 'bg-lab-800 border-lab-700 text-slate-400'
                }`}
              >
                Force Face B
                <span className="block text-[10px] text-slate-400 font-normal">Pink front</span>
              </button>
            </div>
          </div>

          {/* Speed slider */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Rotation Speed</span>
              <span className="text-neon-cyan font-mono">{speed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-lab-800 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
            />
          </div>

          {/* Color Scheme */}
          <div>
            <label className="text-xs text-slate-300 font-medium block mb-2">Wireframe Glow Color</label>
            <div className="flex items-center gap-2">
              {[
                { name: 'Cyan', color: '#00f2fe' },
                { name: 'Magenta', color: '#ff007f' },
                { name: 'Lime', color: '#00ff88' },
                { name: 'White', color: '#ffffff' },
                { name: 'Amber', color: '#ffb703' }
              ].map(c => (
                <button
                  key={c.name}
                  onClick={() => setCubeColor(c.color)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    cubeColor === c.color ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
