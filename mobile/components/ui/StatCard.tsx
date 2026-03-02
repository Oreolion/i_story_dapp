import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { GlassCard } from "./GlassCard";

interface StatCardProps {
  value: number;
  label: string;
  color?: string;
  icon?: React.ReactNode;
}

export function StatCard({ value, label, color = "#fff", icon }: StatCardProps) {
  return (
    <GlassCard intensity="light" style={{ flex: 1, padding: 12, alignItems: "center" }}>
      {icon && <View style={{ marginBottom: 4 }}>{icon}</View>}
      <Text
        style={{
          fontSize: 22,
          fontWeight: "700",
          color,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: "#94a3b8",
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </GlassCard>
  );
}
