# iStory Aesthetic Evolution — Design & 3D Integration Prompt

> **For Claude Code with Extended Thinking + Three.js MCP Server**
> **Project:** iStory Visual Identity Upgrade
> **Phase:** Design System & 3D Enhancement
> **Constraint:** Performance-first approach (no degradation)

---

## 🎯 Mission

Transform iStory from a functional Web3 journaling app into a **visually distinctive, emotionally resonant** experience that embodies the concept of **memory as living architecture**.

The visual language should feel like:
- Stepping into a **personal memory palace**
- Watching thoughts **crystallize into permanence**
- Navigating a **constellation of your own making**

**NOT** like:
- A generic SaaS dashboard
- An overwhelming crypto/Web3 app
- A tech demo with gratuitous 3D

---

## 🧠 Design Philosophy

### Core Metaphors

| Concept | Visual Metaphor | Implementation |
|---------|-----------------|----------------|
| **Memory** | Floating particles that coalesce | Ambient particle system |
| **Permanence** | Crystalline structures | Subtle geometric accents |
| **Connection** | Flowing lines between points | Constellation/network viz |
| **Time** | Depth and layers | Z-axis, parallax, fog |
| **Cognition** | Organic, flowing forms | Bezier curves, soft gradients |
| **Sovereignty** | Solid, grounded anchors | Strong typography, clear hierarchy |

### Color Evolution

**Current:** Generic gradients
**Evolved:** Purposeful, semantic color system

```
Primary Palette (Memory Space):
├── Deep Void:      #0a0a0f (background depth)
├── Memory Blue:    #3b82f6 → #1d4ed8 (trust, permanence)
├── Insight Purple: #8b5cf6 → #6d28d9 (cognition, patterns)
├── Story Amber:    #f59e0b → #d97706 (warmth, personal)
└── Growth Emerald: #10b981 → #059669 (progress, life)

Accent Palette (Emotional Tones):
├── Reflective:   #60a5fa (soft blue)
├── Joyful:       #fbbf24 (warm gold)
├── Anxious:      #f97316 (alert orange)
├── Hopeful:      #34d399 (fresh green)
├── Melancholic:  #a78bfa (muted purple)
├── Grateful:     #f472b6 (soft pink)
├── Peaceful:     #22d3ee (calm cyan)
└── Uncertain:    #9ca3af (neutral gray)

Semantic Usage:
├── Canonical/Important: Amber glow, subtle pulse
├── New/Unread: Soft bloom effect
├── Connected themes: Shared color threads
└── High significance: Increased luminosity
```

### Typography Hierarchy

```
Font Stack:
├── Headings: "Cal Sans" or "Satoshi" (modern, warm geometric)
├── Body: "Inter" (readable, professional)
└── Mono: "JetBrains Mono" (code, metadata)

Scale (fluid, clamp-based):
├── Display: clamp(2.5rem, 5vw, 4rem)
├── H1: clamp(2rem, 4vw, 3rem)
├── H2: clamp(1.5rem, 3vw, 2rem)
├── H3: clamp(1.25rem, 2vw, 1.5rem)
├── Body: clamp(1rem, 1.5vw, 1.125rem)
└── Small: clamp(0.75rem, 1vw, 0.875rem)
```

---

## 🎨 Three.js Integration Strategy

### Performance-First Rules

```
ABSOLUTE REQUIREMENTS:
1. Lighthouse Performance score must stay > 90
2. First Contentful Paint < 1.5s
3. Time to Interactive < 3s
4. No layout shift from 3D loading
5. Mobile must remain smooth (test on mid-range devices)
6. Respect prefers-reduced-motion
7. Provide graceful fallback for WebGL failure
```

### Three.js Loading Strategy

```typescript
// CORRECT: Lazy load Three.js only when needed
const Scene = dynamic(() => import('@/components/three/MemoryScene'), {
  ssr: false,
  loading: () => <div className="scene-placeholder" />,
});

// WRONG: Import at top level
import * as THREE from 'three'; // DON'T DO THIS
```

### Performance Optimization Patterns

