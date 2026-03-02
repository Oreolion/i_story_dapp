import React from "react";
import { View, Text } from "react-native";

type BadgeVariant = "default" | "success" | "warning" | "error" | "violet" | "info";

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  color?: string;
  bgColor?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: "rgba(148,163,184,0.15)", text: "#94a3b8" },
  success: { bg: "rgba(74,222,128,0.15)", text: "#4ade80" },
  warning: { bg: "rgba(251,191,36,0.15)", text: "#fbbf24" },
  error: { bg: "rgba(248,113,113,0.15)", text: "#f87171" },
  violet: { bg: "rgba(167,139,250,0.15)", text: "#a78bfa" },
  info: { bg: "rgba(96,165,250,0.15)", text: "#60a5fa" },
};

export function Badge({ text, variant = "default", color, bgColor }: BadgeProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <View
      style={{
        backgroundColor: bgColor ?? styles.bg,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}
    >
      <Text
        style={{
          color: color ?? styles.text,
          fontSize: 11,
          fontWeight: "600",
          textTransform: "capitalize",
        }}
      >
        {text}
      </Text>
    </View>
  );
}
