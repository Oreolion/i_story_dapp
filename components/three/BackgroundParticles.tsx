'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BackgroundParticlesProps {
  count: number;
  speed: number;
  color: string;
  mousePosition?: { x: number; y: number };
}

// Fixed maximum particle count to avoid buffer resizing
const MAX_PARTICLES = 100;

export function BackgroundParticles({
  count,
  speed,
  color,
  mousePosition = { x: 0.5, y: 0.5 },
}: BackgroundParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // Clamp count to max
  const particleCount = Math.min(count, MAX_PARTICLES);

  // Create geometry ONCE imperatively - this avoids the buffer resize error
  // by never recreating the BufferAttribute objects
  const { geometry, velocities } = useMemo(() => {
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const sizes = new Float32Array(MAX_PARTICLES);
    const vels = new Float32Array(MAX_PARTICLES * 3);

    for (let i = 0; i < MAX_PARTICLES; i++) {
      // Position - spread across the viewport
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

      // Random velocities for organic movement
      vels[i * 3] = (Math.random() - 0.5) * 0.01;
      vels[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      vels[i * 3 + 2] = (Math.random() - 0.5) * 0.005;

      // Random sizes for depth
      sizes[i] = Math.random() * 2 + 0.5;
    }

    // Create geometry imperatively
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setDrawRange(0, MAX_PARTICLES);

    return { geometry: geo, velocities: vels };
  }, []); // Empty deps - create once, never recreate

  // Store current values in refs for animation loop
  const propsRef = useRef({ speed, mousePosition, particleCount });

  // Update refs when props change (avoids re-renders in animation loop)
  useEffect(() => {
    propsRef.current = { speed, mousePosition, particleCount };
  }, [speed, mousePosition, particleCount]);

  // Animation loop
  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const positions = geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;
    const { speed: currentSpeed, mousePosition: currentMouse, particleCount: currentCount } = propsRef.current;

    // Subtle mouse influence
    const mouseInfluenceX = (currentMouse.x - 0.5) * 0.5;
    const mouseInfluenceY = (currentMouse.y - 0.5) * 0.5;

    for (let i = 0; i < currentCount; i++) {
      const i3 = i * 3;

      // Slow drift movement
      positions[i3] += velocities[i3] * currentSpeed * delta * 60;
      positions[i3 + 1] += velocities[i3 + 1] * currentSpeed * delta * 60;
      positions[i3 + 2] += velocities[i3 + 2] * currentSpeed * delta * 60;

      // Add subtle wave motion
      positions[i3] += Math.sin(time * 0.2 + i * 0.1) * 0.001;
      positions[i3 + 1] += Math.cos(time * 0.15 + i * 0.1) * 0.001;

      // Very subtle mouse parallax
      positions[i3] += mouseInfluenceX * 0.0005;
      positions[i3 + 1] += mouseInfluenceY * 0.0005;

      // Wrap around boundaries
      if (positions[i3] > 10) positions[i3] = -10;
      if (positions[i3] < -10) positions[i3] = 10;
      if (positions[i3 + 1] > 10) positions[i3 + 1] = -10;
      if (positions[i3 + 1] < -10) positions[i3 + 1] = 10;
      if (positions[i3 + 2] > 5) positions[i3 + 2] = -5;
      if (positions[i3 + 2] < -5) positions[i3 + 2] = 5;
    }

    geometry.attributes.position.needsUpdate = true;

    // Update draw range to show only active particles
    geometry.setDrawRange(0, currentCount);
  });

  // Cleanup geometry on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        color={color}
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
