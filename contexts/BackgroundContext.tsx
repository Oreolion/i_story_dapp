'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { BackgroundMode, BackgroundConfig, modeDefaults, toneColors } from '@/types/background';

interface BackgroundContextValue {
  config: BackgroundConfig;
  mode: BackgroundMode;
  setMode: (mode: BackgroundMode) => void;
  setAudioLevel: (level: number) => void;
  setMousePosition: (position: { x: number; y: number }) => void;
  setScrollProgress: (progress: number) => void;
  setEmotionalTone: (tone: string) => void;
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
}

const BackgroundContext = createContext<BackgroundContextValue | null>(null);

interface BackgroundProviderProps {
  children: React.ReactNode;
  defaultMode?: BackgroundMode;
}

export function BackgroundProvider({ children, defaultMode = 'home' }: BackgroundProviderProps) {
  const [mode, setModeState] = useState<BackgroundMode>(defaultMode);
  const [audioLevel, setAudioLevel] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [emotionalTone, setEmotionalTone] = useState<string>('');
  const [isEnabled, setIsEnabled] = useState(true);

  const setMode = useCallback((newMode: BackgroundMode) => {
    setModeState(newMode);
  }, []);

  // Build the full config from mode defaults and dynamic values
  const config = useMemo<BackgroundConfig>(() => {
    const defaults = modeDefaults[mode];

    // If we have an emotional tone and we're on story page, adjust colors
    let primaryColor = defaults.primaryColor;
    let secondaryColor = defaults.secondaryColor;

    if (emotionalTone && toneColors[emotionalTone]) {
      primaryColor = toneColors[emotionalTone];
    }

    return {
      mode,
      ...defaults,
      primaryColor,
      secondaryColor,
      audioLevel,
      mousePosition,
      scrollProgress,
      emotionalTone,
    };
  }, [mode, audioLevel, mousePosition, scrollProgress, emotionalTone]);

  const value = useMemo<BackgroundContextValue>(() => ({
    config,
    mode,
    setMode,
    setAudioLevel,
    setMousePosition,
    setScrollProgress,
    setEmotionalTone,
    isEnabled,
    setIsEnabled,
  }), [config, mode, setMode, isEnabled]);

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
}

// Hook to set background mode on page mount
export function useBackgroundMode(mode: BackgroundMode) {
  const { setMode } = useBackground();

  React.useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);
}