```typescript
// 1. Use instanced meshes for particles
const particleGeometry = new THREE.BufferGeometry();
const particleMaterial = new THREE.PointsMaterial({
  size: 0.02,
  transparent: true,
  opacity: 0.6,
  vertexColors: true,
});
const particles = new THREE.Points(particleGeometry, particleMaterial);

// 2. Limit frame rate for ambient animations
let lastFrame = 0;
const targetFPS = 30;
const frameInterval = 1000 / targetFPS;

function animate(time) {
  if (time - lastFrame < frameInterval) {
    requestAnimationFrame(animate);
    return;
  }
  lastFrame = time;
  // ... render
}

// 3. Use offscreen detection
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      startAnimation();
    } else {
      pauseAnimation();
    }
  });
});

// 4. Respect reduced motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
  // Static fallback or minimal animation
}
```

---

## 📋 Implementation Tasks

### Task A.1: Design System Foundation

<task id="A.1">
<objective>Create comprehensive design system with CSS variables and Tailwind config</objective>

<files_to_create>
- styles/design-system.css
- lib/design-tokens.ts
- tailwind.config.ts (update)
</files_to_create>

<design_system_css>
```css
/* styles/design-system.css */

@layer base {
  :root {
    /* === SPACE (Memory Void) === */
    --void-deep: 233 10% 4%;
    --void-medium: 233 10% 8%;
    --void-light: 233 10% 12%;
    
    /* === PRIMARY (Trust & Permanence) === */
    --memory-50: 217 91% 95%;
    --memory-100: 217 91% 90%;
    --memory-200: 217 91% 80%;
    --memory-300: 217 91% 70%;
    --memory-400: 217 91% 60%;
    --memory-500: 217 91% 50%;
    --memory-600: 221 83% 43%;
    --memory-700: 224 76% 36%;
    --memory-800: 226 71% 29%;
    --memory-900: 228 65% 22%;
    
    /* === ACCENT (Cognition) === */
    --insight-400: 258 90% 66%;
    --insight-500: 258 90% 55%;
    --insight-600: 262 83% 48%;
    
    /* === WARM (Personal) === */
    --story-400: 38 92% 60%;
    --story-500: 38 92% 50%;
    --story-600: 32 95% 44%;
    
    /* === SEMANTIC (Emotional Tones) === */
    --tone-reflective: 217 91% 70%;
    --tone-joyful: 45 93% 58%;
    --tone-anxious: 25 95% 53%;
    --tone-hopeful: 160 84% 50%;
    --tone-melancholic: 258 90% 70%;
    --tone-grateful: 330 81% 65%;
    --tone-peaceful: 187 92% 50%;
    --tone-uncertain: 220 9% 60%;
    
    /* === EFFECTS === */
    --glow-memory: 0 0 40px hsl(var(--memory-500) / 0.3);
    --glow-insight: 0 0 40px hsl(var(--insight-500) / 0.3);
    --glow-story: 0 0 40px hsl(var(--story-500) / 0.3);
    --glow-canonical: 0 0 20px hsl(var(--story-400) / 0.5);
    
    /* === ANIMATION === */
    --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-in-out-sine: cubic-bezier(0.37, 0, 0.63, 1);
    --duration-fast: 150ms;
    --duration-normal: 300ms;
    --duration-slow: 500ms;
    --duration-slower: 800ms;
    
    /* === DEPTH (Z-layers) === */
    --layer-base: 0;
    --layer-raised: 10;
    --layer-overlay: 100;
    --layer-modal: 1000;
    --layer-toast: 2000;
  }
  
  /* Light mode overrides if needed */
  .light {
    --void-deep: 0 0% 98%;
    --void-medium: 0 0% 95%;
    --void-light: 0 0% 92%;
  }
}

/* === AMBIENT EFFECTS === */
@layer components {
  .ambient-glow {
    position: relative;
  }
  
  .ambient-glow::before {
    content: '';
    position: absolute;
    inset: -50%;
    background: radial-gradient(
      circle at 50% 50%,
      hsl(var(--memory-500) / 0.1) 0%,
      transparent 70%
    );
    pointer-events: none;
    z-index: -1;
  }
  
  .card-elevated {
    background: linear-gradient(
      145deg,
      hsl(var(--void-light)) 0%,
      hsl(var(--void-medium)) 100%
    );
    border: 1px solid hsl(var(--void-light) / 0.5);
    box-shadow: 
      0 4px 6px -1px hsl(0 0% 0% / 0.2),
      0 2px 4px -2px hsl(0 0% 0% / 0.1),
      inset 0 1px 0 hsl(255 255% 255% / 0.05);
  }
  
  .card-canonical {
    border-color: hsl(var(--story-500) / 0.5);
    box-shadow: var(--glow-canonical);
  }
  
  .text-gradient-memory {
    background: linear-gradient(
      135deg,
      hsl(var(--memory-400)) 0%,
      hsl(var(--insight-400)) 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  /* Subtle pulse for important elements */
  @keyframes subtle-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  .pulse-subtle {
    animation: subtle-pulse 3s var(--ease-in-out-sine) infinite;
  }
  
  /* Floating animation for 3D elements */
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  .animate-float {
    animation: float 6s var(--ease-in-out-sine) infinite;
  }
}

/* === REDUCED MOTION === */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .animate-float,
  .pulse-subtle {
    animation: none;
  }
}
```
</design_system_css>

