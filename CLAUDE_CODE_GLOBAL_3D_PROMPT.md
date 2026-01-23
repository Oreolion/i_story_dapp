# iStory Global 3D Background & UI Enhancement

> **For Claude Code with Three.js MCP Server**
> **Scope:** App-wide 3D background + Page-specific UI improvements
> **Constraint:** Performance-first, preserve all existing text
> **Architecture:** Single persistent Three.js context across all routes

---

## 🎯 Vision

Create a **unified spatial experience** where users navigate through their personal memory palace. The 3D background is ONE continuous space that transforms based on context — not separate backgrounds that swap out.

**The user should feel like they're moving through rooms in their own mind:**
- **Home** → The welcoming entrance hall
- **Record** → The creation studio
- **Library** → The archive of memories
- **Story Detail** → A memory chamber
- **Profile** → Their personal sanctum
- **Social** → The connection courtyard

---

## 🏗️ Architecture Overview

### Global Background System

```
┌─────────────────────────────────────────────────────────────────┐
│  RootLayout (app/layout.tsx)                                    │
│  ├── BackgroundProvider (Context)                               │
│  │   └── GlobalBackground (Three.js Canvas - PERSISTENT)        │
│  │       ├── ParticleSystem (base layer)                        │
│  │       ├── MemoryOrbs (contextual)                            │
│  │       ├── ConnectionLines (contextual)                       │
│  │       └── FogLayer (depth)                                   │
│  │                                                              │
│  └── {children} (Pages render ON TOP of background)             │
│      ├── HomePage        → configures: welcoming, open          │
│      ├── RecordPage      → configures: focused, audio-reactive  │
│      ├── LibraryPage     → configures: reflective, clustered    │
│      ├── StoryPage       → configures: immersive, single-focus  │
│      ├── ProfilePage     → configures: personal, orbital        │
│      └── SocialPage      → configures: connected, networked     │
└─────────────────────────────────────────────────────────────────┘
```

### State Flow

```typescript
// Each page configures the background via context
const { setBackgroundConfig } = useBackground();

useEffect(() => {
  setBackgroundConfig({
    mode: 'record',           // Behavior mode
    primaryColor: '#3b82f6',  // Main color
    intensity: 0.6,           // Particle density
    audioReactive: true,      // Respond to audio?
    focusPoint: null,         // Camera focus
    transitionDuration: 800,  // Smooth transition
  });
}, []);
```

---

## 🎨 Background Modes

### Mode: `home` (Default)

**Purpose:** Welcome users, showcase the product
**Feel:** Open, inviting, slightly magical

```
Visual:
┌─────────────────────────────────────────────────────────────────┐
│  ·  ·    ·      ·    ·        ·     ·    ·      ·    ·         │
│       ·      ·          ·  ·      ·        ·          ·   ·    │
│    ·      ○      ·    ·       ○        ·       ○    ·          │
│  ·    ·      ·     ·     ·        ·  ·     ·      ·     ·      │
│      ·   ·     ·      ·     ·   ·       ·     ·      ·   ·     │
│   ·         ·     ○      ·        ·  ○      ·     ·      ·     │
│      ·   ·     ·      ·     ·   ·       ·     ·      ·         │
└─────────────────────────────────────────────────────────────────┘

○ = Memory orbs (few, floating gently)
· = Particles (many, slow drift)
```

**Configuration:**
```typescript
{
  mode: 'home',
  primaryColor: '#3b82f6',     // Memory blue
  secondaryColor: '#8b5cf6',   // Insight purple
  particleCount: 500,
  particleSpeed: 0.0002,
  orbCount: 5,
  orbsConnected: true,
  mouseParallax: true,
  intensity: 0.5,
}
```

---

### Mode: `record`

**Purpose:** Focused creation, voice visualization
**Feel:** Studio-like, responsive, present

