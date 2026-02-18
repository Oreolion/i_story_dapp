// Hook: Notifications CRUD + push token registration
import { useState, useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import type { Notification } from "../types";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await apiGet<{ notifications: Notification[] }>("/api/notifications");
      if (res.ok && res.data?.notifications) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.notifications.filter((n) => !n.is_read).length);
      }
    } catch (err) {
      console.error("[useNotifications] Fetch failed:", err);
    }
  }, [isAuthenticated]);

  const markAsRead = async (id: string) => {
    await apiPut("/api/notifications", { id, is_read: true });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const deleteNotification = async (id: string) => {
    await apiDelete("/api/notifications", { id });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const registerPushToken = async () => {
    if (!Device.isDevice) return;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") return;

      const tokenData = await Notifications.getExpoPushTokenAsync();
      // Send token to backend for push notifications
      await apiPost("/api/notifications", {
        type: "push_token",
        token: tokenData.data,
        platform: Platform.OS,
      });
    } catch (err) {
      console.error("[useNotifications] Push token registration failed:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      registerPushToken();
      // Poll every 30 seconds
      pollRef.current = setInterval(fetchNotifications, 30000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isAuthenticated, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    deleteNotification,
  };
}
