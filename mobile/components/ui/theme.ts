// Design tokens for glassmorphism + gradient UI system
import type { ColorValue } from "react-native";

export const GLASS = {
  light: {
    background: "rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.08)",
  },
  medium: {
    background: "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.10)",
  },
  heavy: {
    background: "rgba(255,255,255,0.12)",
    border: "rgba(255,255,255,0.15)",
  },
} as const;

type GradientColors = [string, string, ...string[]];

export const GRADIENTS: Record<string, GradientColors> = {
  primary: ["#7c3aed", "#6366f1"],
  accent: ["#6366f1", "#0ea5e9"],
  recording: ["#0b5ed7", "#7c3aed"],
  success: ["#059669", "#10b981"],
  error: ["#dc2626", "#ef4444"],
  hero: ["#1e1b4b", "#0f172a", "#0f172a"],
  warm: ["#f59e0b", "#ef4444"],
  tabIndicator: ["#7c3aed", "#a78bfa"],
};

export const SHADOWS = {
  glow: {
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  button: {
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
} as const;

export const ANIMATION = {
  staggerDelay: 80,
  maxStagger: 10,
  enterDuration: 400,
  springConfig: {
    damping: 15,
    stiffness: 150,
  },
  pressScale: 0.96,
} as const;