```
Visual (Ready):
┌─────────────────────────────────────────────────────────────────┐
│                          ·    ·                                 │
│             ·    ·    ·      ·    ·    ·                        │
│         ·      ·    ·    ·      ·    ·      ·                   │
│       ·    ·      ·    ·    ·      ·    ·    ·                  │
│     ·    ·    ·    ·    ●    ·    ·    ·    ·                   │
│       ·    ·      ·    ·    ·      ·    ·    ·                  │
│         ·      ·    ·    ·      ·    ·      ·                   │
│             ·    ·    ·      ·    ·    ·                        │
└─────────────────────────────────────────────────────────────────┘

● = Central focus point (where record button is)
· = Particles (converging toward center)

Visual (Recording - particles pulse outward with voice):
┌─────────────────────────────────────────────────────────────────┐
│     ·              ·              ·              ·              │
│          ·    ·         ·    ·         ·    ·                   │
│   ·         ·    ·    ·    ·    ·    ·    ·         ·          │
│        ·      ·    ·    ·    ·    ·    ·      ·                 │
│  ·   ·    ·    ·    ·    ●    ·    ·    ·    ·   ·             │
│        ·      ·    ·    ·    ·    ·    ·      ·                 │
│   ·         ·    ·    ·    ·    ·    ·    ·         ·          │
│          ·    ·         ·    ·         ·    ·                   │
└─────────────────────────────────────────────────────────────────┘
```

**Configuration:**
```typescript
{
  mode: 'record',
  primaryColor: '#3b82f6',     // Blue (ready)
  // Changes to '#ef4444' (red) when recording
  particleCount: 300,
  particleSpeed: 0.0003,
  centralFocus: true,
  audioReactive: true,
  audioLevel: 0,               // Updated by page
  orbCount: 0,                 // No orbs - focused
  intensity: 0.6,
}
```

**Sub-states:**
- `record:ready` → Blue, gentle convergence
- `record:recording` → Red, audio-pulsing
- `record:transcribing` → Purple, organizing
- `record:enhancing` → Amber, crystallizing
- `record:complete` → Green, settled

---

### Mode: `library`

**Purpose:** View patterns across memories
**Feel:** Archive, constellation map, reflective

```
Visual:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│        ○───○ growth          ○ relationships                   │
│           ╲                 ╱│                                  │
│            ○               ○ │                                  │
│           ╱ ╲             ╱  │                                  │
│      ○───○   ○───────────○   ○                                 │
│      identity     ╲      reflection                             │
│                    ○                                            │
│                   change                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

○ = Memory orbs (representing theme clusters)
─ = Connection lines (related themes)
```

**Configuration:**
```typescript
{
  mode: 'library',
  primaryColor: '#8b5cf6',     // Insight purple
  particleCount: 200,
  particleSpeed: 0.0001,
  orbCount: 0,                 // Orbs are data-driven
  themeOrbs: [...],            // From usePatterns hook
  connectRelated: true,
  scrollParallax: true,
  intensity: 0.4,
}
```

---

### Mode: `story`

**Purpose:** Immerse in a single memory
**Feel:** Intimate, focused, emotional

```
Visual:
┌─────────────────────────────────────────────────────────────────┐
│                          ·    ·                                 │
│             ·    ·    ·      ·    ·    ·                        │
│                                                                 │
│                      ╭─────────╮                                │
│                      │         │                                │
│         ·    ·       │    ◉    │       ·    ·                   │
│                      │         │                                │
│                      ╰─────────╯                                │
│                                                                 │
│             ·    ·    ·      ·    ·    ·                        │
│                          ·    ·                                 │
└─────────────────────────────────────────────────────────────────┘

◉ = Single memory orb (colored by story's emotional tone)
· = Sparse particles (focused attention)
```

**Configuration:**
```typescript
{
  mode: 'story',
  primaryColor: story.metadata?.emotional_tone_color || '#3b82f6',
  particleCount: 150,
  particleSpeed: 0.0001,
  orbCount: 1,
  centralOrb: true,
  orbPulse: story.metadata?.is_canonical,
  scrollParallax: true,
  intensity: 0.4,
}
```

---

### Mode: `profile`

**Purpose:** Personal identity, reflection
**Feel:** Personal, orbital, self-focused

```
Visual:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    ○  identity                                  │
│                 ╱                                               │
│          ○  growth                                              │
│           ╲    ╲                                                │
│            ╲    ╲   ┌─────┐                                     │
│             ╲    ╲──│ You │──○  relationships                  │
│              ╲      └─────┘ ╱                                   │
│               ○────────────○                                    │
│             work        family                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Central = User's identity
Orbiting = Their dominant life domains
```

**Configuration:**
```typescript
{
  mode: 'profile',
  primaryColor: user.dominantTone || '#3b82f6',
  particleCount: 200,
  orbitalMotion: true,
  domainOrbs: [...],           // From user's patterns
  centerOnUser: true,
  intensity: 0.5,
}
```

---

### Mode: `social`

