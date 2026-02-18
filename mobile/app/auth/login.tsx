// Login Screen - Wallet connect + Google OAuth
import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Wallet, X } from "lucide-react-native";
import { useAppKit } from "@reown/appkit-react-native";
import { useAccount, useSignMessage } from "wagmi";
import Toast from "react-native-toast-message";
import { useAuthStore } from "../../stores/authStore";

export default function LoginScreen() {
  const { loginWithWallet } = useAuthStore();
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [loading, setLoading] = useState(false);

  const handleWalletLogin = async () => {
    if (!isConnected) {
      open();
      return;
    }

    if (!address) return;

    setLoading(true);
    try {
      await loginWithWallet(address, async (message: string) => {
        return await signMessageAsync({ message });
      });
      Toast.show({ type: "success", text1: "Signed in!" });
      router.replace("/");
    } catch (err) {
      console.error("[Login] Wallet login failed:", err);
      Toast.show({ type: "error", text1: "Login failed. Try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="flex-1 px-6">
        {/* Close button */}
        <View className="flex-row justify-end py-4">
          <TouchableOpacity onPress={() => router.back()}>
            <X size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View className="flex-1 items-center justify-center">
          <Text className="text-4xl font-bold text-white">e-Story</Text>
          <Text className="mt-2 text-center text-base text-slate-400">
            Your voice. Your story.{"\n"}On-chain forever.
          </Text>

          <View className="mt-12 w-full gap-4">
            {/* Wallet Connect */}
            <TouchableOpacity
              onPress={handleWalletLogin}
              disabled={loading}
              className="flex-row items-center justify-center gap-3 rounded-2xl bg-violet-600 p-4"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Wallet size={22} color="#fff" />
                  <Text className="text-lg font-semibold text-white">
                    {isConnected ? "Sign In with Wallet" : "Connect Wallet"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center gap-3">
              <View className="h-px flex-1 bg-slate-700" />
              <Text className="text-sm text-slate-500">or</Text>
              <View className="h-px flex-1 bg-slate-700" />
            </View>

            {/* Google Sign In */}
            <TouchableOpacity
              onPress={() => {
                Toast.show({
                  type: "info",
                  text1: "Google sign-in coming soon",
                });
              }}
              className="flex-row items-center justify-center gap-3 rounded-2xl bg-white p-4"
            >
              <Text className="text-lg font-semibold text-slate-900">
                Continue with Google
              </Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text className="mt-8 text-center text-xs text-slate-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
