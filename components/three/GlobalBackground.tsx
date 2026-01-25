'use client';

import { Suspense, useEffect, useState, useRef, useCallback, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { BackgroundParticles } from './BackgroundParticles';
import { BackgroundOrbs } from './BackgroundOrbs';
import { useBackground } from '@/contexts/BackgroundContext';
import { useReducedMotion } from '@/app/hooks/useReducedMotion';
import { useDeviceCapability } from '@/app/hooks/useDeviceCapability';

/**
 * Fallback gradient background for when 3D is disabled or unsupported
 */
function FallbackBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        background: `
          radial-gradient(ellipse at 20% 30%, hsl(217 91% 50% / 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, hsl(258 90% 55% / 0.08) 0%, transparent 50%),
          hsl(233 10% 4%)
        `,
      }}
    />
  );
}

/**
 * Scene content - particles and orbs
 * Memoized to prevent unnecessary re-renders
 */
const Scene = memo(function Scene() {
  const { config } = useBackground();
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

  // Throttled mouse tracking
  const lastMouseUpdate = useRef(0);
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const now = Date.now();
    // Throttle to ~30fps
    if (now - lastMouseUpdate.current < 33) return;
    lastMouseUpdate.current = now;

    setMousePosition({
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.5} />

      {/* Background orbs (large, soft glows) */}
      <BackgroundOrbs
        count={config.orbCount}
        size={config.orbSize}
        primaryColor={config.primaryColor}
        secondaryColor={config.secondaryColor}
        mousePosition={mousePosition}
      />

      {/* Floating particles (subtle dust motes) */}
      <BackgroundParticles
        count={config.particleCount}
        speed={config.particleSpeed}
        color={config.primaryColor}
        mousePosition={mousePosition}
      />
    </>
  );
});

/**
 * Main GlobalBackground component
 * Renders 3D scene or fallback based on device capabilities
 */
export function GlobalBackground() {
  const prefersReducedMotion = useReducedMotion();
  const { shouldUse3D, supportsWebGL } = useDeviceCapability();
  const { isEnabled } = useBackground();
  const [mounted, setMounted] = useState(false);

  // Only render on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render 3D if user prefers reduced motion or device can't handle it
  const shouldRender3D = mounted && isEnabled && !prefersReducedMotion && shouldUse3D && supportsWebGL;

  if (!mounted) {
    return <FallbackBackground />;
  }

  if (!shouldRender3D) {
    return <FallbackBackground />;
  }

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      {/* Fallback gradient visible before canvas loads */}
      <div
        className="absolute inset-0"
        style={{
          background: 'hsl(233 10% 4%)',
        }}
      />

      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, 10], fov: 75 }}
          gl={{
            antialias: false,
            alpha: true,
            powerPreference: 'low-power',
          }}
          dpr={[1, 1.5]}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}

export default GlobalBackground;