**Purpose:** Community, connections
**Feel:** Network, active, social

```
Visual:
┌─────────────────────────────────────────────────────────────────┐
│    ○        ○──────○                                           │
│     ╲      ╱        ╲                                          │
│      ○────○          ○────○                                    │
│     ╱      ╲        ╱      ╲                                   │
│    ○        ○──────○        ○                                  │
│              ╲    ╱                                             │
│               ○──○                                              │
│              ╱    ╲                                             │
│    ○────────○      ○────────○                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

○ = User nodes (community members)
─ = Connections (interactions, follows)
```

**Configuration:**
```typescript
{
  mode: 'social',
  primaryColor: '#f59e0b',     // Story amber (warm, social)
  particleCount: 100,
  networkMode: true,
  nodeCount: 20,
  connectionPulse: true,       // Pulse on new activity
  intensity: 0.4,
}
```

---

## 📋 Implementation Tasks

### Task G.0: Document All Pages

<task id="G.0">
<objective>Audit all pages and document existing text/functionality</objective>

<pages_to_audit>
- app/page.tsx (Home)
- app/record/page.tsx
- app/library/page.tsx
- app/story/[storyId]/page.tsx
- app/profile/page.tsx (or similar)
- app/social/page.tsx (or feed, community)
- app/layout.tsx (root layout)
</pages_to_audit>

<output_required>
For each page document:
1. All text content (headings, labels, buttons, messages)
2. Current component structure
3. Current styling approach
4. Key state/interactions
5. What background behavior would enhance it
</output_required>

<acceptance_criteria>
- [ ] All pages audited
- [ ] All text content documented
- [ ] Enhancement opportunities identified
- [ ] No text will be lost in implementation
</acceptance_criteria>
</task>

---

### Task G.1: Background Context System

<task id="G.1">
<objective>Create React Context for global background configuration</objective>

<files_to_create>
- contexts/BackgroundContext.tsx
- hooks/useBackground.ts
- types/background.ts
</files_to_create>

<type_definitions>
```typescript
// types/background.ts

export type BackgroundMode = 
  | 'home'
  | 'record'
  | 'library'
  | 'story'
  | 'profile'
  | 'social';

export type RecordSubState = 
  | 'ready'
  | 'recording'
  | 'transcribing'
  | 'enhancing'
  | 'complete';

export interface BackgroundConfig {
  // Mode
  mode: BackgroundMode;
  subState?: RecordSubState;
  
  // Colors
  primaryColor: string;
  secondaryColor?: string;
  
  // Particles
  particleCount: number;
  particleSpeed: number;
  particleSize?: number;
  
  // Orbs
  orbCount: number;
  orbPositions?: Array<[number, number, number]>;
  orbColors?: string[];
  centralOrb?: boolean;
  
  // Behavior
  intensity: number;              // 0-1, overall visibility
  audioReactive?: boolean;
  audioLevel?: number;            // 0-1, from audio analyzer
  mouseParallax?: boolean;
  scrollParallax?: boolean;
  
  // Transitions
  transitionDuration: number;     // ms
  
  // Data-driven (optional)
  themeData?: Array<{ theme: string; count: number; color: string }>;
  networkData?: Array<{ id: string; connections: string[] }>;
}

export interface BackgroundContextValue {
  config: BackgroundConfig;
  setConfig: (config: Partial<BackgroundConfig>) => void;
  setMode: (mode: BackgroundMode) => void;
  setAudioLevel: (level: number) => void;
  resetToDefault: () => void;
}
```
</type_definitions>

