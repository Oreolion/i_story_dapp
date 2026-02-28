"use client";

import { useVault } from "@/app/hooks/useVault";
import { PinEntryModal } from "./PinEntryModal";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface VaultGuardProps {
  children: React.ReactNode;
  /** If true, renders children even when vault is not set up */
  optional?: boolean;
  /** Fallback UI when vault is not set up (only used when optional is false) */
  fallback?: React.ReactNode;
}

export function VaultGuard({
  children,
  optional = false,
  fallback,
}: VaultGuardProps) {
  const { isSetup, isUnlocked, isLoading, error, setup, unlock } = useVault();
  const [showPin, setShowPin] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // Vault not set up
  if (!isSetup) {
    if (optional) {
      return <>{children}</>;
    }

    return (
      fallback ?? (
        <div className="text-center space-y-4 py-12">
          <Lock className="w-12 h-12 mx-auto text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Vault Not Set Up
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Set up your local vault in Profile Settings to enable encrypted
            local storage.
          </p>
        </div>
      )
    );
  }

  // Vault set up but locked — prompt for PIN
  if (!isUnlocked) {
    return (
      <>
        <div className="text-center space-y-4 py-12">
          <Lock className="w-12 h-12 mx-auto text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Vault Locked
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your PIN to access local stories.
          </p>
          <Button onClick={() => setShowPin(true)} className="mt-2">
            Unlock Vault
          </Button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <PinEntryModal
          open={showPin}
          onOpenChange={setShowPin}
          mode="unlock"
          onSubmit={async (pin) => {
            const success = await unlock(pin);
            if (!success) throw new Error("Incorrect PIN");
          }}
          error={error}
        />
      </>
    );
  }

  // Unlocked — render children
  return <>{children}</>;
}
