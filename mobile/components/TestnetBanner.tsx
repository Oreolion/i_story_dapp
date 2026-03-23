// Testnet disclaimer banner — shown on blockchain-related screens
import React from "react";
import { View, Text } from "react-native";
import { AlertTriangle } from "lucide-react-native";

export function TestnetBanner() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "rgba(251, 191, 36, 0.1)",
        borderWidth: 1,
        borderColor: "rgba(251, 191, 36, 0.2)",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 12,
      }}
    >
      <AlertTriangle size={16} color="#fbbf24" />
      <Text style={{ flex: 1, fontSize: 12, color: "#fbbf24", lineHeight: 16 }}>
        Base Sepolia Testnet — No real assets involved
      </Text>
    </View>
  );
}