<context_implementation>
```typescript
// contexts/BackgroundContext.tsx
'use client';

import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { BackgroundConfig, BackgroundContextValue, BackgroundMode } from '@/types/background';

const DEFAULT_CONFIG: BackgroundConfig = {
  mode: 'home',
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6',
  particleCount: 500,
  particleSpeed: 0.0002,
  orbCount: 5,
  intensity: 0.5,
  transitionDuration: 800,
  mouseParallax: true,
};

const BackgroundContext = createContext<BackgroundContextValue | null>(null);

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<BackgroundConfig>(DEFAULT_CONFIG);
  const targetConfigRef = useRef<BackgroundConfig>(DEFAULT_CONFIG);
  
  // Smooth transition between configs
  const setConfig = useCallback((newConfig: Partial<BackgroundConfig>) => {
    setConfigState(prev => {
      const merged = { ...prev, ...newConfig };
      targetConfigRef.current = merged;
      return merged;
    });
  }, []);
  
  const setMode = useCallback((mode: BackgroundMode) => {
    const modeDefaults = getModeDefaults(mode);
    setConfig({ mode, ...modeDefaults });
  }, [setConfig]);
  
  const setAudioLevel = useCallback((level: number) => {
    setConfigState(prev => ({ ...prev, audioLevel: level }));
  }, []);
  
  const resetToDefault = useCallback(() => {
    setConfigState(DEFAULT_CONFIG);
  }, []);
  
  const value = useMemo<BackgroundContextValue>(() => ({
    config,
    setConfig,
    setMode,
    setAudioLevel,
    resetToDefault,
  }), [config, setConfig, setMode, setAudioLevel, resetToDefault]);
  
  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackground must be used within BackgroundProvider');
  }
  return context;
}

// Mode-specific defaults
function getModeDefaults(mode: BackgroundMode): Partial<BackgroundConfig> {
  switch (mode) {
    case 'home':
      return {
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        particleCount: 500,
        particleSpeed: 0.0002,
        orbCount: 5,
        intensity: 0.5,
        mouseParallax: true,
      };
    case 'record':
      return {
        primaryColor: '#3b82f6',
        particleCount: 300,
        particleSpeed: 0.0003,
        orbCount: 0,
        intensity: 0.6,
        audioReactive: true,
        centralOrb: false,
      };
    case 'library':
      return {
        primaryColor: '#8b5cf6',
        particleCount: 200,
        particleSpeed: 0.0001,
        orbCount: 0,
        intensity: 0.4,
        scrollParallax: true,
      };
    case 'story':
      return {
        particleCount: 150,
        particleSpeed: 0.0001,
        orbCount: 1,
        centralOrb: true,
        intensity: 0.4,
        scrollParallax: true,
      };
    case 'profile':
      return {
        particleCount: 200,
        particleSpeed: 0.00015,
        intensity: 0.5,
      };
    case 'social':
      return {
        primaryColor: '#f59e0b',
        particleCount: 100,
        intensity: 0.4,
      };
    default:
      return {};
  }
}
```
</context_implementation>

<acceptance_criteria>
- [ ] Context created and exported
- [ ] useBackground hook works
- [ ] Mode defaults are sensible
- [ ] Config updates trigger re-renders
- [ ] No memory leaks
</acceptance_criteria>
</task>

---

### Task G.2: Global Background Canvas

<task id="G.2">
<objective>Create the persistent Three.js canvas that lives in root layout</objective>

<files_to_create>
- components/three/GlobalBackground.tsx
- components/three/BackgroundParticles.tsx
- components/three/BackgroundOrbs.tsx
- components/three/BackgroundConnections.tsx
</files_to_create>

<global_background_component>
```typescript
// components/three/GlobalBackground.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import { useBackground } from '@/contexts/BackgroundContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useDeviceCapability } from '@/hooks/useDeviceCapability';
import { BackgroundParticles } from './BackgroundParticles';
import { BackgroundOrbs } from './BackgroundOrbs';
import { BackgroundConnections } from './BackgroundConnections';

export function GlobalBackground() {
  const [mounted, setMounted] = useState(false);
  const { config } = useBackground();
  const prefersReducedMotion = useReducedMotion();
  const { isLowEnd, hasWebGL } = useDeviceCapability();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render 3D if conditions aren't met
  if (!mounted || prefersReducedMotion || isLowEnd || !hasWebGL) {
    return <StaticGradientFallback config={config} />;
  }

  return (
    <div 
      className="fixed inset-0 -z-10"
      style={{ pointerEvents: 'none' }}
    >
      <Canvas
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
        }}
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Ambient fog for depth */}
          <fog attach="fog" args={['#0a0a0f', 5, 15]} />
          
          {/* Particles - always present */}
          <BackgroundParticles />
          
          {/* Orbs - contextual */}
          {config.orbCount > 0 && <BackgroundOrbs />}
          
          {/* Connections - for library/social modes */}
          {(config.mode === 'library' || config.mode === 'social') && (
            <BackgroundConnections />
          )}
          
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Fallback for non-WebGL / reduced motion
function StaticGradientFallback({ config }: { config: BackgroundConfig }) {
  return (
    <div 
      className="fixed inset-0 -z-10 transition-colors duration-700"
      style={{
        background: `radial-gradient(ellipse at 50% 50%, ${config.primaryColor}15 0%, transparent 70%), 
                     linear-gradient(to bottom, #0a0a0f, #0f0f1a)`,
      }}
    />
  );
}
```
</global_background_component>

<particles_component>
```typescript
// components/three/BackgroundParticles.tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useBackground } from '@/contexts/BackgroundContext';

