"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  setupVault as vaultSetup,
  unlockVault as vaultUnlock,
  lockVault as vaultLock,
  changePin as vaultChangePin,
  isVaultSetup as checkVaultSetup,
  isVaultUnlocked as checkVaultUnlocked,
} from "@/lib/vault";

export interface UseVaultResult {
  isSetup: boolean;
  isUnlocked: boolean;
  isLoading: boolean;
  error: string | null;
  setup: (pin: string) => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
  changePin: (oldPin: string, newPin: string) => Promise<void>;
}

export function useVault(): UseVaultResult {
  const { profile } = useAuth();
  const userId = profile?.id ?? null;

  const [isSetup, setIsSetup] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check vault status on mount and when userId changes
  useEffect(() => {
    if (!userId) {
      setIsSetup(false);
      setIsUnlocked(false);
      setIsLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const setup = await checkVaultSetup(userId);
        const unlocked = checkVaultUnlocked(userId);
        if (mounted) {
          setIsSetup(setup);
          setIsUnlocked(unlocked);
        }
      } catch (err) {
        console.error("[useVault] Status check failed:", err);
        if (mounted) setError("Failed to check vault status");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const setup = useCallback(
    async (pin: string) => {
      if (!userId) throw new Error("Not signed in");
      setError(null);
      setIsLoading(true);
      try {
        await vaultSetup(userId, pin);
        setIsSetup(true);
        setIsUnlocked(true);
      } catch (err: any) {
        const msg = err.message || "Vault setup failed";
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  const unlock = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!userId) throw new Error("Not signed in");
      setError(null);
      setIsLoading(true);
      try {
        const success = await vaultUnlock(userId, pin);
        if (success) {
          setIsUnlocked(true);
        } else {
          setError("Incorrect PIN");
        }
        return success;
      } catch (err: any) {
        const msg = err.message || "Vault unlock failed";
        setError(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  const lock = useCallback(() => {
    if (!userId) return;
    vaultLock(userId);
    setIsUnlocked(false);
    setError(null);
  }, [userId]);

  const changePin = useCallback(
    async (oldPin: string, newPin: string) => {
      if (!userId) throw new Error("Not signed in");
      setError(null);
      setIsLoading(true);
      try {
        await vaultChangePin(userId, oldPin, newPin);
      } catch (err: any) {
        const msg = err.message || "PIN change failed";
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  return {
    isSetup,
    isUnlocked,
    isLoading,
    error,
    setup,
    unlock,
    lock,
    changePin,
  };
}
