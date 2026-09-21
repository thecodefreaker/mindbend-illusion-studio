import React, { useState, useMemo } from 'react';
import { 
  Sparkles, Video, Volume2, VolumeX, Eye, Share2, 
  RotateCw, Layers, Sliders, Smartphone, Square, Monitor, 
  Download, HelpCircle, Instagram, Search, Compass, Flame, ArrowRight
} from 'lucide-react';

import { 
  ILLUSIONS_REGISTRY, 
  ILLUSION_CATEGORIES, 
  getIllusionById 
} from './illusions/registry';
import { IllusionCatalogModal } from './components/IllusionCatalogModal';
import { VideoStudioModal } from './components/VideoStudioModal';
import { AdminPanel } from './components/AdminPanel';
import { audioSynth } from './utils/audioSynthesizer';

export default function App() {
  const [activeTab, setActiveTab] = useState('dancer');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [currentExportData, setCurrentExportData] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.15);

  const toggleLiveAudio = () => {
    if (isAudioPlaying) {
      audioSynth.stop();
      setIsAudioPlaying(false);
    } else {
      audioSynth.startHypnoticDrone();
      audioSynth.setVolume(audioVolume);
      setIsAudioPlaying(true);
    }
  };

  const handleVolumeChange = (newVol) => {
    setAudioVolume(newVol);
    audioSynth.setVolume(newVol);
  };

  // Filter illusions in the top horizontal tab bar by selected category
  const filteredTabs = useMemo(() => {
    if (selectedCategory === 'all') return ILLUSIONS_REGISTRY;
    return ILLUSIONS_REGISTRY.filter(i => i.category === selectedCategory);
  }, [selectedCategory]);

  // Active illusion definition and component from registry
  const currentIllusion = useMemo(() => {
    return getIllusionById(activeTab);
  }, [activeTab]);

  const ActiveComponent = currentIllusion.component;

  return (
    <div className="min-h-screen bg-lab-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Ambient Glow Line */}
      <div className="h-1 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-magenta w-full" />

      {/* Navigation Header */}
      <header className="border-b border-lab-800 bg-lab-900/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-neon-purple p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-lab-950 rounded-[10px] flex items-center justify-center">
                <span className="text-xl">🌀</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-wider uppercase text-white">
                  MIND<span className="text-neon-cyan text-glow">BEND</span>
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-neon-cyan font-mono border border-cyan-500/30 font-semibold">
                  PRO STUDIO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                1080p Optical Illusions & Reels Engine ({ILLUSIONS_REGISTRY.length} Modular Illusions)
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Hypnotic Binaural Drone Audio Toggle */}
            <div className="flex items-center bg-lab-850 border border-lab-700/80 rounded-xl px-2.5 py-1.5 gap-2">
              <button
                onClick={toggleLiveAudio}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                title={isAudioPlaying ? 'Mute Ambient Drone' : 'Listen to 432Hz Hypnotic Sound'}
              >
                {isAudioPlaying ? (
                  <Volume2 className="w-4 h-4 text-neon-purple animate-pulse" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                <span className="hidden md:inline font-mono">
                  {isAudioPlaying ? 'Sound ON' : 'Ambient'}
                </span>
              </button>

              {isAudioPlaying && (
                <input
                  type="range"
                  min="0"
                  max="0.4"
                  step="0.02"
                  value={audioVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-lab-700 rounded-lg appearance-none cursor-pointer accent-neon-purple hidden md:block"
                />
              )}
            </div>

            {/* Browse Master Library Button */}
            <button
              onClick={() => setIsCatalogOpen(true)}
              className="px-3 py-2 rounded-xl bg-lab-800 hover:bg-lab-750 border border-lab-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
              title="Browse All Illusions"
            >
              <Compass className="w-4 h-4 text-neon-cyan" />
              <span className="hidden sm:inline">Library</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-neon-cyan font-mono">
                {ILLUSIONS_REGISTRY.length}
              </span>
            </button>

            {/* Instagram Automation / Admin Button */}
            <button
              onClick={() => setIsAdminOpen(true)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600/80 to-pink-600/80 border border-pink-500/40 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-pink-500/15 hover:brightness-110 active:scale-95 transition-all"
            >
              <Instagram className="w-4 h-4 text-pink-300" />
              <span className="hidden sm:inline">Auto-Post</span>
            </button>

            {/* Video Export Studio Launch Button */}
            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-neon-cyan via-blue-500 to-neon-purple text-lab-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/30 hover:brightness-110 active:scale-95 transition-all"
            >
              <Video className="w-4 h-4 text-lab-950" />
              <span>Create Reel</span>
            </button>
          </div>
        </div>

        {/* Categories & Illusion Selector Subheader */}
        <div className="border-t border-lab-800/80 bg-lab-900/95">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              {ILLUSION_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-lab-800 text-white border border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                      : 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-lab-850 border border-transparent'
                  }`}
                >
                  <span className="text-xs">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Search / Open Catalog Shortcut */}
            <button
              onClick={() => setIsCatalogOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-lab-850 hover:bg-lab-800 border border-lab-750 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1.5 shrink-0 self-end md:self-auto"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search Library...</span>
            </button>
          </div>

          {/* Illusion Carousel Tabs */}
          <div className="border-t border-lab-850/80 overflow-x-auto scrollbar-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2 py-2">
              {filteredTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all shrink-0 ${
                      isActive
                        ? 'bg-lab-800 text-white border border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                        : 'bg-lab-900/60 text-slate-400 hover:text-slate-200 hover:bg-lab-850 border border-lab-800'
                    }`}
                  >
                    <span className="text-base">{tab.icon}</span>
                    <div className="text-left">
                      <div className={`leading-tight ${isActive ? 'text-neon-cyan font-bold' : ''}`}>
                        {tab.name}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono font-normal">
                        {tab.tag}
                      </div>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan shadow-sm shadow-cyan-500 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Dynamic Active Illusion Canvas & Controls */}
        <section>
          {ActiveComponent && (
            <ActiveComponent onExportReady={setCurrentExportData} />
          )}
        </section>

        {/* Video Creation Quick Action Banner */}
        <section className="bg-gradient-to-r from-lab-900 via-lab-850 to-lab-900 border border-lab-700/80 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan flex items-center justify-center shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Export 1080×1920 Full HD Reel with Truth Reveal
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-neon-cyan font-mono font-normal">
                  60 FPS • High Bitrate
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Engineered with <strong>Stage 1: Ambiguity Hook</strong> (0–75%) and <strong>Stage 2: Truth Reveal</strong> (75–100%) for maximum algorithmic watch completion.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsVideoModalOpen(true)}
            className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-cyan via-blue-500 to-neon-purple text-lab-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all shrink-0"
          >
            <Video className="w-4 h-4 text-lab-950" />
            <span>Launch Video Studio</span>
          </button>
        </section>

        {/* Modular Illusion Discovery Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-neon-cyan" />
                Featured Optical Illusion Library
              </h2>
              <p className="text-xs text-slate-400">
                Click any illusion to load on stage or launch instant video render
              </p>
            </div>
            <button
              onClick={() => setIsCatalogOpen(true)}
              className="text-xs text-neon-cyan hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View All ({ILLUSIONS_REGISTRY.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {ILLUSIONS_REGISTRY.slice(0, 8).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`p-4 rounded-2xl border text-left transition-all group flex flex-col justify-between ${
                  activeTab === item.id
                    ? 'bg-lab-800/90 border-neon-cyan shadow-xl shadow-cyan-500/10'
                    : 'bg-lab-900 border-lab-750 hover:bg-lab-850 hover:border-lab-650'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-lab-800 text-slate-400 border border-lab-700">
                      {item.categoryName}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-neon-cyan transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-lab-800 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-neon-amber flex items-center gap-1">
                    <Flame className="w-3 h-3" /> {item.viralScore}%
                  </span>
                  <span className="text-neon-cyan font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    {activeTab === item.id ? 'Active' : 'Test Illusion'} →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-lab-850 mt-12 py-6 bg-lab-950/80 text-slate-500 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold tracking-wider">MINDBEND STUDIO</span>
            <span>•</span>
            <span>Modular Optical Neuroscience & 1080p Video Generator</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>{ILLUSIONS_REGISTRY.length} Modular Plugins</span>
            <span>•</span>
            <span>1080×1920 Full HD</span>
            <span>•</span>
            <span>GPU Accelerated</span>
          </div>
        </div>
      </footer>

      {/* Master Illusion Catalog Modal */}
      <IllusionCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        activeIllusionId={activeTab}
        onSelectIllusion={(id) => {
          setActiveTab(id);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onCreateReel={() => setIsVideoModalOpen(true)}
      />

      {/* Video Studio Modal */}
      <VideoStudioModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        currentIllusion={currentExportData}
      />

      {/* Instagram Automation & Admin Panel Modal */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
}
