// Modular Illusion Registry System
// Provides an extensible plugin architecture to effortlessly support 10, 50, or 100+ optical illusions.

import { SpinningDancer } from './SpinningDancer';
import { AmbiguousHelix } from './AmbiguousHelix';
import { HypnoticSpiral } from './HypnoticSpiral';
import { SteppingFeet } from './SteppingFeet';
import { NeckerCube } from './NeckerCube';
import { LilacChaser } from './LilacChaser';
import { CafeWall } from './CafeWall';
import { HermannGrid } from './HermannGrid';
import { KanizsaTriangle } from './KanizsaTriangle';
import { MunkerWhite } from './MunkerWhite';

export const ILLUSION_CATEGORIES = [
  { id: 'all', name: 'All Illusions', icon: '✨' },
  { id: 'bistable', name: 'Bistable & 3D Depth', icon: '🧠' },
  { id: 'motion', name: 'Motion & Speed', icon: '⚡' },
  { id: 'geometric', name: 'Geometric & Angles', icon: '📐' },
  { id: 'fading', name: 'Retinal & Fading', icon: '🌸' },
  { id: 'contrast', name: 'Color & Contours', icon: '🎨' },
];

export const ILLUSIONS_REGISTRY = [
  {
    id: 'dancer',
    name: 'Spinning Silhouette',
    tag: 'Reverse The Spin',
    category: 'bistable',
    categoryName: 'Bistable Kinetic',
    icon: '💃',
    desc: 'Can you reverse the spin direction in your mind? 95% cannot.',
    viralScore: 99,
    difficulty: 'Medium',
    defaultDuration: 12,
    hasRevealSequence: true,
    defaultOverlay: 'Reverse this spin in your mind 🧠',
    defaultSubtext: 'Which way is it turning? Comment below! 👇',
    revealOverlay: 'REVEALING THE TRUTH 🤯',
    revealSubtext: 'Watch the visual cues: both directions are mind tricks!',
    component: SpinningDancer
  },
  {
    id: 'helix',
    name: 'Ambiguous Helix',
    tag: 'Unknown Direction',
    category: 'bistable',
    categoryName: 'Bistable Depth',
    icon: '🧬',
    desc: 'Cannot tell which way it rotates; reverses purely in your mind.',
    viralScore: 96,
    difficulty: 'Hard',
    defaultDuration: 12,
    hasRevealSequence: true,
    defaultOverlay: 'Which way is this helix spinning? 🧬',
    defaultSubtext: 'Left or Right? Snap the direction in your head! 👇',
    revealOverlay: 'REVEALING THE TRUTH 🤯',
    revealSubtext: 'It rotates both ways simultaneously!',
    component: AmbiguousHelix
  },
  {
    id: 'feet',
    name: 'Stepping Feet',
    tag: 'Speed & Contrast',
    category: 'motion',
    categoryName: 'Edge Detection',
    icon: '👟',
    desc: 'Two blocks moving at equal speed look like walking feet.',
    viralScore: 97,
    difficulty: 'Easy',
    defaultDuration: 10,
    hasRevealSequence: true,
    defaultOverlay: 'Do these blocks move at the same speed? 🏎️',
    defaultSubtext: 'Watch closely: do they look like they are stepping?',
    revealOverlay: 'REMOVING THE STRIPES... 🤯',
    revealSubtext: 'They move at the exact same constant speed side-by-side!',
    component: SteppingFeet
  },
  {
    id: 'cafe',
    name: 'Café Wall',
    tag: 'Parallel Tilt',
    category: 'geometric',
    categoryName: 'Border Locking',
    icon: '🧱',
    desc: '100% straight and parallel lines appear wildly tilted.',
    viralScore: 95,
    difficulty: 'Easy',
    defaultDuration: 10,
    hasRevealSequence: true,
    defaultOverlay: 'Are these horizontal lines parallel? 📐',
    defaultSubtext: 'Every row looks tilted, but are they? Comment below! 👇',
    revealOverlay: 'LASER RULER REVEAL 📐',
    revealSubtext: 'Every single line is 100% horizontal and straight!',
    component: CafeWall
  },
  {
    id: 'hermann',
    name: 'Hermann Ghost Grid',
    tag: 'Ghost Dots',
    category: 'contrast',
    categoryName: 'Lateral Inhibition',
    icon: '👁️',
    desc: 'Ghost-like dark dots flash at white intersections in peripheral vision.',
    viralScore: 98,
    difficulty: 'Medium',
    defaultDuration: 10,
    hasRevealSequence: true,
    defaultOverlay: 'Count the black dots in this grid 👁️',
    defaultSubtext: 'Notice how they vanish when you look directly at them! 👇',
    revealOverlay: 'REVEALING THE TRUTH 🤯',
    revealSubtext: 'There are ZERO black dots! Your retinal ganglion cells invented them.',
    component: HermannGrid
  },
  {
    id: 'kanizsa',
    name: 'Kanizsa Ghost Triangle',
    tag: 'Illusory Contours',
    category: 'contrast',
    categoryName: 'Gestalt Completion',
    icon: '🔺',
    desc: 'A bright white triangle hovers in front with crisp edges where none exist.',
    viralScore: 94,
    difficulty: 'Medium',
    defaultDuration: 10,
    hasRevealSequence: true,
    defaultOverlay: 'Do you see the white triangle in front? 👁️',
    defaultSubtext: 'Look closely at the borders: does it look brighter?',
    revealOverlay: 'REVEALING THE TRUTH 🤯',
    revealSubtext: 'There is NO triangle! Your visual cortex fabricated the edges.',
    component: KanizsaTriangle
  },
  {
    id: 'munker',
    name: 'Munker Color Shift',
    tag: 'Color Illusion',
    category: 'contrast',
    categoryName: 'Color Assimilation',
    icon: '🎨',
    desc: 'Identical color bars look dark green vs neon cyan due to surrounding stripes.',
    viralScore: 97,
    difficulty: 'Hard',
    defaultDuration: 10,
    hasRevealSequence: true,
    defaultOverlay: 'Which color is brighter: Left or Right? 🎨',
    defaultSubtext: 'Left looks dark green, right looks neon cyan! 👇',
    revealOverlay: 'REVEALING THE TRUTH 🤯',
    revealSubtext: 'Both sides are the EXACT same color! The stripes tricked your brain.',
    component: MunkerWhite
  },
  {
    id: 'spiral',
    name: 'Hypnotic Vortex',
    tag: 'Motion Aftereffect',
    category: 'fading',
    categoryName: 'Waterfall Illusion',
    icon: '🌀',
    desc: 'Stare for 15s to make the real world melt, breathe and expand.',
    viralScore: 98,
    difficulty: 'Easy',
    defaultDuration: 16,
    hasRevealSequence: false,
    defaultOverlay: 'Stare at the red dot for 15 seconds 🌀',
    defaultSubtext: 'Then look at the palm of your hand: it will melt & breathe!',
    revealOverlay: 'LOOK AT YOUR HAND NOW! 🤯',
    revealSubtext: 'Your brain motion detectors were fatigued.',
    component: HypnoticSpiral
  },
  {
    id: 'lilac',
    name: 'Lilac Chaser',
    tag: 'Pac-Man & Fading',
    category: 'fading',
    categoryName: "Troxler's Fading",
    icon: '🌸',
    desc: 'Stare at the central cross: purple dots vanish, running green dot appears.',
    viralScore: 93,
    difficulty: 'Medium',
    defaultDuration: 12,
    hasRevealSequence: false,
    defaultOverlay: 'Stare at the black cross in the center 🌸',
    defaultSubtext: 'Watch the purple dots completely disappear into gray!',
    revealOverlay: 'DID THE DOTS DISAPPEAR? 🤯',
    revealSubtext: "Troxler's fading causes constant retinal signals to shut off.",
    component: LilacChaser
  },
  {
    id: 'cube',
    name: 'Necker Cube 3D',
    tag: 'Depth Bistability',
    category: 'bistable',
    categoryName: 'Orthographic Flip',
    icon: '🧊',
    desc: 'Orthographic 3D wireframe cube that spontaneously flips inside-out.',
    viralScore: 91,
    difficulty: 'Hard',
    defaultDuration: 10,
    hasRevealSequence: false,
    defaultOverlay: 'Which face of the cube is in front? 🧊',
    defaultSubtext: 'Can you force your brain to flip it inside-out?',
    revealOverlay: 'DEPTH BISTABILITY 🤯',
    revealSubtext: 'With no perspective cues, both interpretations are equally valid.',
    component: NeckerCube
  }
];

