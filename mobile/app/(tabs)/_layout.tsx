// Tab Layout - Bottom navigation with 6 tabs
// Order: Home | Record | Tracker | Archive | Community | Profile
import React from "react";
import { Tabs } from "expo-router";
import { View } from "react-native";
import {
  Home,
  Mic,
  CalendarCheck,
  Archive,
  Users,
  User,
} from "lucide-react-native";
import { useAuthStore } from "../../stores/authStore";

export default function TabLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopColor: "#1e293b",
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#a78bfa",
        tabBarInactiveTintColor: "#64748b",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: "Record",
          tabBarIcon: ({ color, size }) => (
            <View
              className="rounded-full bg-primary p-2"
              style={
                isAuthenticated
                  ? { backgroundColor: "#7c3aed" }
                  : { backgroundColor: "#374151" }
              }
            >
              <Mic size={size - 4} color="#fff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tracker"
        options={{
          title: "Tracker",
          tabBarIcon: ({ color, size }) => (
            <CalendarCheck size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Archive",
          tabBarIcon: ({ color, size }) => (
            <Archive size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: "Community",
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