export function BackgroundParticles() {
  const meshRef = useRef<THREE.Points>(null);
  const { config } = useBackground();
  const { viewport, pointer } = useThree();
  
  // Lerp targets for smooth transitions
  const lerpedColor = useRef(new THREE.Color(config.primaryColor));
  const lerpedIntensity = useRef(config.intensity);

  const { positions, velocities, basePositions } = useMemo(() => {
    const count = config.particleCount;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const basePositions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2 + Math.random() * 6;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi) - 4;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      
      basePositions[i3] = x;
      basePositions[i3 + 1] = y;
      basePositions[i3 + 2] = z;

      velocities[i3] = (Math.random() - 0.5) * 0.01;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.005;
    }

    return { positions, velocities, basePositions };
  }, [config.particleCount]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;
    const pos = meshRef.current.geometry.attributes.position.array as Float32Array;
    const material = meshRef.current.material as THREE.PointsMaterial;

    // Smooth color transition
    const targetColor = new THREE.Color(config.primaryColor);
    lerpedColor.current.lerp(targetColor, delta * 2);
    material.color = lerpedColor.current;

    // Smooth intensity transition
    lerpedIntensity.current += (config.intensity - lerpedIntensity.current) * delta * 2;
    material.opacity = lerpedIntensity.current;

    // Update particles based on mode
    for (let i = 0; i < config.particleCount; i++) {
      const i3 = i * 3;

      // Base movement
      pos[i3] += velocities[i3] * config.particleSpeed * 50;
      pos[i3 + 1] += velocities[i3 + 1] * config.particleSpeed * 50;
      pos[i3 + 2] += velocities[i3 + 2] * config.particleSpeed * 50;

      // Mode-specific behavior
      if (config.mode === 'record' && config.audioReactive && config.audioLevel) {
        // Audio reactivity - particles pulse outward
        const audioForce = config.audioLevel * 0.05;
        const dx = pos[i3];
        const dy = pos[i3 + 1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          pos[i3] += (dx / dist) * audioForce;
          pos[i3 + 1] += (dy / dist) * audioForce;
        }
      }

      if (config.mouseParallax) {
        // Subtle mouse parallax
        const parallaxStrength = 0.3;
        pos[i3] += (pointer.x * parallaxStrength - pos[i3]) * 0.001;
        pos[i3 + 1] += (pointer.y * parallaxStrength - pos[i3 + 1]) * 0.001;
      }

      // Contain particles
      const maxDist = 8;
      const dist = Math.sqrt(pos[i3] ** 2 + pos[i3 + 1] ** 2 + (pos[i3 + 2] + 4) ** 2);
      if (dist > maxDist) {
        // Reset to base position with slight randomness
        pos[i3] = basePositions[i3] + (Math.random() - 0.5) * 0.5;
        pos[i3 + 1] = basePositions[i3 + 1] + (Math.random() - 0.5) * 0.5;
        pos[i3 + 2] = basePositions[i3 + 2] + (Math.random() - 0.5) * 0.5;
      }
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.rotation.y = time * 0.02;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={config.particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color={config.primaryColor}
        transparent
        opacity={config.intensity}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
```
</particles_component>

<acceptance_criteria>
- [ ] Canvas renders without errors
- [ ] Particles visible and moving
- [ ] Color transitions are smooth
- [ ] Intensity transitions are smooth
- [ ] Mode-specific behaviors work
- [ ] Audio reactivity works when enabled
- [ ] Mouse parallax works when enabled
- [ ] Fallback renders for non-WebGL
- [ ] Performance stays above 30fps
</acceptance_criteria>
</task>

---

### Task G.3: Root Layout Integration

<task id="G.3">
<objective>Integrate background into root layout</objective>

<file_to_modify>
app/layout.tsx
</file_to_modify>

<implementation>
```typescript
// app/layout.tsx
import { BackgroundProvider } from '@/contexts/BackgroundContext';
import { GlobalBackground } from '@/components/three/GlobalBackground';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <BackgroundProvider>
          {/* Global 3D background - persists across routes */}
          <GlobalBackground />
          
          {/* Page content renders on top */}
          <main className="relative z-10">
            {children}
          </main>
        </BackgroundProvider>
      </body>
    </html>
  );
}
```
</implementation>

<acceptance_criteria>
- [ ] Background renders on all pages
- [ ] Background persists during navigation (no re-init)
- [ ] Content renders on top of background
- [ ] No z-index conflicts
- [ ] No pointer event issues
</acceptance_criteria>
</task>

---

### Task G.4: Page-Specific Configurations

<task id="G.4">
<objective>Add background configuration to each page</objective>

<files_to_modify>
- app/page.tsx (Home)
- app/record/page.tsx
- app/library/page.tsx
- app/story/[storyId]/page.tsx
- app/profile/page.tsx
- app/social/page.tsx
</files_to_modify>

<pattern>
```typescript
// Example: app/library/page.tsx
'use client';

