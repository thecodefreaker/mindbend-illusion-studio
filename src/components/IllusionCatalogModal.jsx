import React, { useState } from 'react';
import { 
  Search, X, Sparkles, Video, Flame, Check, 
  Layers, ArrowRight, Filter, Zap, Compass 
} from 'lucide-react';
import { 
  ILLUSION_CATEGORIES, 
  filterIllusions 
} from '../illusions/registry';

export const IllusionCatalogModal = ({ 
  isOpen, 
  onClose, 
  activeIllusionId, 
  onSelectIllusion,
  onCreateReel
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filtered = filterIllusions({
    category: selectedCategory,
    searchQuery
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-5xl bg-lab-900 border border-lab-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-lab-800 flex items-center justify-between bg-lab-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-neon-purple to-neon-cyan flex items-center justify-center text-lab-950 font-bold shadow-lg shadow-cyan-500/20">
              <Compass className="w-5 h-5 text-lab-950" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Optical Illusion Master Library
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-neon-cyan font-mono font-normal">
                  {filtered.length} Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Modular collection engineered for maximum visual retention & 1080p Instagram Reels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-lab-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-lab-800/80 bg-lab-900/90 flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none py-0.5">
            {ILLUSION_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-neon-cyan text-lab-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-lab-800 text-slate-400 hover:text-slate-200 hover:bg-lab-750'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search illusions or brain tricks..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-lab-800 border border-lab-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-neon-cyan"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Illusions Grid */}
        <div className="p-5 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400">
              <Compass className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-medium">No illusions match your search criteria.</p>
              <button
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                className="mt-3 px-3 py-1.5 rounded-lg bg-lab-800 text-neon-cyan text-xs font-medium border border-lab-700"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filtered.map(item => {
              const isCurrent = activeIllusionId === item.id;
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between transition-all group ${
                    isCurrent
                      ? 'bg-lab-800/90 border-neon-cyan shadow-xl shadow-cyan-500/10'
                      : 'bg-lab-850/80 border-lab-750 hover:border-lab-650 hover:bg-lab-800/70'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Card Top */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl p-2 rounded-xl bg-lab-800 border border-lab-700/80 shrink-0">
                          {item.icon}
                        </span>
                        <div>
                          <h3 className="font-bold text-sm text-white flex items-center gap-1.5 group-hover:text-neon-cyan transition-colors">
                            {item.name}
                            {isCurrent && (
                              <span className="w-2 h-2 rounded-full bg-neon-cyan" />
                            )}
                          </h3>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            {item.categoryName}
                          </span>
                        </div>
                      </div>

                      {/* Viral Score Pill */}
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-neon-amber text-[10px] font-mono font-bold flex items-center gap-1 border border-amber-500/30">
                        <Flame className="w-3 h-3" /> {item.viralScore}%
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {item.desc}
                    </p>

                    {/* Tags / Features */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-lab-800 text-slate-300 border border-lab-700">
                        {item.tag}
                      </span>
                      {item.hasRevealSequence && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-neon-purple border border-purple-500/30">
                          ⚡ Truth Reveal
                        </span>
                      )}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-neon-cyan">
                        {item.defaultDuration}s Reel
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-4 mt-3 border-t border-lab-750 flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectIllusion(item.id);
                        onClose();
                      }}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        isCurrent
                          ? 'bg-lab-750 text-white border border-lab-650'
                          : 'bg-lab-800 text-slate-200 hover:bg-lab-750 hover:text-white border border-lab-700'
                      }`}
                    >
                      <span>{isCurrent ? 'Active On Stage' : 'Load Illusion'}</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectIllusion(item.id);
                        onClose();
                        onCreateReel();
                      }}
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-neon-cyan to-blue-500 text-lab-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all"
                      title="Quick Create Reel"
                    >
                      <Video className="w-3.5 h-3.5 text-lab-950" />
                      <span>Reel</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