<acceptance_criteria>
- [ ] CSS variables defined for all colors
- [ ] Tailwind config extended with custom colors
- [ ] Semantic color classes work (tone-reflective, etc.)
- [ ] Glow effects defined and working
- [ ] Reduced motion respected
- [ ] Light/dark mode tokens defined
</acceptance_criteria>
</task>

---

### Task A.2: Three.js Infrastructure

<task id="A.2">
<objective>Set up Three.js infrastructure with performance safeguards</objective>

<files_to_create>
- components/three/ThreeCanvas.tsx (base wrapper)
- components/three/useThreePerformance.ts (performance hook)
- components/three/ParticleField.tsx (reusable particle system)
- lib/three-utils.ts (helper functions)
</files_to_create>

<three_canvas_wrapper>
```typescript
// components/three/ThreeCanvas.tsx
"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useDeviceCapability } from "@/hooks/useDeviceCapability";

interface ThreeCanvasProps {
  children: React.ReactNode;
  className?: string;
  fallback?: React.ReactNode;
  enableOnMobile?: boolean;
  maxDpr?: number;
  frameloop?: "always" | "demand" | "never";
}

export function ThreeCanvas({
  children,
  className = "",
  fallback = null,
  enableOnMobile = false,
  maxDpr = 1.5,
  frameloop = "demand",
}: ThreeCanvasProps) {
  const [isClient, setIsClient] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);
  const prefersReducedMotion = useReducedMotion();
  const { isMobile, isLowEnd } = useDeviceCapability();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Client-side only
  useEffect(() => {
    setIsClient(true);
    
    // Check WebGL support
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setHasWebGL(!!gl);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  // Intersection observer for visibility
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Determine if we should render 3D
  const shouldRender3D = 
    isClient &&
    hasWebGL &&
    !prefersReducedMotion &&
    (!isMobile || enableOnMobile) &&
    !isLowEnd;

  if (!shouldRender3D) {
    return (
      <div ref={containerRef} className={className}>
        {fallback}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className}>
      <Canvas
        dpr={[1, maxDpr]}
        frameloop={isVisible ? frameloop : "never"}
        gl={{
          antialias: false, // Better performance
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          {children}
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
```
</three_canvas_wrapper>