// Helper Functions for Dynamic UI & Scheduler
export const getAllIllusions = () => ILLUSIONS_REGISTRY;

export const getIllusionById = (id) => {
  return ILLUSIONS_REGISTRY.find(i => i.id === id) || ILLUSIONS_REGISTRY[0];
};

export const getCategories = () => ILLUSION_CATEGORIES;

export const filterIllusions = ({ category = 'all', searchQuery = '' } = {}) => {
  const query = searchQuery.trim().toLowerCase();
  return ILLUSIONS_REGISTRY.filter(item => {
    const matchesCategory = category === 'all' || item.category === category;
    const matchesQuery = !query || 
      item.name.toLowerCase().includes(query) ||
      item.tag.toLowerCase().includes(query) ||
      item.desc.toLowerCase().includes(query) ||
      item.categoryName.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });
};

// Dynamic Registry Extender (allows users or scripts to register new illusions at runtime)
export const registerIllusion = (newIllusion) => {
  if (!newIllusion || !newIllusion.id) {
    throw new Error("Illusion must have a unique ID.");
  }
  const existingIdx = ILLUSIONS_REGISTRY.findIndex(i => i.id === newIllusion.id);
  if (existingIdx >= 0) {
    ILLUSIONS_REGISTRY[existingIdx] = { ...ILLUSIONS_REGISTRY[existingIdx], ...newIllusion };
  } else {
    ILLUSIONS_REGISTRY.push(newIllusion);
  }
  return ILLUSIONS_REGISTRY;
};
