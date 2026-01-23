'use client';

import { Suspense, useEffect, useState } from 'react';
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
          hsl(var(--void-deep))
        `,
      }}
    />
  );
}

/**
 * Scene content - particles and orbs
 */
function Scene() {
  const { config } = useBackground();
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

  // Track mouse position for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.5} />

      {/* Background orbs (large, soft glows) */}
      <BackgroundOrbs
        count={config.orbCount}
        size={config.orbSize / 100}
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
}

/**
 * Main GlobalBackground component
 * Renders 3D scene or fallback based on device capabilities
 */
export function GlobalBackground() {
  const prefersReducedMotion = useReducedMotion();
  const { shouldUse3D, supportsWebGL } = useDeviceCapability();
  const { isEnabled } = useBackground();

  // Don't render 3D if user prefers reduced motion or device can't handle it
  const shouldRender3D = isEnabled && !prefersReducedMotion && shouldUse3D && supportsWebGL;

  if (!shouldRender3D) {
    return <FallbackBackground />;
  }

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      {/* Fallback gradient visible before canvas loads */}
      <div
        className="absolute inset-0"
        style={{
          background: 'hsl(var(--void-deep))',
        }}
      />

      <Suspense fallback={<FallbackBackground />}>
        <Canvas
          camera={{ position: [0, 0, 10], fov: 75 }}
          gl={{
            antialias: false,
            alpha: true,
            powerPreference: 'low-power',
          }}
          dpr={[1, 1.5]} // Limit pixel ratio for performance
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