<performance_hook>
```typescript
// components/three/useThreePerformance.ts
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

interface PerformanceConfig {
  targetFPS: number;
  qualityLevels: {
    high: { particles: number; complexity: number };
    medium: { particles: number; complexity: number };
    low: { particles: number; complexity: number };
  };
}

const defaultConfig: PerformanceConfig = {
  targetFPS: 30,
  qualityLevels: {
    high: { particles: 1000, complexity: 1 },
    medium: { particles: 500, complexity: 0.7 },
    low: { particles: 200, complexity: 0.4 },
  },
};

export function useThreePerformance(config = defaultConfig) {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const [currentFPS, setCurrentFPS] = useState(60);
  const [qualityLevel, setQualityLevel] = useState<"high" | "medium" | "low">("high");

  useFrame(() => {
    frameCount.current++;
    const now = performance.now();
    const delta = now - lastTime.current;

    // Calculate FPS every second
    if (delta >= 1000) {
      const fps = (frameCount.current / delta) * 1000;
      setCurrentFPS(Math.round(fps));
      frameCount.current = 0;
      lastTime.current = now;

      // Auto-adjust quality based on FPS
      if (fps < config.targetFPS * 0.6) {
        setQualityLevel("low");
      } else if (fps < config.targetFPS * 0.8) {
        setQualityLevel("medium");
      } else {
        setQualityLevel("high");
      }
    }
  });

  return {
    currentFPS,
    qualityLevel,
    settings: config.qualityLevels[qualityLevel],
  };
}
```
</performance_hook>

<device_capability_hook>
```typescript
// hooks/useDeviceCapability.ts
import { useState, useEffect } from "react";

interface DeviceCapability {
  isMobile: boolean;
  isLowEnd: boolean;
  hasWebGL2: boolean;
  maxTextureSize: number;
  devicePixelRatio: number;
}

export function useDeviceCapability(): DeviceCapability {
  const [capability, setCapability] = useState<DeviceCapability>({
    isMobile: false,
    isLowEnd: false,
    hasWebGL2: true,
    maxTextureSize: 4096,
    devicePixelRatio: 1,
  });

  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    // Check WebGL capabilities
    let hasWebGL2 = false;
    let maxTextureSize = 4096;
    
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      hasWebGL2 = !!canvas.getContext("webgl2");
      if (gl) {
        maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      }
    } catch {
      // WebGL not supported
    }

    // Estimate if device is low-end
    const isLowEnd = 
      isMobile && 
      (navigator.hardwareConcurrency <= 4 || 
       !hasWebGL2 ||
       window.devicePixelRatio < 2);

    setCapability({
      isMobile,
      isLowEnd,
      hasWebGL2,
      maxTextureSize,
      devicePixelRatio: window.devicePixelRatio,
    });
  }, []);

  return capability;
}
```
</device_capability_hook>

<acceptance_criteria>
- [ ] ThreeCanvas renders only when appropriate
- [ ] WebGL check prevents crashes
- [ ] Reduced motion disables 3D
- [ ] Low-end device detection works
- [ ] Intersection observer pauses off-screen renders
- [ ] Performance hook auto-adjusts quality
- [ ] Frame rate capping works
</acceptance_criteria>

<verification>
```bash
# Test on different devices/conditions
# 1. Desktop with WebGL
# 2. Mobile device
# 3. With prefers-reduced-motion enabled
# 4. In incognito/private mode
# Run Lighthouse audit - Performance must be > 90
```
</verification>
</task>

---

### Task A.3: Ambient Particle Field

<task id="A.3">
<objective>Create ambient particle system for background atmosphere</objective>

<file_to_create>
components/three/ParticleField.tsx
</file_to_create>

<visual_spec>
- Thousands of tiny particles floating slowly
- Depth-based fog for sense of space
- Particles near cursor gently disperse
- Colors shift based on page context (memory blue, insight purple, etc.)
- Very subtle - should feel like dust motes in light
</visual_spec>

