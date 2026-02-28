"use client";

import { useState } from "react";
import { useVault } from "@/app/hooks/useVault";
import { PinEntryModal } from "./PinEntryModal";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Unlock, KeyRound, Loader2 } from "lucide-react";

export function VaultSettings() {
  const { isSetup, isUnlocked, isLoading, error, setup, unlock, lock, changePin } = useVault();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinMode, setPinMode] = useState<"setup" | "unlock">("setup");
  const [showChangePin, setShowChangePin] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [changePinStep, setChangePinStep] = useState<"old" | "new">("old");
  const [changePinError, setChangePinError] = useState<string | null>(null);
  const [isChanging, setIsChanging] = useState(false);

  const handleSetup = () => {
    setPinMode("setup");
    setShowPinModal(true);
  };

  const handleUnlock = () => {
    setPinMode("unlock");
    setShowPinModal(true);
  };

  const handlePinSubmit = async (pin: string) => {
    if (pinMode === "setup") {
      await setup(pin);
    } else {
      const success = await unlock(pin);
      if (!success) throw new Error("Incorrect PIN");
    }
  };

  const handleChangePinSubmit = async (pin: string) => {
    if (changePinStep === "old") {
      setOldPin(pin);
      setChangePinStep("new");
      setChangePinError(null);
      // The modal will close; we re-open it for the new PIN
      setTimeout(() => setShowChangePin(true), 200);
      return;
    }

    // Step "new" — pin is the new PIN, oldPin is stored
    setIsChanging(true);
    setChangePinError(null);
    try {
      await changePin(oldPin, pin);
      setShowChangePin(false);
      setOldPin("");
      setChangePinStep("old");
    } catch (err: any) {
      setChangePinError(err.message || "PIN change failed");
      throw err;
    } finally {
      setIsChanging(false);
    }
  };

  const startChangePin = () => {
    setChangePinStep("old");
    setOldPin("");
    setChangePinError(null);
    setShowChangePin(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-gray-500">Checking vault status...</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5" /> Local Vault
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Encrypt stories locally on this device with a 6-digit PIN. Your PIN never leaves your device.
        </p>

        {!isSetup ? (
          /* Not set up */
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                <Shield className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Vault Status</p>
                <p className="text-xs text-gray-500">Not set up</p>
              </div>
            </div>
            <Button size="sm" onClick={handleSetup}>
              Set Up Vault
            </Button>
          </div>
        ) : isUnlocked ? (
          /* Unlocked */
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900/30">
                  <Unlock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Vault Unlocked</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Stories are being saved locally with encryption.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={startChangePin}
                  title="Change PIN"
                >
                  <KeyRound className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={lock}>
                  <Lock className="w-4 h-4 mr-1" />
                  Lock
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Locked */
          <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-100 dark:bg-amber-900/30">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Vault Locked</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Enter your PIN to enable local encryption.
                </p>
              </div>
            </div>
            <Button size="sm" onClick={handleUnlock}>
              <Unlock className="w-4 h-4 mr-1" />
              Unlock
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {/* Setup / Unlock PIN Modal */}
      <PinEntryModal
        open={showPinModal}
        onOpenChange={setShowPinModal}
        mode={pinMode}
        onSubmit={handlePinSubmit}
        error={error}
      />

      {/* Change PIN Modal */}
      <PinEntryModal
        open={showChangePin}
        onOpenChange={(open) => {
          setShowChangePin(open);
          if (!open) {
            setChangePinStep("old");
            setOldPin("");
            setChangePinError(null);
          }
        }}
        mode={changePinStep === "old" ? "unlock" : "setup"}
        onSubmit={handleChangePinSubmit}
        error={changePinError}
      />
    </>
  );
}
