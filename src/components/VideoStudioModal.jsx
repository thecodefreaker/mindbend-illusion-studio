import React, { useState, useEffect } from 'react';
import { 
  Video, Download, Play, CheckCircle, AlertCircle, X, Sparkles, 
  Volume2, VolumeX, Smartphone, Square, Monitor, RotateCcw,
  Zap, Flame, ShieldAlert, Sliders
} from 'lucide-react';
import { videoRecorder } from '../utils/videoRecorder';

export const VideoStudioModal = ({ isOpen, onClose, currentIllusion }) => {
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [duration, setDuration] = useState(20); // 20s minimum
  const [fps, setFps] = useState(60);
  const [includeAudio, setIncludeAudio] = useState(true);
  
  // Phase 1: Hook Captions
  const [hookOverlayText, setHookOverlayText] = useState(currentIllusion?.defaultOverlay || "Reverse this spin in your mind 🧠");
  const [hookSubText, setHookSubText] = useState(currentIllusion?.defaultSubtext || "Which way is it turning? Comment below! 👇");
  
  // Phase 2: Truth Reveal Sequence (Viral Instagram Reel Formula)
  const [enableTruthReveal, setEnableTruthReveal] = useState(currentIllusion?.hasRevealSequence ?? true);
  const [revealTimeRatio, setRevealTimeRatio] = useState(0.75); // Default 75% for suspense (reveal in last 25%)
  const [revealOverlayText, setRevealOverlayText] = useState(currentIllusion?.revealOverlay || "REVEALING THE TRUTH 🤯");
  const [revealSubText, setRevealSubText] = useState(currentIllusion?.revealSubtext || "Notice the visual cues: both directions are mind tricks!");

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isRevealPhaseActive, setIsRevealPhaseActive] = useState(false);
  const [completedVideo, setCompletedVideo] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Sync default texts when currentIllusion changes
  useEffect(() => {
    if (currentIllusion) {
      setHookOverlayText(currentIllusion.defaultOverlay || "Reverse this spin in your mind 🧠");
      setHookSubText(currentIllusion.defaultSubtext || "Which way is it turning? Comment below! 👇");
      setEnableTruthReveal(currentIllusion.hasRevealSequence ?? true);
      setRevealOverlayText(currentIllusion.revealOverlay || "REVEALING THE TRUTH 🤯");
      setRevealSubText(currentIllusion.revealSubtext || "Watch the visual cues: both directions are mind tricks!");
      setCompletedVideo(null);
      setErrorMessage(null);
    }
  }, [currentIllusion]);

  if (!isOpen || !currentIllusion) return null;

  const handleStartRecording = () => {
    setIsRecording(true);
    setProgress(0);
    setElapsedSec(0);
    setIsRevealPhaseActive(false);
    setCompletedVideo(null);
    setErrorMessage(null);

    videoRecorder.recordIllusion({
      drawFrame: currentIllusion.drawFrame,
      aspectRatio,
      duration,
      fps,
      includeAudio,
      overlayText: hookOverlayText,
      subText: hookSubText,
      enableTruthReveal,
      revealTimeRatio,
      revealOverlayText,
      revealSubText,
      onProgress: (p) => {
        setProgress(p.percent);
        setElapsedSec(p.elapsedSec);
        setIsRevealPhaseActive(p.isRevealPhase);
      },
      onComplete: (result) => {
        setIsRecording(false);
        setCompletedVideo(result);
      },
      onError: (err) => {
        setIsRecording(false);
        setErrorMessage(err.message || "Failed to record video");
      }
    });
  };

  const handleCancel = () => {
    videoRecorder.cancelRecording();
    setIsRecording(false);
  };

  const handleDownload = () => {
    if (!completedVideo) return;
    const a = document.createElement('a');
    a.href = completedVideo.videoUrl;
    a.download = completedVideo.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-lab-900 border border-lab-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-lab-800 flex items-center justify-between bg-lab-850">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-neon-purple to-neon-cyan flex items-center justify-center text-lab-950 font-bold shadow-lg shadow-cyan-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Instagram Reels & Short Video Studio
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-neon-cyan font-mono font-normal">
                  {currentIllusion.name}
                </span>
              </h2>
              <p className="text-xs text-slate-400">9:16 vertical MP4 with Hook & Truth Reveal storyboard</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isRecording) handleCancel();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-lab-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Completed State: Preview & Download */}
          {completedVideo ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-neon-lime/20 border border-neon-lime/40 text-neon-lime flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Reel Rendered & Ready for Instagram!</h3>
              <p className="text-xs text-slate-400">
                Directly uploadable to Instagram Reels, TikTok & Shorts • Format: <strong className="text-neon-cyan">{completedVideo.format}</strong> ({completedVideo.sizeMB} MB)
              </p>

              {/* Video Player */}
              <div className="relative mx-auto rounded-xl overflow-hidden border border-lab-700 bg-black max-w-xs shadow-2xl">
                <video
                  src={completedVideo.videoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-auto max-h-[350px] object-contain"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-neon-cyan to-blue-500 text-lab-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/30 hover:brightness-110 transition-all"
                >
                  <Download className="w-4 h-4" /> Download {completedVideo.filename} ({completedVideo.sizeMB} MB)
                </button>
                <button
                  onClick={() => setCompletedVideo(null)}
                  className="px-4 py-3 rounded-xl bg-lab-800 text-slate-300 hover:bg-lab-750 font-medium text-sm flex items-center gap-2 border border-lab-700 transition-all"
                >
                  <RotateCcw className="w-4 h-4" /> Record Another Variation
                </button>
              </div>
            </div>
          ) : isRecording ? (
            /* Recording Progress State */
            <div className="py-10 text-center space-y-5">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-lab-800" />
                <div
                  className={`absolute inset-0 rounded-full border-4 border-t-transparent animate-spin ${
                    isRevealPhaseActive ? 'border-amber-400' : 'border-neon-cyan'
                  }`}
                />
                <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-lg text-white">
                  {progress}%
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-white flex items-center justify-center gap-2">
                  {isRevealPhaseActive ? (
                    <span className="text-neon-amber flex items-center gap-1.5">
                      <Zap className="w-4 h-4" /> Phase 2: Recording TRUTH REVEAL...
                    </span>
                  ) : (
                    <span className="text-neon-cyan flex items-center gap-1.5">
                      <Flame className="w-4 h-4" /> Phase 1: Recording MIND TRICK HOOK...
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  60 FPS • {elapsedSec}s / {duration}s • Instagram Safe Zones Applied
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-lab-800 h-2.5 rounded-full overflow-hidden max-w-md mx-auto">
                <div
                  className={`h-full transition-all duration-300 ${
                    isRevealPhaseActive
                      ? 'bg-gradient-to-r from-neon-amber to-red-500'
                      : 'bg-gradient-to-r from-neon-cyan to-neon-purple'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-semibold hover:bg-red-500/20 transition-all"
              >
                Cancel Recording
              </button>
            </div>
          ) : (
            /* Studio Settings Form */
            <div className="space-y-4">
              {/* Aspect Ratio Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  Format & Aspect Ratio (Instagram Safe Zones)
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: '9:16', label: '9:16 Vertical', desc: '1080×1920 Full HD Reels & TikTok', icon: Smartphone, recommended: true },
                    { id: '1:1', label: '1:1 Square', desc: '1080×1080 HD Feed & Twitter', icon: Square },
                    { id: '16:9', label: '16:9 Wide', desc: '1920×1080 Full HD YouTube', icon: Monitor },
                  ].map(f => {
                    const Icon = f.icon;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setAspectRatio(f.id)}
                        className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                          aspectRatio === f.id
                            ? 'bg-cyan-500/15 border-neon-cyan text-white shadow-lg shadow-cyan-500/10'
                            : 'bg-lab-800/80 border-lab-700 text-slate-400 hover:bg-lab-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                            <Icon className="w-3.5 h-3.5 text-neon-cyan" /> {f.label}
                          </div>
                          {f.recommended && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-neon-cyan">
                              Best for Reels
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{f.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Two-Stage Reel Storyboard: Hook vs Truth Reveal */}
              <div className="border border-lab-750 bg-lab-850/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-neon-amber" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Reels Storyboard (Hook + Truth Reveal)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableTruthReveal(!enableTruthReveal)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono transition-all ${
                      enableTruthReveal
                        ? 'bg-neon-amber/20 text-neon-amber border border-neon-amber/40'
                        : 'bg-lab-800 text-slate-400'
                    }`}
                  >
                    {enableTruthReveal ? 'REVEAL MODE: ON' : 'SINGLE HOOK ONLY'}
                  </button>
                </div>

                {/* Phase 1: The Hook */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-neon-cyan font-semibold block">
                      STAGE 1 (0.0s – {(duration * revealTimeRatio).toFixed(1)}s) — Mind Trick Hook:
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Suspense Build-up: {Math.round(revealTimeRatio * 100)}%
                    </span>
                  </div>
                  <input
                    type="text"
                    value={hookOverlayText}
                    onChange={(e) => setHookOverlayText(e.target.value)}
                    placeholder="e.g. Reverse this spin in your mind 🧠"
                    className="w-full px-3.5 py-2 rounded-xl bg-lab-800 border border-lab-700 text-xs text-white focus:outline-none focus:border-neon-cyan placeholder:text-slate-500"
                  />
                  <input
                    type="text"
                    value={hookSubText}
                    onChange={(e) => setHookSubText(e.target.value)}
                    placeholder="e.g. Which way is it turning? Comment below! 👇"
                    className="w-full px-3.5 py-1.5 rounded-xl bg-lab-800/80 border border-lab-700 text-[11px] text-slate-300 focus:outline-none focus:border-neon-cyan"
                  />
                </div>

                {/* Phase 2: The Truth Reveal */}
                {enableTruthReveal && (
                  <div className="space-y-2 pt-2 border-t border-lab-750">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-neon-amber font-semibold block">
                        STAGE 2 ({(duration * revealTimeRatio).toFixed(1)}s – {duration}s) — Truth Reveal:
                      </span>
                      <span className="text-[10px] font-mono text-amber-400">
                        Reveal Duration: {(duration * (1 - revealTimeRatio)).toFixed(1)}s
                      </span>
                    </div>
                    <input
                      type="text"
                      value={revealOverlayText}
                      onChange={(e) => setRevealOverlayText(e.target.value)}
                      placeholder="e.g. REVEALING THE TRUTH 🤯"
                      className="w-full px-3.5 py-2 rounded-xl bg-lab-800 border border-amber-500/40 text-xs text-neon-amber font-bold focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
                    />
                    <input
                      type="text"
                      value={revealSubText}
                      onChange={(e) => setRevealSubText(e.target.value)}
                      placeholder="e.g. Watch the visual cues: both directions are mind tricks!"
                      className="w-full px-3.5 py-1.5 rounded-xl bg-lab-800/80 border border-lab-700 text-[11px] text-slate-300 focus:outline-none focus:border-neon-amber"
                    />

                    {/* Reveal Timing Selector (High Retention Optimization) */}
                    <div className="pt-1.5">
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="text-slate-300 font-medium flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-neon-amber" />
                          Reveal Timing (Viral Retention):
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Illusion runs until <strong className="text-white">{(duration * revealTimeRatio).toFixed(1)}s</strong>
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { ratio: 0.80, label: 'Last 20%', desc: 'Max Suspense (Viral)', badge: 'Recommended' },
                          { ratio: 0.75, label: 'Last 25%', desc: 'Standard Climax', badge: 'Default' },
                          { ratio: 0.50, label: 'Halfway', desc: '50/50 Split', badge: 'Classic' }
                        ].map(item => (
                          <button
                            key={item.ratio}
                            type="button"
                            onClick={() => setRevealTimeRatio(item.ratio)}
                            className={`p-2 rounded-lg border text-left transition-all ${
                              revealTimeRatio === item.ratio
                                ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/10'
                                : 'bg-lab-800 border-lab-700 text-slate-400 hover:bg-lab-750'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">{item.label}</span>
                              <span className={`text-[8px] font-mono px-1 py-0.5 rounded ${
                                revealTimeRatio === item.ratio ? 'bg-amber-400 text-lab-950 font-bold' : 'bg-lab-900 text-slate-400'
                              }`}>
                                {item.badge}
                              </span>
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5">{item.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Length & Hypnotic Audio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Duration */}
                <div className="p-3 bg-lab-850 border border-lab-750 rounded-xl">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">
                      Reel Duration <span className="text-[10px] text-amber-400 font-normal">(Min 20s)</span>
                    </span>
                    <span className="text-neon-cyan font-mono font-bold">{duration}s</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[20, 25, 30, 45].map(sec => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setDuration(sec)}
                        className={`flex-1 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                          duration === sec ? 'bg-neon-cyan text-lab-950 font-bold' : 'bg-lab-800 text-slate-400 hover:bg-lab-750'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hypnotic Audio */}
                <div className="p-3 bg-lab-850 border border-lab-750 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                      {includeAudio ? <Volume2 className="w-3.5 h-3.5 text-neon-purple" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                      Hypnotic Drone Audio
                    </div>
                    <div className="text-[10px] text-slate-400">432Hz embedded binaural frequency</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIncludeAudio(!includeAudio)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      includeAudio ? 'bg-purple-500/20 text-neon-purple border border-purple-500/40' : 'bg-lab-800 text-slate-400'
                    }`}
                  >
                    {includeAudio ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!completedVideo && !isRecording && (
          <div className="p-4 border-t border-lab-800 bg-lab-850 flex items-center justify-between">
            <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Exports: 9:16 MP4 • 60 FPS • Reels Safe Zones
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartRecording}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-cyan via-blue-500 to-neon-purple text-lab-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-95 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Generate {duration}s Instagram Reel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