<implementation>
```typescript
// components/three/ParticleField.tsx
"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useThreePerformance } from "./useThreePerformance";

interface ParticleFieldProps {
  count?: number;
  color?: string;
  secondaryColor?: string;
  size?: number;
  speed?: number;
  depth?: number;
  mouseInfluence?: number;
}

export function ParticleField({
  count = 500,
  color = "#3b82f6",
  secondaryColor = "#8b5cf6",
  size = 0.015,
  speed = 0.0003,
  depth = 10,
  mouseInfluence = 0.5,
}: ParticleFieldProps) {
  const meshRef = useRef<THREE.Points>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const { viewport, pointer } = useThree();
  const { settings } = useThreePerformance();
  
  // Adjust count based on performance
  const actualCount = Math.min(count, settings.particles);

  // Generate particle positions
  const [positions, colors, velocities] = useMemo(() => {
    const positions = new Float32Array(actualCount * 3);
    const colors = new Float32Array(actualCount * 3);
    const velocities = new Float32Array(actualCount * 3);
    
    const color1 = new THREE.Color(color);
    const color2 = new THREE.Color(secondaryColor);

    for (let i = 0; i < actualCount; i++) {
      const i3 = i * 3;
      
      // Random position in a box
      positions[i3] = (Math.random() - 0.5) * viewport.width * 2;
      positions[i3 + 1] = (Math.random() - 0.5) * viewport.height * 2;
      positions[i3 + 2] = (Math.random() - 0.5) * depth;

      // Random velocity
      velocities[i3] = (Math.random() - 0.5) * speed;
      velocities[i3 + 1] = (Math.random() - 0.5) * speed;
      velocities[i3 + 2] = (Math.random() - 0.5) * speed * 0.5;

      // Gradient color based on depth
      const t = (positions[i3 + 2] + depth / 2) / depth;
      const particleColor = color1.clone().lerp(color2, t);
      colors[i3] = particleColor.r;
      colors[i3 + 1] = particleColor.g;
      colors[i3 + 2] = particleColor.b;
    }

    return [positions, colors, velocities];
  }, [actualCount, color, secondaryColor, depth, viewport, speed]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    
    // Update mouse position smoothly
    mouseRef.current.x += (pointer.x * viewport.width * 0.5 - mouseRef.current.x) * 0.05;
    mouseRef.current.y += (pointer.y * viewport.height * 0.5 - mouseRef.current.y) * 0.05;

    for (let i = 0; i < actualCount; i++) {
      const i3 = i * 3;

      // Apply velocity
      positions[i3] += velocities[i3];
      positions[i3 + 1] += velocities[i3 + 1];
      positions[i3 + 2] += velocities[i3 + 2];

      // Mouse influence - particles gently move away from cursor
      const dx = positions[i3] - mouseRef.current.x;
      const dy = positions[i3 + 1] - mouseRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 2 && dist > 0) {
        const force = (1 - dist / 2) * mouseInfluence * delta;
        positions[i3] += (dx / dist) * force;
        positions[i3 + 1] += (dy / dist) * force;
      }

      // Wrap around boundaries
      const halfWidth = viewport.width;
      const halfHeight = viewport.height;
      const halfDepth = depth / 2;

      if (positions[i3] > halfWidth) positions[i3] = -halfWidth;
      if (positions[i3] < -halfWidth) positions[i3] = halfWidth;
      if (positions[i3 + 1] > halfHeight) positions[i3 + 1] = -halfHeight;
      if (positions[i3 + 1] < -halfHeight) positions[i3 + 1] = halfHeight;
      if (positions[i3 + 2] > halfDepth) positions[i3 + 2] = -halfDepth;
      if (positions[i3 + 2] < -halfDepth) positions[i3 + 2] = halfDepth;
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={actualCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={actualCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
```
</implementation>

<acceptance_criteria>
- [ ] Particles render smoothly
- [ ] Mouse interaction feels natural
- [ ] Colors match design system
- [ ] Performance stays above 30fps
- [ ] Particles wrap around boundaries
- [ ] Quality adjusts based on device
</acceptance_criteria>
</task>

---

### Task A.4: Homepage Hero Redesign

<task id="A.4">
<objective>Create immersive homepage hero with 3D memory space visualization</objective>

<files_to_create>
- components/home/HeroSection.tsx
- components/three/MemoryOrbs.tsx
- app/page.tsx (update)
</files_to_create>

