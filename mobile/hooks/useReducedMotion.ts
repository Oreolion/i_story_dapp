// Hook: Accessibility - reduced motion preference
// Uses react-native AccessibilityInfo instead of web matchMedia
import { useState, useEffect } from "react";
import { AccessibilityInfo } from "react-native";

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setPrefersReducedMotion);

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setPrefersReducedMotion
    );

    return () => subscription?.remove();
  }, []);

  return prefersReducedMotion;
}
