import React, { useEffect } from "react";
import { View, type DimensionValue } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

type SkeletonVariant = "card" | "line" | "circle" | "title";

interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  width?: DimensionValue;
  height?: number;
  count?: number;
}

const VARIANT_STYLES: Record<SkeletonVariant, { width: DimensionValue; height: number; borderRadius: number }> = {
  card: { width: "100%", height: 120, borderRadius: 16 },
  line: { width: "100%", height: 14, borderRadius: 7 },
  circle: { width: 48, height: 48, borderRadius: 24 },
  title: { width: "60%", height: 20, borderRadius: 10 },
};

function SkeletonItem({ variant = "card", width, height }: Omit<SkeletonLoaderProps, "count">) {
  const opacity = useSharedValue(0.3);
  const defaults = VARIANT_STYLES[variant];

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View
      style={{
        width: width ?? defaults.width,
        height: height ?? defaults.height,
        borderRadius: defaults.borderRadius,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={[
          {
            flex: 1,
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: defaults.borderRadius,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

export function SkeletonLoader({ variant = "card", width, height, count = 1 }: SkeletonLoaderProps) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonItem key={i} variant={variant} width={width} height={height} />
      ))}
    </View>
  );
}