<visual_concept>
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│    [3D Background: Floating memory orbs + particle field]       │
│                                                                 │
│                    ╔═══════════════════════╗                    │
│                    ║   Speak Your Story    ║  ← Gradient text   │
│                    ║   Mint Your Legacy    ║                    │
│                    ╚═══════════════════════╝                    │
│                                                                 │
│             Transform your voice into                           │
│          permanent, intelligent memory                          │
│                                                                 │
│         [🎙️ Start Recording]  [Explore Stories]                │
│                                                                 │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│    │   1.2K   │  │   847    │  │   52K    │  │   234    │      │
│    │ Stories  │  │ Writers  │  │ $STORY   │  │  Books   │      │
│    └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│                                                                 │
│    [Memory orbs slowly orbit, connected by faint lines]         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
</visual_concept>

<memory_orbs_component>
```typescript
// components/three/MemoryOrbs.tsx
"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Float, MeshDistortMaterial } from "@react-three/drei";

interface MemoryOrb {
  position: [number, number, number];
  scale: number;
  color: string;
  speed: number;
}

export function MemoryOrbs({ count = 5 }) {
  const groupRef = useRef<THREE.Group>(null);
  
  const orbs = useMemo<MemoryOrb[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4 - 2,
      ] as [number, number, number],
      scale: 0.3 + Math.random() * 0.4,
      color: ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"][i % 4],
      speed: 0.5 + Math.random() * 0.5,
    }));
  }, [count]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
  });

  return (
    <group ref={groupRef}>
      {orbs.map((orb, i) => (
        <Float
          key={i}
          speed={orb.speed}
          rotationIntensity={0.5}
          floatIntensity={0.5}
          position={orb.position}
        >
          <mesh scale={orb.scale}>
            <sphereGeometry args={[1, 32, 32]} />
            <MeshDistortMaterial
              color={orb.color}
              distort={0.3}
              speed={2}
              roughness={0.2}
              metalness={0.8}
              transparent
              opacity={0.8}
            />
          </mesh>
          {/* Glow effect */}
          <mesh scale={orb.scale * 1.5}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial
              color={orb.color}
              transparent
              opacity={0.1}
            />
          </mesh>
        </Float>
      ))}
      
      {/* Connection lines between orbs */}
      <ConnectionLines orbs={orbs} />
    </group>
  );
}

function ConnectionLines({ orbs }: { orbs: MemoryOrb[] }) {
  const lineRef = useRef<THREE.LineSegments>(null);
  
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    
    for (let i = 0; i < orbs.length; i++) {
      for (let j = i + 1; j < orbs.length; j++) {
        const dist = new THREE.Vector3(...orbs[i].position)
          .distanceTo(new THREE.Vector3(...orbs[j].position));
        
        if (dist < 5) {
          points.push(new THREE.Vector3(...orbs[i].position));
          points.push(new THREE.Vector3(...orbs[j].position));
        }
      }
    }
    
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [orbs]);

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        color="#3b82f6"
        transparent
        opacity={0.2}
        linewidth={1}
      />
    </lineSegments>
  );
}
```
</memory_orbs_component>

<acceptance_criteria>
- [ ] Hero section renders with 3D background
- [ ] Memory orbs float and rotate smoothly
- [ ] Connection lines visible between nearby orbs
- [ ] Text is readable over 3D background
- [ ] CTA buttons are prominent and clickable
- [ ] Stats section shows real data
- [ ] Fallback renders for non-WebGL browsers
- [ ] Mobile layout works without 3D
- [ ] Performance score > 90
</acceptance_criteria>
</task>

---

### Task A.5: Story Card Enhancement

<task id="A.5">
<objective>Enhance story cards with depth, hover effects, and canonical glow</objective>

<file_to_modify>
components/StoryCard.tsx
</file_to_modify>

