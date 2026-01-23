'use client';

import { useState, useEffect } from 'react';

interface DeviceCapability {
  supportsWebGL: boolean;
  isLowPowerDevice: boolean;
  isMobile: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  shouldUse3D: boolean;
}

/**
 * Hook to detect device capabilities for 3D rendering decisions
 * Helps determine if we should render 3D background or fallback to CSS
 */
export function useDeviceCapability(): DeviceCapability {
  const [capability, setCapability] = useState<DeviceCapability>({
    supportsWebGL: true,
    isLowPowerDevice: false,
    isMobile: false,
    screenWidth: 1920,
    screenHeight: 1080,
    pixelRatio: 1,
    shouldUse3D: true,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check WebGL support
    const supportsWebGL = (() => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
      } catch {
        return false;
      }
    })();

    // Check if mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    // Get screen dimensions
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for performance

    // Heuristics for low-power device detection
    const isLowPowerDevice =
      isMobile ||
      (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency <= 4 ||
      screenWidth < 768;

    // Determine if we should use 3D
    const shouldUse3D = supportsWebGL && !isLowPowerDevice && screenWidth >= 768;

    setCapability({
      supportsWebGL,
      isLowPowerDevice,
      isMobile,
      screenWidth,
      screenHeight,
      pixelRatio,
      shouldUse3D,
    });

    // Update on resize
    const handleResize = () => {
      setCapability(prev => ({
        ...prev,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        shouldUse3D: prev.supportsWebGL && !prev.isLowPowerDevice && window.innerWidth >= 768,
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return capability;
}
