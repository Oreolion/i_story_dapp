import React from "react";
import { View, type ViewProps } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { GLASS } from "./theme";

type GlassIntensity = "light" | "medium" | "heavy";

interface GlassCardProps extends ViewProps {
  intensity?: GlassIntensity;
  withBorder?: boolean;
  animated?: boolean;
  children: React.ReactNode;
}

export function GlassCard({
  intensity = "light",
  withBorder = true,
  animated = false,
  children,
  style,
  ...props
}: GlassCardProps) {
  const glassStyle = GLASS[intensity];

  const cardStyle = [
    {
      backgroundColor: glassStyle.background,
      borderRadius: 16,
      ...(withBorder && {
        borderWidth: 1,
        borderColor: glassStyle.border,
      }),
    },
    style,
  ];

  if (animated) {
    return (
      <Animated.View entering={FadeIn.duration(300)} style={cardStyle} {...props}>
        {children}
      </Animated.View>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
}
