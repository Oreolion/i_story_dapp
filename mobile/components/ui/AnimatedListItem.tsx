import React from "react";
import Animated, { FadeInUp } from "react-native-reanimated";
import { ANIMATION } from "./theme";

interface AnimatedListItemProps {
  index: number;
  children: React.ReactNode;
}

export function AnimatedListItem({ index, children }: AnimatedListItemProps) {
  const cappedIndex = Math.min(index, ANIMATION.maxStagger);
  const delay = cappedIndex * ANIMATION.staggerDelay;

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(ANIMATION.enterDuration).springify()}
    >
      {children}
    </Animated.View>
  );
}
