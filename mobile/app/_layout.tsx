// Root Layout - Provider stack + polyfills
// CRITICAL: polyfills MUST be the first import
import "../polyfills";
import "../global.css";

import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppKit } from "@reown/appkit-react-native";
import Toast from "react-native-toast-message";

import { wagmiAdapter } from "../lib/wagmi.config";
import { useAuthStore } from "../stores/authStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <AuthInitializer>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: "#0f172a" },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="story/[storyId]"
                  options={{ headerShown: false, presentation: "card" }}
                />
                <Stack.Screen
                  name="book/[bookId]"
                  options={{ headerShown: false, presentation: "card" }}
                />
                <Stack.Screen
                  name="auth/login"
                  options={{ headerShown: false, presentation: "modal" }}
                />
                <Stack.Screen
                  name="auth/onboarding"
                  options={{ headerShown: false, presentation: "modal" }}
                />
              </Stack>
              <AppKit />
              <Toast />
              <StatusBar style="light" />
            </AuthInitializer>
          </QueryClientProvider>
        </WagmiProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
