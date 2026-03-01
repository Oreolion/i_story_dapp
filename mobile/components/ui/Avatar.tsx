import React from "react";
import { View, Text, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GRADIENTS } from "./theme";

type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: AvatarSize;
  withGradientBorder?: boolean;
}

const SIZE_MAP: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 96,
};

const FONT_SIZE_MAP: Record<AvatarSize, number> = {
  sm: 13,
  md: 16,
  lg: 22,
  xl: 36,
};

export function Avatar({
  uri,
  name,
  size = "md",
  withGradientBorder = false,
}: AvatarProps) {
  const dim = SIZE_MAP[size];
  const fontSize = FONT_SIZE_MAP[size];
  const borderWidth = size === "xl" ? 3 : 2;
  const initial = name?.[0]?.toUpperCase() || "?";

  const avatarContent = uri ? (
    <Image
      source={{ uri }}
      style={{
        width: dim,
        height: dim,
        borderRadius: dim / 2,
      }}
    />
  ) : (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: dim / 2,
        backgroundColor: "#7c3aed",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize, fontWeight: "700", color: "#fff" }}>
        {initial}
      </Text>
    </View>
  );

  if (!withGradientBorder) return avatarContent;

  const outerDim = dim + borderWidth * 2 + 4;
  return (
    <LinearGradient
      colors={GRADIENTS.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: outerDim,
        height: outerDim,
        borderRadius: outerDim / 2,
        alignItems: "center",
        justifyContent: "center",
        padding: borderWidth + 2,
      }}
    >
      <View
        style={{
          backgroundColor: "#0f172a",
          borderRadius: (dim + 4) / 2,
          padding: 2,
        }}
      >
        {avatarContent}
      </View>
    </LinearGradient>
  );
}