<visual_enhancements>
```
Normal State:
┌────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← Subtle gradient bg
│  Story Title                   │
│  Preview text that gives...    │
│  ┌─────┐ ┌─────┐              │
│  │theme│ │tone │              │
│  └─────┘ └─────┘              │
│  👤 Author  ❤️ 12  💬 3       │
└────────────────────────────────┘

Hover State:
┌────────────────────────────────┐  ← Lifts up (translateY)
│ ╔════════════════════════════╗ │  ← Border glow
│ ║ Story Title               ║ │
│ ║ Preview text that gives...║ │
│ ║ ┌─────┐ ┌─────┐          ║ │
│ ║ │theme│ │tone │          ║ │
│ ║ └─────┘ └─────┘          ║ │
│ ║ 👤 Author  ❤️ 12  💬 3   ║ │
│ ╚════════════════════════════╝ │
└────────────────────────────────┘
  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ← Shadow grows

Canonical State:
┌────────────────────────────────┐
│ ✨═══════════════════════════✨│  ← Amber border + glow
│  ⭐ Story Title                │  ← Star indicator
│  Preview text that gives...    │
│  ...                           │
└────────────────────────────────┘
  ▓▓▓▓▓▓▓▓▓▓ amber glow ▓▓▓▓▓▓▓▓▓
```
</visual_enhancements>

<implementation_guidance>
```typescript
// Key CSS classes to add
const cardClasses = cn(
  // Base
  "group relative rounded-xl overflow-hidden",
  "bg-gradient-to-br from-void-light/50 to-void-medium/50",
  "border border-white/5",
  "transition-all duration-300 ease-out-expo",
  
  // Hover
  "hover:-translate-y-1",
  "hover:border-memory-500/30",
  "hover:shadow-lg hover:shadow-memory-500/10",
  
  // Canonical
  isCanonical && [
    "border-story-500/50",
    "shadow-glow-canonical",
  ],
);

// Subtle inner highlight on hover
<div className={cn(
  "absolute inset-0 opacity-0 transition-opacity",
  "bg-gradient-to-t from-transparent via-transparent to-white/5",
  "group-hover:opacity-100"
)} />
```
</implementation_guidance>

<acceptance_criteria>
- [ ] Cards have subtle depth/gradient
- [ ] Hover lifts card and adds glow
- [ ] Canonical stories have amber glow
- [ ] Transitions are smooth (300ms ease-out-expo)
- [ ] Theme badges use semantic colors
- [ ] Mood indicators match design system
- [ ] Works on touch devices (no hover jank)
</acceptance_criteria>
</task>

---

### Task A.6: Insights Visualization Upgrade

<task id="A.6">
<objective>Transform StoryInsights into an organic, flowing visualization</objective>

<file_to_modify>
components/StoryInsights.tsx
</file_to_modify>

<visual_concept>
```
Current (Badge-heavy):
┌─────────────────────────────────────┐
│ Insights                            │
│ [growth] [reflection] [change]      │
│ Tone: hopeful  Domain: identity     │
│ People: Mom, Dad                    │
└─────────────────────────────────────┘

Evolved (Organic):
┌─────────────────────────────────────┐
│ ✨ Story Insights                   │
├─────────────────────────────────────┤
│                                     │
│    "A journey of finding clarity    │
│     through embracing change"       │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ○───○ growth                │   │
│  │    ╲                        │   │  ← Theme connections
│  │     ○ reflection            │   │     (mini constellation)
│  │    ╱                        │   │
│  │ ○───○ change                │   │
│  └─────────────────────────────┘   │
│                                     │
│  💚 Hopeful        🪞 Identity     │
│  ▓▓▓▓▓▓▓▓░░ 78% significance       │
│                                     │
│  Mentions: Mom, Dad • New York     │
│  Period: Last summer                │
└─────────────────────────────────────┘
```
</visual_concept>

<acceptance_criteria>
- [ ] Insight quote is prominent and styled
- [ ] Themes shown with visual connections
- [ ] Tone uses color + icon
- [ ] Domain uses icon + label
- [ ] Significance shown as visual bar
- [ ] Entities shown in subtle footer
- [ ] Animations are subtle and purposeful
- [ ] High significance stories have extra emphasis
</acceptance_criteria>
</task>

---

### Task A.7: Archive/Library Page Spatial Design

<task id="A.7">
<objective>Transform library into a spatial "memory palace" experience</objective>

<files_to_modify>
- app/library/page.tsx
- components/patterns/ThemesView.tsx
- components/patterns/DomainsView.tsx
</files_to_modify>