import { useEffect } from 'react';
import { useBackground } from '@/contexts/BackgroundContext';
import { usePatterns } from '@/hooks/usePatterns';

export default function LibraryPage() {
  const { setConfig, setMode } = useBackground();
  const { themeGroups } = usePatterns();

  // Configure background for this page
  useEffect(() => {
    setMode('library');
    
    // Pass theme data for constellation visualization
    if (themeGroups.length > 0) {
      setConfig({
        themeData: themeGroups.map(g => ({
          theme: g.theme,
          count: g.count,
          color: getThemeColor(g.theme),
        })),
      });
    }
    
    // Cleanup: reset on unmount (optional)
    return () => {
      // Only if you want to reset when leaving
    };
  }, [setMode, setConfig, themeGroups]);

  return (
    // ... existing page content (ALL TEXT PRESERVED)
  );
}
```
</pattern>

<record_page_special>
```typescript
// app/record/page.tsx - needs audio level updates
'use client';

import { useEffect } from 'react';
import { useBackground } from '@/contexts/BackgroundContext';
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';

export default function RecordPage() {
  const { setMode, setConfig, setAudioLevel } = useBackground();
  const { audioLevel, startAnalyzing, stopAnalyzing } = useAudioAnalyzer();

  // Configure background
  useEffect(() => {
    setMode('record');
  }, [setMode]);

  // Update audio level in real-time
  useEffect(() => {
    setAudioLevel(audioLevel);
  }, [audioLevel, setAudioLevel]);

  // Update substate based on recording state
  useEffect(() => {
    setConfig({ 
      subState: recordingState,
      primaryColor: getStateColor(recordingState),
    });
  }, [recordingState, setConfig]);

  // ... existing page content
}
```
</record_page_special>

<acceptance_criteria>
- [ ] Each page sets appropriate mode on mount
- [ ] Transitions between pages are smooth
- [ ] Record page updates audio level
- [ ] Library page passes theme data
- [ ] Story page uses story's mood color
- [ ] No duplicate configurations
- [ ] All existing text preserved
</acceptance_criteria>
</task>

---

### Task G.5: Record Page UI Enhancement

<task id="G.5">
<objective>Enhance Record Page UI while preserving all text</objective>

<components_to_create_or_modify>
- components/record/RecordButton.tsx
- components/record/RecordingTimer.tsx
- components/record/WaveformVisualizer.tsx
- components/record/ProcessingState.tsx
- app/record/page.tsx (layout/styling only)
</components_to_create_or_modify>

<visual_requirements>
See detailed specs in earlier section of this document:
- RecordButton with breathing glow
- RecordingTimer with pulsing indicator
- WaveformVisualizer with organic curves
- ProcessingState with progress indication
</visual_requirements>

<critical_constraint>
ALL existing text must be preserved:
- All headings
- All button labels
- All messages
- All placeholders
- All error messages
</critical_constraint>

<acceptance_criteria>
- [ ] All visual enhancements implemented
- [ ] All existing text preserved exactly
- [ ] All existing functionality works
- [ ] Recording still works correctly
- [ ] Transcription still works correctly
- [ ] Enhancement still works correctly
- [ ] Save/publish still works correctly
</acceptance_criteria>
</task>

---

### Task G.6: Home Page Enhancement

<task id="G.6">
<objective>Enhance Home Page to showcase the 3D background</objective>

<file_to_modify>
app/page.tsx
</file_to_modify>

<visual_concept>
```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]                           [Nav Items]   [Connect Wallet]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│           [3D Memory orbs floating in background]               │
│                                                                 │
│                                                                 │
│                ╔═══════════════════════════╗                    │
│                ║                           ║                    │
│                ║   Your Stories, Forever   ║   ← Keep text      │
│                ║                           ║                    │
│                ╚═══════════════════════════╝                    │
│                                                                 │
│              [Existing subheadline text here]                   │
│                                                                 │
│                                                                 │
│         [🎙️ Start Recording]    [Explore Stories]              │
│                                                                 │
│                                                                 │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│    │  Stats   │  │  Stats   │  │  Stats   │  │  Stats   │      │
│    │  Keep    │  │  existing│  │  text    │  │  labels  │      │
│    └──────────┘  └──────────┘  └──────────┘  └──────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
</visual_concept>

