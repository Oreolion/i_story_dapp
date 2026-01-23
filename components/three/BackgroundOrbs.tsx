'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface OrbProps {
  position: [number, number, number];
  color: string;
  size: number;
  speed: number;
  offset: number;
}

function Orb({ position, color, size, speed, offset }: OrbProps) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!mesh.current) return;

    const time = state.clock.elapsedTime;

    // Slow orbital movement
    mesh.current.position.x = position[0] + Math.sin(time * speed + offset) * 2;
    mesh.current.position.y = position[1] + Math.cos(time * speed * 0.7 + offset) * 1.5;
    mesh.current.position.z = position[2] + Math.sin(time * speed * 0.5 + offset) * 0.5;

    // Subtle pulsing
    const scale = 1 + Math.sin(time * 0.5 + offset) * 0.1;
    mesh.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={mesh} position={position}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.15}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

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
  // Generate orb configurations
  const orbs = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 10,
        -5 - Math.random() * 5, // Keep behind particles
      ] as [number, number, number],
      color: i % 2 === 0 ? primaryColor : secondaryColor,
      size: size * (0.5 + Math.random() * 0.5),
      speed: 0.1 + Math.random() * 0.1,
      offset: Math.random() * Math.PI * 2,
    }));
  }, [count, size, primaryColor, secondaryColor]);

  return (
    <group>
      {orbs.map((orb) => (
        <Orb
          key={orb.id}
          position={orb.position}
          color={orb.color}
          size={orb.size}
          speed={orb.speed}
          offset={orb.offset}
        />
      ))}
    </group>
  );
}
