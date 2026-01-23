/**
 * Background Types for 3D Ambient Background System
 */

export type BackgroundMode =
  | 'home'
  | 'record'
  | 'library'
  | 'story'
  | 'profile'
  | 'social'
  | 'tracker'
  | 'books';

export interface BackgroundConfig {
  mode: BackgroundMode;
  particleCount: number;
  particleSpeed: number;
  primaryColor: string;
  secondaryColor: string;
  orbCount: number;
  orbSize: number;
  audioLevel?: number;
  mousePosition?: { x: number; y: number };
  scrollProgress?: number;
  emotionalTone?: string;
}

export interface ParticleConfig {
  count: number;
  size: number;
  speed: number;
  color: string;
  opacity: number;
}

export interface OrbConfig {
  count: number;
  baseSize: number;
  color: string;
  glowIntensity: number;
}

// Default configurations for each page mode
export const modeDefaults: Record<BackgroundMode, Omit<BackgroundConfig, 'mode'>> = {
  home: {
    particleCount: 50,
    particleSpeed: 0.2,
    primaryColor: '#4f7fff', // memory-500
    secondaryColor: '#9f7fff', // insight-500
    orbCount: 2,
    orbSize: 150,
  },
  record: {
    particleCount: 30,
    particleSpeed: 0.15,
    primaryColor: '#4f7fff',
    secondaryColor: '#ff9f4f', // story-500
    orbCount: 1,
    orbSize: 200,
  },
  library: {
    particleCount: 40,
    particleSpeed: 0.1,
    primaryColor: '#4f7fff',
    secondaryColor: '#4f9fff',
    orbCount: 2,
    orbSize: 120,
  },
  story: {
    particleCount: 35,
    particleSpeed: 0.15,
    primaryColor: '#9f7fff',
    secondaryColor: '#ff9f4f',
    orbCount: 1,
    orbSize: 180,
  },
  profile: {
    particleCount: 45,
    particleSpeed: 0.1,
    primaryColor: '#4f7fff',
    secondaryColor: '#4fff9f', // growth-500
    orbCount: 2,
    orbSize: 140,
  },
  social: {
    particleCount: 60,
    particleSpeed: 0.25,
    primaryColor: '#9f7fff',
    secondaryColor: '#4fff9f',
    orbCount: 3,
    orbSize: 100,
  },
  tracker: {
    particleCount: 35,
    particleSpeed: 0.15,
    primaryColor: '#4fff9f',
    secondaryColor: '#4f7fff',
    orbCount: 2,
    orbSize: 130,
  },
  books: {
    particleCount: 40,
    particleSpeed: 0.12,
    primaryColor: '#ff9f4f',
    secondaryColor: '#9f7fff',
    orbCount: 2,
    orbSize: 150,
  },
};

// Emotional tone to color mapping for story pages
export const toneColors: Record<string, string> = {
  reflective: '#4f7fff',
  joyful: '#ffcf4f',
  anxious: '#ff4f4f',
  hopeful: '#4fffa0',
  melancholic: '#9f7fff',
  grateful: '#ff7faf',
  frustrated: '#ff6f4f',
  peaceful: '#4fdfdf',
  excited: '#ff9f4f',
  uncertain: '#7f9faf',
  neutral: '#7f8f9f',
};
