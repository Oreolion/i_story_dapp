'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Fixed maximum orb count
const MAX_ORBS = 5;

interface BackgroundOrbsProps {
  count: number;
  size: number;
  primaryColor: string;
  secondaryColor: string;
  mousePosition?: { x: number; y: number };
}

export function BackgroundOrbs({
  count,
  size,
  primaryColor,
  secondaryColor,
}: BackgroundOrbsProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Clamp count
  const orbCount = Math.min(count, MAX_ORBS);

  // Store props in refs for animation
  const countRef = useRef(orbCount);
  const sizeRef = useRef(size);

  useEffect(() => {
    countRef.current = orbCount;
  }, [orbCount]);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  // Generate stable orb configurations - only once
  const orbConfigs = useMemo(() => {
    return Array.from({ length: MAX_ORBS }, (_, i) => ({
      id: i,
      initialPosition: [
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 10,
        -5 - Math.random() * 5,
      ] as [number, number, number],
      speed: 0.1 + Math.random() * 0.1,
      offset: Math.random() * Math.PI * 2,
      sizeMultiplier: 0.5 + Math.random() * 0.5,
      useSecondary: i % 2 === 1,
    }));
  }, []);

  // Animation loop
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const currentCount = countRef.current;
    const currentSize = sizeRef.current;

    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return;

      const config = orbConfigs[i];

      // Show/hide based on current count
      mesh.visible = i < currentCount;

      if (!mesh.visible) return;

      // Slow orbital movement
      mesh.position.x = config.initialPosition[0] + Math.sin(time * config.speed + config.offset) * 2;
      mesh.position.y = config.initialPosition[1] + Math.cos(time * config.speed * 0.7 + config.offset) * 1.5;
      mesh.position.z = config.initialPosition[2] + Math.sin(time * config.speed * 0.5 + config.offset) * 0.5;

      // Subtle pulsing
      const scale = (currentSize / 100) * config.sizeMultiplier * (1 + Math.sin(time * 0.5 + config.offset) * 0.1);
      mesh.scale.setScalar(scale);
    });
  });

  return (
    <group ref={groupRef}>
      {orbConfigs.map((config, i) => (
        <mesh
          key={config.id}
          ref={(el) => { meshRefs.current[i] = el; }}
          position={config.initialPosition}
          visible={i < orbCount}
        >
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color={config.useSecondary ? secondaryColor : primaryColor}
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}