<enhancements>
- Hero text gets gradient treatment
- Stats cards get subtle glass effect
- CTA buttons get enhanced hover states
- Background orbs create depth
- Mouse movement creates subtle parallax
</enhancements>

<acceptance_criteria>
- [ ] Hero section enhanced
- [ ] Stats section enhanced
- [ ] CTA buttons enhanced
- [ ] All existing text preserved
- [ ] Background complements not distracts
- [ ] Mobile layout works
</acceptance_criteria>
</task>

---

### Task G.7: Library Page Enhancement

<task id="G.7">
<objective>Enhance Library Page with constellation theme visualization</objective>

<file_to_modify>
app/library/page.tsx
</file_to_modify>

<enhancements>
- Monthly summary card enhanced
- Tab navigation refined
- Story cards get depth/hover effects
- Background shows theme constellations (subtle)
- Scroll parallax for depth
</enhancements>

<acceptance_criteria>
- [ ] All tabs work
- [ ] Theme constellation visible in background
- [ ] Story cards enhanced
- [ ] All existing text preserved
- [ ] Performance acceptable
</acceptance_criteria>
</task>

---

### Task G.8: Story Detail Page Enhancement

<task id="G.8">
<objective>Enhance Story Detail Page with immersive single-story focus</objective>

<file_to_modify>
app/story/[storyId]/page.tsx
</file_to_modify>

<enhancements>
- Background focuses on single orb (story's mood color)
- Story content area has subtle glow
- Insights section enhanced
- Scroll creates parallax depth
- Canonical badge more prominent
</enhancements>

<acceptance_criteria>
- [ ] Background reflects story's mood
- [ ] Content area enhanced
- [ ] Insights section enhanced
- [ ] Canonical stories feel special
- [ ] All existing text preserved
</acceptance_criteria>
</task>

---

## 🔄 Implementation Order

```
G.0: Document all pages (MUST DO FIRST)
 │
G.1: Background Context System
 │
G.2: Global Background Canvas
 │
G.3: Root Layout Integration
 │   
 │   [At this point, background works on all pages]
 │
G.4: Page-specific configurations
 │
 ├── G.5: Record Page UI
 ├── G.6: Home Page UI
 ├── G.7: Library Page UI
 └── G.8: Story Detail Page UI
```

---

## 🚨 Critical Constraints

### Text Preservation

```
FOR EVERY PAGE:
- Document all text BEFORE making changes
- Verify all text AFTER making changes
- If any text is different, REVERT and fix
```

### Performance

```
Global Requirements:
- Lighthouse Performance > 85 on all pages
- 3D renders at 30fps minimum
- Page navigation < 300ms
- No layout shift from background
- Mobile must be smooth
```

### Accessibility

```
- Reduced motion: show static gradient
- Screen readers: background is decorative (aria-hidden)
- Focus states: must be visible over background
- Color contrast: content must be readable
```

---

## 🧪 Testing Protocol

### After Each Page Enhancement

```bash
# Performance audit
npx lighthouse http://localhost:3000/[page] --output=json

# Accessibility audit  
npx axe http://localhost:3000/[page]

# Visual regression (manual)
# Compare before/after screenshots
```

### Cross-Page Testing

```
[ ] Navigate Home → Record → Library → Story → Profile → Social
[ ] Background transitions smoothly between all pages
[ ] No Three.js re-initialization (check console)
[ ] No memory leaks (check Performance tab)
[ ] All pages load under 2s
```

---

## 🚀 Begin Implementation

**Start with Task G.0: Document All Pages**

This is absolutely critical. You must know exactly what text exists on every page before making any changes.

```
@task G.0
<begin>
Read every page file.
Document every piece of text.
Confirm understanding before proceeding.
</begin>
```