"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";

interface SubscriptionStatus {
  plan: string;
  active: boolean;
  expires_at: string | null;
}

interface PaymentInfo {
  address: string;
  amount: number;
  currency: string;
  plan: string;
  network: string;
  note: string;
}

export function useSubscription() {
  const { profile, getAccessToken } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    plan: "free",
    active: false,
    expires_at: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  const fetchStatus = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;

    try {
      const res = await fetch("/api/payment/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // Silent fail — default to free
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (profile?.id) {
      fetchStatus();
    }
  }, [profile?.id, fetchStatus]);

  const subscribe = async (plan: string) => {
    const token = await getAccessToken();
    if (!token) throw new Error("Not authenticated");

    setIsCreatingPayment(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create payment");

      setPaymentInfo(data);
      return data;
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const clearPaymentInfo = () => setPaymentInfo(null);

  return {
    status,
    isLoading,
    paymentInfo,
    isCreatingPayment,
    subscribe,
    clearPaymentInfo,
    refreshStatus: fetchStatus,
  };
}
