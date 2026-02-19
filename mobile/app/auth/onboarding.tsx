// Onboarding Screen - New user setup (name, username, email)
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { User, AtSign, Mail, ArrowRight } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useAuthStore } from "../../stores/authStore";

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
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="flex-1 px-6">
        <View className="py-8">
          <Text className="text-3xl font-bold text-white">Set Up Profile</Text>
          <Text className="mt-2 text-base text-slate-400">
            Tell us a bit about yourself
          </Text>
        </View>

        <View className="gap-4">
          <View className="flex-row items-center gap-3 rounded-xl bg-slate-800 px-4 py-3">
            <User size={20} color="#a78bfa" />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Full Name"
              className="flex-1 text-base text-white"
              placeholderTextColor="#64748b"
              autoFocus
            />
          </View>

          <View className="flex-row items-center gap-3 rounded-xl bg-slate-800 px-4 py-3">
            <AtSign size={20} color="#a78bfa" />
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              className="flex-1 text-base text-white"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
            />
          </View>

          <View className="flex-row items-center gap-3 rounded-xl bg-slate-800 px-4 py-3">
            <Mail size={20} color="#a78bfa" />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email (optional)"
              className="flex-1 text-base text-white"
              placeholderTextColor="#64748b"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className="mt-4 flex-row items-center justify-center gap-2 rounded-2xl bg-violet-600 p-4"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text className="text-lg font-semibold text-white">
                  Get Started
                </Text>
                <ArrowRight size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
