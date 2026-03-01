// Onboarding Screen - New user setup (name, username, email)
import React, { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { User, AtSign, Mail, ArrowRight } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useAuthStore } from "../../stores/authStore";
import {
  GlassCard,
  GradientButton,
  GradientText,
  AnimatedListItem,
  GRADIENTS,
} from "../../components/ui";

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuthStore();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !username.trim()) {
      Toast.show({ type: "error", text1: "Name and username are required" });
      return;
    }

    setLoading(true);
    try {
      await completeOnboarding({ name, username, email });
      Toast.show({ type: "success", text1: "Welcome to e-Story!" });
      router.replace("/");
    } catch {
      Toast.show({ type: "error", text1: "Setup failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <AnimatedListItem index={0}>
          <View style={{ paddingVertical: 32 }}>
            <GradientText
              text="Set Up Profile"
              gradient={GRADIENTS.primary}
              style={{ fontSize: 28 }}
            />
            <Text style={{ marginTop: 8, fontSize: 15, color: "#94a3b8" }}>
              Tell us a bit about yourself
            </Text>
          </View>
        </AnimatedListItem>

        <View style={{ gap: 16 }}>
          <AnimatedListItem index={1}>
            <GlassCard
              intensity="light"
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}
            >
              <User size={20} color="#a78bfa" />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Full Name"
                style={{ flex: 1, fontSize: 15, color: "#fff" }}
                placeholderTextColor="#64748b"
                autoFocus
              />
            </GlassCard>
          </AnimatedListItem>

          <AnimatedListItem index={2}>
            <GlassCard
              intensity="light"
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}
            >
              <AtSign size={20} color="#a78bfa" />
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                style={{ flex: 1, fontSize: 15, color: "#fff" }}
                placeholderTextColor="#64748b"
                autoCapitalize="none"
              />
            </GlassCard>
          </AnimatedListItem>

          <AnimatedListItem index={3}>
            <GlassCard
              intensity="light"
              style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}
            >
              <Mail size={20} color="#a78bfa" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email (optional)"
                style={{ flex: 1, fontSize: 15, color: "#fff" }}
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </GlassCard>
          </AnimatedListItem>

          <AnimatedListItem index={4}>
            <View style={{ marginTop: 8 }}>
              <GradientButton
                onPress={handleSubmit}
                title="Get Started"
                icon={<ArrowRight size={20} color="#fff" />}
                gradient={GRADIENTS.primary}
                size="lg"
                loading={loading}
                disabled={loading}
                fullWidth
              />
            </View>
          </AnimatedListItem>
        </View>
      </View>
    </SafeAreaView>
  );
}
