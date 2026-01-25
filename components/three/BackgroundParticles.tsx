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
  const meshRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  // Clamp count to max
  const particleCount = Math.min(count, MAX_PARTICLES);

  // Create stable particle data - only once
  const particleData = useMemo(() => {
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const velocities = new Float32Array(MAX_PARTICLES * 3);
    const sizes = new Float32Array(MAX_PARTICLES);

    for (let i = 0; i < MAX_PARTICLES; i++) {
      // Position - spread across the viewport
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

      // Random velocities for organic movement
      velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005;

      // Random sizes for depth
      sizes[i] = Math.random() * 2 + 0.5;
    }

    return { positions, velocities, sizes };
  }, []); // Empty deps - only create once

  // Store current values in refs for animation
  const speedRef = useRef(speed);
  const mouseRef = useRef(mousePosition);
  const countRef = useRef(particleCount);

  // Update refs when props change
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    mouseRef.current = mousePosition;
  }, [mousePosition]);

  useEffect(() => {
    countRef.current = particleCount;
  }, [particleCount]);

  // Animation loop
  useFrame((state, delta) => {
    if (!geometryRef.current) return;

    const positions = geometryRef.current.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;
    const currentSpeed = speedRef.current;
    const currentMouse = mouseRef.current;
    const currentCount = countRef.current;

    // Subtle mouse influence
    const mouseInfluenceX = (currentMouse.x - 0.5) * 0.5;
    const mouseInfluenceY = (currentMouse.y - 0.5) * 0.5;

    for (let i = 0; i < currentCount; i++) {
      const i3 = i * 3;

      // Slow drift movement
      positions[i3] += particleData.velocities[i3] * currentSpeed * delta * 60;
      positions[i3 + 1] += particleData.velocities[i3 + 1] * currentSpeed * delta * 60;
      positions[i3 + 2] += particleData.velocities[i3 + 2] * currentSpeed * delta * 60;

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

    geometryRef.current.attributes.position.needsUpdate = true;

    // Update draw range to show only active particles
    geometryRef.current.setDrawRange(0, currentCount);
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={MAX_PARTICLES}
          array={particleData.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={MAX_PARTICLES}
          array={particleData.sizes}
          itemSize={1}
        />
      </bufferGeometry>
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