<visual_concept>
The library should feel like navigating a personal museum of memories.

```
┌─────────────────────────────────────────────────────────────────┐
│  Your Archive                            January 2026           │
│  47 stories • 5 key moments                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📅 This Month                                          │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐                    │   │
│  │  │   8    │  │  ⭐ 2   │  │  78%   │                    │   │
│  │  │Stories │  │Moments │  │ Signif │                    │   │
│  │  └────────┘  └────────┘  └────────┘                    │   │
│  │  Top themes: growth, reflection • Mood: hopeful        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [All] [⭐ Key Moments] [# Themes] [◐ Life Areas] [Recent]     │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ ░░░░░░░░ │  │ ✨░░░░░░ │  │ ░░░░░░░░ │  │ ░░░░░░░░ │       │
│  │ Story 1  │  │ Story 2  │  │ Story 3  │  │ Story 4  │       │
│  │ growth   │  │ ⭐ canon │  │ reflect  │  │ change   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│         [Scroll reveals more with parallax effect]              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
</visual_concept>

<acceptance_criteria>
- [ ] Monthly summary card is visually prominent
- [ ] Tab navigation is clear and accessible
- [ ] Story grid has consistent spacing
- [ ] Canonical stories are visually distinct
- [ ] Empty states are helpful and on-brand
- [ ] Loading states use skeletons matching card shape
- [ ] Scroll behavior is smooth
- [ ] Works well on mobile (single column)
</acceptance_criteria>
</task>

---

## 🔄 Implementation Order

```
1. Task A.1: Design System Foundation
   └── CSS variables, Tailwind config
   
2. Task A.2: Three.js Infrastructure  
   └── Canvas wrapper, performance hooks
   
3. Task A.3: Ambient Particle Field
   └── Background atmosphere
   
4. Task A.4: Homepage Hero
   └── 3D hero with memory orbs
   
5. Task A.5: Story Card Enhancement
   └── Depth, hover, canonical glow
   
6. Task A.6: Insights Visualization
   └── Organic, flowing design
   
7. Task A.7: Archive Page
   └── Spatial memory palace
```

---

## 🧪 Performance Testing Protocol

After EACH task:

```bash
# 1. Run Lighthouse audit
npx lighthouse http://localhost:3000 --output=json --output-path=./lighthouse-report.json

# 2. Check key metrics
# - Performance score > 90
# - First Contentful Paint < 1.5s
# - Largest Contentful Paint < 2.5s
# - Cumulative Layout Shift < 0.1

# 3. Test on throttled connection
# Chrome DevTools > Network > Slow 3G

# 4. Test reduced motion
# Chrome DevTools > Rendering > Emulate CSS media feature prefers-reduced-motion
```

---

## 🎨 Design QA Checklist

Before marking any task complete:

- [ ] Colors match design system exactly
- [ ] Typography hierarchy is consistent
- [ ] Spacing uses consistent scale (4px base)
- [ ] Animations are smooth (no jank)
- [ ] Dark mode looks intentional
- [ ] Light mode (if supported) is usable
- [ ] Focus states are visible
- [ ] Touch targets are 44px minimum
- [ ] Text has sufficient contrast (WCAG AA)
- [ ] 3D elements don't obstruct content

---

## 🚨 If Performance Degrades

```
IMMEDIATE ACTIONS:
1. Disable 3D effects temporarily
2. Profile with Chrome DevTools Performance tab
3. Identify expensive operations
4. Spawn thinking agent for optimization strategy

npx ts-node scripts/think.ts "My Three.js particle system is causing 
frame drops on mobile. Currently rendering 1000 particles with 
useFrame updating positions every frame. How can I optimize this 
while maintaining visual quality?"
```

---

## 🚀 Begin Implementation

**Start with Task A.1: Design System Foundation**

This establishes the visual language that all other tasks depend on.

```
@task A.1
<begin>
Create styles/design-system.css with all CSS variables.
Update tailwind.config.ts to use custom colors.
Verify colors render correctly in browser.
Report completion.
</begin>
```