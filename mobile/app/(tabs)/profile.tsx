// Profile Screen - User info, achievements, settings
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { router } from "expo-router";
import {
  User,
  LogOut,
  Wallet,
  Mail,
  Edit3,
  Check,
  X,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit-react-native";
import { useAuthStore } from "../../stores/authStore";
import {
  GlassCard,
  GradientButton,
  Avatar,
  GradientText,
  AnimatedListItem,
  SectionHeader,
  GRADIENTS,
  ANIMATION,
} from "../../components/ui";

export default function ProfileScreen() {
  const { user, isAuthenticated, logout, updateProfile } =
    useAuthStore();
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");

  const signOutScale = useSharedValue(1);
  const signOutAnimated = useAnimatedStyle(() => ({
    transform: [{ scale: signOutScale.value }],
  }));

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a", alignItems: "center", justifyContent: "center" }}>
        <GlassCard intensity="medium" style={{ padding: 32, alignItems: "center", marginHorizontal: 24 }}>
          <User size={48} color="#64748b" />
          <Text style={{ marginTop: 16, fontSize: 17, color: "#94a3b8" }}>Sign in to view profile</Text>
          <View style={{ marginTop: 16 }}>
            <GradientButton
              onPress={() => router.push("/auth/login")}
              title="Sign In"
              gradient={GRADIENTS.primary}
            />
          </View>
        </GlassCard>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    try {
      await updateProfile({ name, bio });
      setEditing(false);
      Toast.show({ type: "success", text1: "Profile updated" });
    } catch {
      Toast.show({ type: "error", text1: "Update failed" });
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <AnimatedListItem index={0}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#fff" }}>Profile</Text>
            <TouchableOpacity onPress={() => setEditing(!editing)}>
              {editing ? (
                <X size={24} color="#64748b" />
              ) : (
                <Edit3 size={24} color="#a78bfa" />
              )}
            </TouchableOpacity>
          </View>
        </AnimatedListItem>

        {/* Avatar & Name */}
        <AnimatedListItem index={1}>
          <GlassCard intensity="medium" style={{ padding: 24, alignItems: "center" }}>
            <Avatar
              uri={user.avatar}
              name={user.name}
              size="xl"
              withGradientBorder
            />

            {editing ? (
              <View style={{ marginTop: 16, width: "100%", gap: 12 }}>
                <GlassCard intensity="light" style={{ padding: 0 }}>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Name"
                    style={{ padding: 14, fontSize: 15, color: "#fff" }}
                    placeholderTextColor="#64748b"
                  />
                </GlassCard>
                <GlassCard intensity="light" style={{ padding: 0 }}>
                  <TextInput
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Bio (max 500 chars)"
                    multiline
                    maxLength={500}
                    style={{ minHeight: 80, padding: 14, fontSize: 15, color: "#fff", textAlignVertical: "top" }}
                    placeholderTextColor="#64748b"
                  />
                </GlassCard>
                <GradientButton
                  onPress={handleSave}
                  title="Save"
                  icon={<Check size={18} color="#fff" />}
                  gradient={GRADIENTS.primary}
                  fullWidth
                />
              </View>
            ) : (
              <>
                <View style={{ marginTop: 12 }}>
                  <GradientText
                    text={user.name || "Anonymous"}
                    gradient={GRADIENTS.primary}
                    style={{ fontSize: 22, textAlign: "center" }}
                  />
                </View>
                {user.username && (
                  <Text style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>
                    @{user.username}
                  </Text>
                )}
                {user.bio && (
                  <Text style={{ marginTop: 8, textAlign: "center", fontSize: 14, color: "#cbd5e1", lineHeight: 20 }}>
                    {user.bio}
                  </Text>
                )}
              </>
            )}
          </GlassCard>
        </AnimatedListItem>

        {/* Connected Accounts */}
        <AnimatedListItem index={2}>
          <View style={{ marginTop: 16 }}>
            <SectionHeader title="Connected Accounts" />
            <GlassCard intensity="light" style={{ padding: 16 }}>
              {/* Wallet */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Wallet size={20} color="#a78bfa" />
                  <Text style={{ color: "#fff", fontSize: 15 }}>Wallet</Text>
                </View>
                {isConnected && address ? (
                  <Text style={{ fontFamily: "monospace", fontSize: 12, color: "#4ade80" }}>
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </Text>
                ) : (
                  <GradientButton
                    onPress={() => open()}
                    title="Connect"
                    variant="outline"
                    size="sm"
                    gradient={GRADIENTS.primary}
                  />
                )}
              </View>

              {/* Email */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 8,
                  marginTop: 4,
                  borderTopWidth: 1,
                  borderTopColor: "rgba(255,255,255,0.06)",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Mail size={20} color="#a78bfa" />
                  <Text style={{ color: "#fff", fontSize: 15 }}>Email</Text>
                </View>
                <Text style={{ fontSize: 12, color: "#94a3b8" }}>
                  {user.email || "Not linked"}
                </Text>
              </View>
            </GlassCard>
          </View>
        </AnimatedListItem>

        {/* Sign Out */}
        <AnimatedListItem index={3}>
          <View style={{ marginTop: 16 }}>
            <TouchableOpacity
              onPress={handleLogout}
              onPressIn={() => {
                signOutScale.value = withSpring(0.97, {
                  damping: ANIMATION.springConfig.damping,
                  stiffness: ANIMATION.springConfig.stiffness,
                });
              }}
              onPressOut={() => {
                signOutScale.value = withSpring(1, {
                  damping: ANIMATION.springConfig.damping,
                  stiffness: ANIMATION.springConfig.stiffness,
                });
              }}
              activeOpacity={0.8}
            >
              <Animated.View style={signOutAnimated}>
                <GlassCard
                  intensity="light"
                  style={{
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    borderColor: "rgba(239,68,68,0.2)",
                  }}
                >
                  <LogOut size={20} color="#ef4444" />
                  <Text style={{ color: "#f87171", fontSize: 15, fontWeight: "500" }}>Sign Out</Text>
                </GlassCard>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </AnimatedListItem>
      </ScrollView>
    </SafeAreaView>
  );
}
