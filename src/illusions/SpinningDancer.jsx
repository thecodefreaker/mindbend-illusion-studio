import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCw, RotateCcw, Eye, Sparkles, HelpCircle, Gauge, Layers, Info } from 'lucide-react';

export const SpinningDancer = ({ onExportReady, isDark = true }) => {
  const canvasRef = useRef(null);
  
  // Interactive controls
  const [speed, setSpeed] = useState(1.0);
  const [helperMode, setHelperMode] = useState('none'); // 'none' | 'clockwise' | 'counter-clockwise' | 'wireframe'
  const [showShadow, setShowShadow] = useState(true);
  const [silhouetteColor, setSilhouetteColor] = useState('#00f2fe');
  const [viewAngle, setViewAngle] = useState(0); // Slight vertical pitch tilt

  // Brain flip stats / interactive game
  const [perceivedDirection, setPerceivedDirection] = useState(null);
  const [flipCount, setFlipCount] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  // 3D Model of the Dancer (Ballet pirouette pose)
  // Coordinates are defined in 3D: [x, y, z] where Y is vertical (negative is up, positive is down)
  const getDancerModel = useCallback(() => {
    // Spine & Torso points
    return {
      head: { center: [0, -170, 0], radius: 14, bun: [0, -180, -10] },
      neck: [0, -152, 0],
      chest: [0, -130, 0],
      waist: [0, -100, 0],
      hips: [0, -70, 0],
      
      // Left arm (gracefully raised outward)
      leftShoulder: [-22, -135, 0],
      leftElbow: [-50, -145, -15],
      leftHand: [-75, -165, -10],
      
      // Right arm (curved forward in arabesque)
      rightShoulder: [22, -135, 0],
      rightElbow: [45, -125, 25],
      rightHand: [65, -115, 45],
      
      // Standing Left Leg (Pivot leg, straight on toe)
      leftHip: [-12, -65, 0],
      leftKnee: [-6, 20, 0],
      leftAnkle: [-2, 100, 0],
      leftToe: [-1, 130, 0],
      
      // Raised Right Leg (Bent at knee, extended in attitude)
      rightHip: [14, -65, 0],
      rightKnee: [38, -10, 45],
      rightAnkle: [65, 30, 75],
      rightToe: [78, 45, 92],
    };
  }, []);

  // Projection math: Rotates a 3D point around Y-axis with optional pitch tilt
  const projectPoint = useCallback((p, angleRad, pitchAngle = 0) => {
    const [x, y, z] = p;
    // Rotate around Y axis
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);
    const rx = x * cosA - z * sinA;
    const rz = x * sinA + z * cosA;

    // Optional pitch tilt around X axis
    const cosP = Math.cos(pitchAngle);
    const sinP = Math.sin(pitchAngle);
    const ry = y * cosP - rz * sinP;
    const finalZ = y * sinP + rz * cosP;

    return { x: rx, y: ry, z: finalZ };
  }, []);

  // Standalone draw function for both interactive canvas and video export
  const drawFrame = useCallback((ctx, width, height, time, duration = 0, options = {}) => {
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height * 0.52;
    const scale = Math.min(width, height) / 380;
    const angle = time * speed * 2.5;
    const pitch = (viewAngle * Math.PI) / 180;
    const model = getDancerModel();

    // Check if automatic truth reveal phase is active (for Instagram Reel mode)
    const isReveal = options.isRevealPhase;
    let activeHelper = helperMode;
    if (isReveal) {
      // In the reveal phase, cycle between Clockwise (cyan) and Counter-CW (magenta) every 2 seconds
      const cycle = Math.floor(time / 2) % 2;
      activeHelper = cycle === 0 ? 'clockwise' : 'counter-clockwise';
    }

    // Helper: Project a point
    const proj = (pt) => {
      const p = projectPoint(pt, angle, pitch);
      return { x: cx + p.x * scale, y: cy + p.y * scale, z: p.z };
    };

    // 1. Draw floor shadow if enabled
    if (showShadow) {
      ctx.save();
      const shadowY = cy + 130 * scale;
      const shadowScaleX = 55 * scale;
      const shadowScaleZ = 25 * scale;
      ctx.beginPath();
      ctx.ellipse(cx, shadowY, shadowScaleX, shadowScaleZ, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 242, 254, 0.08)';
      ctx.fill();

      // Rotating leg shadow
      const rightToeProj = proj(model.rightToe);
      const shadowLegX = cx + (rightToeProj.x - cx) * 0.6;
      ctx.beginPath();
      ctx.ellipse(shadowLegX, shadowY, 20 * scale, 10 * scale, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 242, 254, 0.12)';
      ctx.fill();
      ctx.restore();
    }

    // 2. Project all body landmarks
    const head = proj(model.head.center);
    const bun = proj(model.head.bun);
    const neck = proj(model.neck);
    const chest = proj(model.chest);
    const waist = proj(model.waist);
    const hips = proj(model.hips);

    const lShoulder = proj(model.leftShoulder);
    const lElbow = proj(model.leftElbow);
    const lHand = proj(model.leftHand);

    const rShoulder = proj(model.rightShoulder);
    const rElbow = proj(model.rightElbow);
    const rHand = proj(model.rightHand);

    const lHip = proj(model.leftHip);
    const lKnee = proj(model.leftKnee);
    const lAnkle = proj(model.leftAnkle);
    const lToe = proj(model.leftToe);

    const rHip = proj(model.rightHip);
    const rKnee = proj(model.rightKnee);
    const rAnkle = proj(model.rightAnkle);
    const rToe = proj(model.rightToe);

    // Is the raised leg currently in front (+z) or behind (-z)?
    const isRaisedLegInFront = rKnee.z > 0;

    // Determine drawing mode
    const isWireframe = activeHelper === 'wireframe';
    const isClockwiseHelper = activeHelper === 'clockwise';
    const isCounterHelper = activeHelper === 'counter-clockwise';

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Limb drawing helper with variable thickness
    const drawLimb = (p1, p2, width1, width2, colorOverride = null) => {
      ctx.save();
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy);
      if (len < 0.001) return;
      const nx = -dy / len;
      const ny = dx / len;

      ctx.beginPath();
      ctx.moveTo(p1.x + nx * (width1 / 2), p1.y + ny * (width1 / 2));
      ctx.lineTo(p2.x + nx * (width2 / 2), p2.y + ny * (width2 / 2));
      ctx.lineTo(p2.x - nx * (width2 / 2), p2.y - ny * (width2 / 2));
      ctx.lineTo(p1.x - nx * (width1 / 2), p1.y - ny * (width1 / 2));
      ctx.closePath();

      if (colorOverride) {
        ctx.fillStyle = colorOverride;
      } else {
        ctx.fillStyle = silhouetteColor;
      }
      ctx.fill();

      if (isWireframe) {
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    };

    // Helper for circular joints
    const drawJoint = (p, r, colorOverride = null) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = colorOverride || silhouetteColor;
      ctx.fill();
      if (isWireframe) {
        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    // Color cueing for brain reversal
    let raisedLegColor = silhouetteColor;
    let standingLegColor = silhouetteColor;

    if (isClockwiseHelper) {
      // In Clockwise interpretation, the raised leg moves right-to-left in front
      raisedLegColor = isRaisedLegInFront ? '#00f2fe' : '#1e293b';
      standingLegColor = '#cbd5e1';
    } else if (isCounterHelper) {
      // In Counter-Clockwise interpretation, the raised leg is in front when moving left-to-right
      raisedLegColor = !isRaisedLegInFront ? '#ff007f' : '#1e293b';
      standingLegColor = '#cbd5e1';
    }

    // DRAW BODY:
    // Head & Hair Bun
    drawJoint(head, 14 * scale, isWireframe ? 'rgba(0, 242, 254, 0.2)' : silhouetteColor);
    drawJoint(bun, 7 * scale, isWireframe ? 'rgba(0, 242, 254, 0.2)' : silhouetteColor);

    // Neck
    drawLimb(head, neck, 12 * scale, 14 * scale);

    // Torso (Upper Chest to Hips)
    drawLimb(neck, chest, 14 * scale, 24 * scale);
    drawLimb(chest, waist, 24 * scale, 18 * scale);
    drawLimb(waist, hips, 18 * scale, 26 * scale);

    // Standing Left Leg (Pivot)
    drawLimb(lHip, lKnee, 13 * scale, 10 * scale, standingLegColor);
    drawLimb(lKnee, lAnkle, 10 * scale, 7 * scale, standingLegColor);
    drawLimb(lAnkle, lToe, 7 * scale, 4 * scale, standingLegColor);

    // Raised Right Leg
    drawLimb(rHip, rKnee, 14 * scale, 10 * scale, raisedLegColor);
    drawLimb(rKnee, rAnkle, 10 * scale, 7 * scale, raisedLegColor);
    drawLimb(rAnkle, rToe, 7 * scale, 3 * scale, raisedLegColor);

    // Left Arm
    drawLimb(neck, lShoulder, 16 * scale, 12 * scale);
    drawLimb(lShoulder, lElbow, 10 * scale, 8 * scale);
    drawLimb(lElbow, lHand, 8 * scale, 4 * scale);

    // Right Arm
    drawLimb(neck, rShoulder, 16 * scale, 12 * scale);
    drawLimb(rShoulder, rElbow, 10 * scale, 8 * scale);
    drawLimb(rElbow, rHand, 8 * scale, 4 * scale);

    // Wireframe overlay skeleton
    if (isWireframe) {
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Spine
      ctx.moveTo(head.x, head.y);
      ctx.lineTo(chest.x, chest.y);
      ctx.lineTo(waist.x, waist.y);
      ctx.lineTo(hips.x, hips.y);
      // Standing leg
      ctx.lineTo(lKnee.x, lKnee.y);
      ctx.lineTo(lAnkle.x, lAnkle.y);
      ctx.lineTo(lToe.x, lToe.y);
      // Arms
      ctx.moveTo(lHand.x, lHand.y);
      ctx.lineTo(lElbow.x, lElbow.y);
      ctx.lineTo(neck.x, neck.y);
      ctx.lineTo(rElbow.x, rElbow.y);
      ctx.lineTo(rHand.x, rHand.y);
      // Raised leg
      ctx.moveTo(hips.x, hips.y);
      ctx.lineTo(rKnee.x, rKnee.y);
      ctx.lineTo(rAnkle.x, rAnkle.y);
      ctx.lineTo(rToe.x, rToe.y);
      ctx.stroke();
    }

    // Direction Guide Arrows if in helper mode
    if (isClockwiseHelper || isCounterHelper) {
      ctx.save();
      const arrowY = cy + 155 * scale;
      const arrowRadius = 60 * scale;
      const isCW = isClockwiseHelper;

      ctx.beginPath();
      ctx.arc(cx, arrowY, arrowRadius, 0, Math.PI * 2);
      ctx.strokeStyle = isCW ? 'rgba(0, 242, 254, 0.3)' : 'rgba(255, 0, 127, 0.3)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.stroke();

      // Draw directional arrow tip
      const tipAngle = isCW ? Math.PI * 0.25 : Math.PI * 0.75;
      const tipX = cx + arrowRadius * Math.cos(tipAngle);
      const tipY = arrowY + (arrowRadius * 0.4) * Math.sin(tipAngle);

      ctx.fillStyle = isCW ? '#00f2fe' : '#ff007f';
      ctx.beginPath();
      ctx.arc(tipX, tipY, 6 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.font = `700 ${14 * scale}px 'Inter', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(isCW ? "FORCE CLOCKWISE" : "FORCE COUNTER-CLOCKWISE", cx, arrowY + 28 * scale);
      ctx.restore();
    }

    ctx.restore();
  }, [speed, helperMode, showShadow, silhouetteColor, viewAngle, getDancerModel, projectPoint]);

  // Main interactive animation loop
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

  // Pass export hook to parent
  useEffect(() => {
    if (onExportReady) {
      onExportReady({
        name: "Spinning Silhouette",
        drawFrame,
        defaultOverlay: "Reverse this spin in your mind 🧠",
        defaultSubtext: "Focus on the foot: is it clockwise or counter-clockwise?",
        suggestedDurations: [10, 14, 20],
        hasRevealSequence: true,
        revealOverlay: "REVEALING THE TRUTH 🤯",
        revealSubtext: "Watch the depth cues: both directions are mind illusions!"
      });
    }
  }, [onExportReady, drawFrame]);

  const handleFlipPerception = (dir) => {
    setPerceivedDirection(dir);
    setFlipCount(prev => prev + 1);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
      {/* Visual Canvas Card */}
      <div className="flex-1 w-full flex flex-col items-center bg-lab-900 border border-lab-700/60 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Badges */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-4 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-cyan-500/10 text-neon-cyan border border-cyan-500/30 rounded-full text-xs font-mono font-semibold tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> BISTABLE KINETIC ILLUSION
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">Nobuyuki Kayahara</span>
          </div>

          {/* Quick Brain Flip Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFlipPerception('CW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                perceivedDirection === 'CW'
                  ? 'bg-cyan-500 text-lab-950 shadow-lg shadow-cyan-500/30'
                  : 'bg-lab-800 text-slate-300 hover:bg-lab-700 border border-lab-700'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" /> I see Clockwise
            </button>
            <button
              onClick={() => handleFlipPerception('CCW')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                perceivedDirection === 'CCW'
                  ? 'bg-neon-magenta text-white shadow-lg shadow-magenta-500/30'
                  : 'bg-lab-800 text-slate-300 hover:bg-lab-700 border border-lab-700'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" /> I see Counter-CW
            </button>
          </div>
        </div>

        {/* Canvas Display */}
        <div className="relative w-full max-w-[480px] aspect-[4/5] bg-lab-950/80 rounded-xl border border-lab-800 shadow-inner flex items-center justify-center p-2">
          <canvas
            ref={canvasRef}
            width={720}
            height={900}
            className="w-full h-full object-contain rounded-lg"
          />

          {/* Prompt Overlay */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-lab-900/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-cyan-500/30 shadow-lg flex items-center gap-2 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-neon-cyan animate-ping" />
            <span className="text-xs font-semibold text-slate-200">
              Can you reverse the spin in your mind?
            </span>
          </div>

          {/* Flip Counter */}
          {flipCount > 0 && (
            <div className="absolute bottom-4 left-4 bg-lab-900/80 backdrop-blur-md px-3 py-1 rounded-lg border border-lab-700 text-xs font-mono text-slate-300">
              Brain Flips: <span className="text-neon-cyan font-bold">{flipCount}</span>
            </div>
          )}
        </div>

        {/* Quick Tips on Reversing */}
        <div className="w-full mt-4 p-3 bg-lab-850 border border-lab-700/50 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-neon-cyan shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">How to reverse it:</strong> Stare at the bottom pivot foot or shadow. Blink rapidly or tilt your head. Imagine the leg swinging <em>behind</em> instead of <em>in front</em>, and your visual cortex will snap the rotation!
          </p>
        </div>
      </div>

      {/* Interactive Control Panel */}
      <div className="w-full xl:w-96 flex flex-col gap-4">
        {/* Brain Guide / Helper Modes */}
        <div className="bg-lab-900 border border-lab-700/60 rounded-2xl p-5 shadow-xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-neon-cyan" /> Visual Training Cues
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Activate visual cues that guide your visual cortex to perceive a specific rotation direction.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setHelperMode('none')}
              className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                helperMode === 'none'
                  ? 'bg-cyan-500/20 border-cyan-500 text-neon-cyan'
                  : 'bg-lab-800 border-lab-700 text-slate-300 hover:bg-lab-750'
              }`}
            >
              <div className="font-bold mb-0.5">Pure Silhouette</div>
              <div className="text-[10px] text-slate-400">100% Ambiguous (Hard)</div>
            </button>

            <button
              onClick={() => setHelperMode('clockwise')}
              className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                helperMode === 'clockwise'
                  ? 'bg-cyan-500/20 border-cyan-500 text-neon-cyan'
                  : 'bg-lab-800 border-lab-700 text-slate-300 hover:bg-lab-750'
              }`}
            >
              <div className="font-bold mb-0.5 flex items-center gap-1">
                <RotateCw className="w-3 h-3" /> Force Clockwise
              </div>
              <div className="text-[10px] text-slate-400">Cyan depth highlight</div>
            </button>

            <button
              onClick={() => setHelperMode('counter-clockwise')}
              className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                helperMode === 'counter-clockwise'
                  ? 'bg-magenta-500/20 border-neon-magenta text-neon-magenta'
                  : 'bg-lab-800 border-lab-700 text-slate-300 hover:bg-lab-750'
              }`}
            >
              <div className="font-bold mb-0.5 flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> Force Counter-CW
              </div>
              <div className="text-[10px] text-slate-400">Magenta depth highlight</div>
            </button>

            <button
              onClick={() => setHelperMode('wireframe')}
              className={`p-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                helperMode === 'wireframe'
                  ? 'bg-purple-500/20 border-neon-purple text-neon-purple'
                  : 'bg-lab-800 border-lab-700 text-slate-300 hover:bg-lab-750'
              }`}
            >
              <div className="font-bold mb-0.5 flex items-center gap-1">
                <Layers className="w-3 h-3" /> 3D Wireframe
              </div>
              <div className="text-[10px] text-slate-400">Reveals true geometry</div>
            </button>
          </div>
        </div>

        {/* Physics & Appearance Controls */}
        <div className="bg-lab-900 border border-lab-700/60 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-neon-cyan" /> Spin Controls
          </h3>

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

          {/* Tilt slider */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Vertical Camera Tilt</span>
              <span className="text-neon-cyan font-mono">{viewAngle}°</span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="1"
              value={viewAngle}
              onChange={(e) => setViewAngle(parseInt(e.target.value))}
              className="w-full h-1.5 bg-lab-800 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
            />
          </div>

          {/* Color Themes */}
          <div>
            <label className="text-xs text-slate-300 font-medium block mb-2">Silhouette Color</label>
            <div className="flex items-center gap-2">
              {[
                { name: 'Neon Cyan', color: '#00f2fe' },
                { name: 'Pure Onyx', color: '#0f172a' },
                { name: 'Hot Magenta', color: '#ff007f' },
                { name: 'Pure White', color: '#ffffff' },
                { name: 'Solar Amber', color: '#ffb703' }
              ].map(c => (
                <button
                  key={c.name}
                  onClick={() => setSilhouetteColor(c.color)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    silhouetteColor === c.color ? 'border-neon-cyan scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Toggle Shadow */}
          <div className="pt-2 border-t border-lab-800 flex items-center justify-between">
            <span className="text-xs text-slate-300">Ground Contact Shadow</span>
            <button
              onClick={() => setShowShadow(!showShadow)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                showShadow ? 'bg-cyan-500/20 text-neon-cyan border border-cyan-500/40' : 'bg-lab-800 text-slate-400'
              }`}
            >
              {showShadow ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Science Explanation Drawer */}
        <div className="bg-lab-900/80 border border-lab-700/60 rounded-2xl p-4">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-neon-cyan" /> The Neuroscience Behind It
            </span>
            <span>{showExplanation ? '▲ Hide' : '▼ Read'}</span>
          </button>

          {showExplanation && (
            <div className="mt-3 text-xs text-slate-300 space-y-2 border-t border-lab-800 pt-3">
              <p>
                This illusion relies on <strong>orthographic projection</strong>. Because there is no perspective foreshortening (distant parts are not rendered smaller) and zero surface shading, depth is mathematically ambiguous.
              </p>
              <p>
                A coordinate at <code className="text-neon-cyan">+Z</code> (front) and <code className="text-neon-cyan">-Z</code> (back) project to the exact same 2D screen coordinate. Your brain must invent a 3D hypothesis, choosing whether the swinging leg is in front or behind.
              </p>
              <p>
                Once your brain locks onto one hypothesis, it stays until fatigue or a deliberate shift in gaze (like looking at the toe) triggers the bistable perceptual flip!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
