// Profile Screen - User info, achievements, settings
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  User,
  Settings,
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

export default function ProfileScreen() {
  const { user, isAuthenticated, logout, updateProfile, authMethod } =
    useAuthStore();
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-900">
        <User size={48} color="#64748b" />
        <Text className="mt-4 text-lg text-slate-400">Sign in to view profile</Text>
        <TouchableOpacity
          onPress={() => router.push("/auth/login")}
          className="mt-4 rounded-full bg-violet-600 px-6 py-3"
        >
          <Text className="font-semibold text-white">Sign In</Text>
        </TouchableOpacity>
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
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center justify-between py-4">
          <Text className="text-2xl font-bold text-white">Profile</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            {editing ? (
              <X size={24} color="#64748b" />
            ) : (
              <Edit3 size={24} color="#a78bfa" />
            )}
          </TouchableOpacity>
        </View>

        {/* Avatar & Name */}
        <View className="items-center rounded-2xl bg-slate-800 p-6">
          {user.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              className="h-24 w-24 rounded-full"
            />
          ) : (
            <View className="h-24 w-24 items-center justify-center rounded-full bg-violet-600">
              <Text className="text-3xl font-bold text-white">
                {user.name?.[0] || "?"}
              </Text>
            </View>
          )}

          {editing ? (
            <View className="mt-4 w-full gap-3">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Name"
                className="rounded-xl bg-slate-700 p-3 text-white"
                placeholderTextColor="#64748b"
              />
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Bio (max 500 chars)"
                multiline
                maxLength={500}
                className="min-h-[80] rounded-xl bg-slate-700 p-3 text-white"
                placeholderTextColor="#64748b"
              />
              <TouchableOpacity
                onPress={handleSave}
                className="flex-row items-center justify-center gap-2 rounded-xl bg-violet-600 p-3"
              >
                <Check size={18} color="#fff" />
                <Text className="font-semibold text-white">Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text className="mt-3 text-xl font-bold text-white">
                {user.name || "Anonymous"}
              </Text>
              {user.username && (
                <Text className="text-sm text-slate-400">{user.username}</Text>
              )}
              {user.bio && (
                <Text className="mt-2 text-center text-sm text-slate-300">
                  {user.bio}
                </Text>
              )}
            </>
          )}
        </View>

        {/* Connected Accounts */}
        <View className="mt-4 rounded-xl bg-slate-800 p-4">
          <Text className="mb-3 text-sm font-semibold text-slate-400">
            Connected Accounts
          </Text>

          {/* Wallet */}
          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center gap-3">
              <Wallet size={20} color="#a78bfa" />
              <Text className="text-white">Wallet</Text>
            </View>
            {isConnected && address ? (
              <Text className="font-mono text-xs text-green-400">
                {address.slice(0, 6)}...{address.slice(-4)}
              </Text>
            ) : (
              <TouchableOpacity onPress={() => open()}>
                <Text className="text-sm text-violet-400">Connect</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Email */}
          <View className="flex-row items-center justify-between border-t border-slate-700 py-2">
            <View className="flex-row items-center gap-3">
              <Mail size={20} color="#a78bfa" />
              <Text className="text-white">Email</Text>
            </View>
            <Text className="text-xs text-slate-400">
              {user.email || "Not linked"}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View className="mt-4 gap-3">
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center gap-3 rounded-xl bg-red-900/20 p-4"
          >
            <LogOut size={20} color="#ef4444" />
            <Text className="text-red-400">Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}
