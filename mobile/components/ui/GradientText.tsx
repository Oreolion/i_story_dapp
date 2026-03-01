import React from "react";
import { Text, type TextStyle } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { GRADIENTS } from "./theme";

interface GradientTextProps {
  text: string;
  gradient?: [string, string, ...string[]];
  style?: TextStyle;
}

export function GradientText({
  text,
  gradient = GRADIENTS.primary,
  style,
}: GradientTextProps) {
  return (
    <MaskedView
      maskElement={
        <Text style={[{ fontSize: 32, fontWeight: "bold" }, style]}>
          {text}
        </Text>
      }
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[{ fontSize: 32, fontWeight: "bold", opacity: 0 }, style]}>
          {text}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}
