'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BackgroundParticlesProps {
  count: number;
  speed: number;
  color: string;
  mousePosition?: { x: number; y: number };
}

export function BackgroundParticles({
  count,
  speed,
  color,
  mousePosition = { x: 0.5, y: 0.5 },
}: BackgroundParticlesProps) {
  const mesh = useRef<THREE.Points>(null);

  // Generate particle positions
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Position - spread across the viewport
      positions[i * 3] = (Math.random() - 0.5) * 20;     // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10; // z

      // Random velocities for organic movement
      velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005;

      // Random sizes for depth
      sizes[i] = Math.random() * 2 + 0.5;
    }

    return { positions, velocities, sizes };
  }, [count]);

  // Animation loop
  useFrame((state, delta) => {
    if (!mesh.current) return;

    const positions = mesh.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;

    // Subtle mouse influence
    const mouseInfluenceX = (mousePosition.x - 0.5) * 0.5;
    const mouseInfluenceY = (mousePosition.y - 0.5) * 0.5;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Slow drift movement
      positions[i3] += particles.velocities[i3] * speed * delta * 60;
      positions[i3 + 1] += particles.velocities[i3 + 1] * speed * delta * 60;
      positions[i3 + 2] += particles.velocities[i3 + 2] * speed * delta * 60;

      // Add subtle wave motion
      positions[i3] += Math.sin(time * 0.2 + i * 0.1) * 0.001;
      positions[i3 + 1] += Math.cos(time * 0.15 + i * 0.1) * 0.001;

      // Very subtle mouse parallax
      positions[i3] += mouseInfluenceX * 0.001;
      positions[i3 + 1] += mouseInfluenceY * 0.001;

      // Wrap around boundaries
      if (positions[i3] > 10) positions[i3] = -10;
      if (positions[i3] < -10) positions[i3] = 10;
      if (positions[i3 + 1] > 10) positions[i3 + 1] = -10;
      if (positions[i3 + 1] < -10) positions[i3 + 1] = 10;
      if (positions[i3 + 2] > 5) positions[i3 + 2] = -5;
      if (positions[i3 + 2] < -5) positions[i3 + 2] = 5;
    }

    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={particles.sizes}
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
