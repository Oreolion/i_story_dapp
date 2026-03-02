import React from "react";
import {
  Text,
  Pressable,
  ActivityIndicator,
  View,
  type ViewStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { GRADIENTS, ANIMATION, GLASS } from "./theme";

type ButtonSize = "sm" | "md" | "lg";
type ButtonVariant = "solid" | "outline";

interface GradientButtonProps {
  onPress: () => void;
  title: string;
  gradient?: [string, string, ...string[]];
  icon?: React.ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const SIZE_CONFIG = {
  sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 13, borderRadius: 10 },
  md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 15, borderRadius: 14 },
  lg: { paddingVertical: 18, paddingHorizontal: 32, fontSize: 17, borderRadius: 18 },
} as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GradientButton({
  onPress,
  title,
  gradient = GRADIENTS.primary,
  icon,
  size = "md",
  variant = "solid",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: GradientButtonProps) {
  const scale = useSharedValue(1);
  const config = SIZE_CONFIG[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(ANIMATION.pressScale, {
      damping: ANIMATION.springConfig.damping,
      stiffness: ANIMATION.springConfig.stiffness,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: ANIMATION.springConfig.damping,
      stiffness: ANIMATION.springConfig.stiffness,
    });
  };

  const isDisabled = disabled || loading;

  if (variant === "outline") {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          animatedStyle,
          {
            backgroundColor: GLASS.light.background,
            borderWidth: 1.5,
            borderColor: gradient[0] as string,
            borderRadius: config.borderRadius,
            paddingVertical: config.paddingVertical,
            paddingHorizontal: config.paddingHorizontal,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: isDisabled ? 0.5 : 1,
            ...(fullWidth && { alignSelf: "stretch" as const }),
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={gradient[0] as string} size="small" />
        ) : (
          <>
            {icon}
            <Text
              style={{
                color: gradient[0] as string,
                fontSize: config.fontSize,
                fontWeight: "600",
              }}
            >
              {title}
            </Text>
          </>
        )}
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        animatedStyle,
        {
          borderRadius: config.borderRadius,
          overflow: "hidden",
          opacity: isDisabled ? 0.5 : 1,
          ...(fullWidth && { alignSelf: "stretch" as const }),
        },
        style,
      ]}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingVertical: config.paddingVertical,
          paddingHorizontal: config.paddingHorizontal,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            {icon}
            <Text
              style={{
                color: "#fff",
                fontSize: config.fontSize,
                fontWeight: "600",
              }}
            >
              {title}
            </Text>
          </>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}
