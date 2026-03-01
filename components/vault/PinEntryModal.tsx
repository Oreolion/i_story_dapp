"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert } from "lucide-react";

export interface PinEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "setup" | "unlock";
  onSubmit: (pin: string) => Promise<void>;
  error?: string | null;
}

const PIN_LENGTH = 6;

export function PinEntryModal({
  open,
  onOpenChange,
  mode,
  onSubmit,
  error: externalError,
}: PinEntryModalProps) {
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [confirmDigits, setConfirmDigits] = useState<string[]>(
    Array(PIN_LENGTH).fill("")
  );
  const [step, setStep] = useState<"enter" | "confirm">(
    mode === "setup" ? "enter" : "enter"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setDigits(Array(PIN_LENGTH).fill(""));
      setConfirmDigits(Array(PIN_LENGTH).fill(""));
      setStep(mode === "setup" ? "enter" : "enter");
      setError(null);
      setIsSubmitting(false);
      // Focus first input after dialog animation
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open, mode]);

  // Show external errors
  useEffect(() => {
    if (externalError) setError(externalError);
  }, [externalError]);

  const handleDigitChange = useCallback(
    (
      index: number,
      value: string,
      isConfirm: boolean
    ) => {
      const digit = value.replace(/\D/g, "").slice(-1);
      const setter = isConfirm ? setConfirmDigits : setDigits;
      const refs = isConfirm ? confirmRefs : inputRefs;

      setter((prev) => {
        const updated = [...prev];
        updated[index] = digit;
        return updated;
      });

      setError(null);

      // Auto-focus next input
      if (digit && index < PIN_LENGTH - 1) {
        refs.current[index + 1]?.focus();
      }
    },
    []
  );

  const handleKeyDown = useCallback(
    (
      index: number,
      e: React.KeyboardEvent<HTMLInputElement>,
      isConfirm: boolean
    ) => {
      const refs = isConfirm ? confirmRefs : inputRefs;
      const currentDigits = isConfirm ? confirmDigits : digits;

      if (e.key === "Backspace" && !currentDigits[index] && index > 0) {
        refs.current[index - 1]?.focus();
      }
    },
    [digits, confirmDigits]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent, isConfirm: boolean) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, PIN_LENGTH);
      if (!pasted) return;

      const setter = isConfirm ? setConfirmDigits : setDigits;
      const refs = isConfirm ? confirmRefs : inputRefs;

      setter(
        Array.from({ length: PIN_LENGTH }, (_, i) => pasted[i] || "")
      );

      // Focus the last filled input or the next empty one
      const focusIdx = Math.min(pasted.length, PIN_LENGTH - 1);
      refs.current[focusIdx]?.focus();
    },
    []
  );

  const getPin = (d: string[]) => d.join("");
  const isPinComplete = (d: string[]) => d.every((v) => v !== "");

  const handleSubmit = async () => {
    const pin = getPin(digits);

    if (mode === "setup" && step === "enter") {
      if (!isPinComplete(digits)) return;
      setStep("confirm");
      setTimeout(() => confirmRefs.current[0]?.focus(), 100);
      return;
    }

    if (mode === "setup" && step === "confirm") {
      if (!isPinComplete(confirmDigits)) return;
      const confirmPin = getPin(confirmDigits);
      if (pin !== confirmPin) {
        setError("PINs don't match. Try again.");
        setConfirmDigits(Array(PIN_LENGTH).fill(""));
        setTimeout(() => confirmRefs.current[0]?.focus(), 100);
        return;
      }
    }

    if (mode === "unlock" && !isPinComplete(digits)) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(pin);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPinInputs = (
    values: string[],
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    isConfirm: boolean
  ) => (
    <div className="flex justify-center gap-2">
      {values.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleDigitChange(i, e.target.value, isConfirm)}
          onKeyDown={(e) => handleKeyDown(i, e, isConfirm)}
          onPaste={(e) => handlePaste(e, isConfirm)}
          disabled={isSubmitting}
          className="w-11 h-14 text-center text-2xl font-mono rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-transparent focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors disabled:opacity-50"
          aria-label={`PIN digit ${i + 1}`}
        />
      ))}
    </div>
  );

  const title =
    mode === "setup"
      ? step === "enter"
        ? "Create Vault PIN"
        : "Confirm Your PIN"
      : "Unlock Vault";

  const description =
    mode === "setup"
      ? step === "enter"
        ? "Choose a 6-digit PIN to protect your local vault. This PIN never leaves your device."
        : "Enter your PIN again to confirm."
      : "Enter your 6-digit PIN to access your local vault.";

  const canSubmit =
    mode === "setup" && step === "confirm"
      ? isPinComplete(digits) && isPinComplete(confirmDigits)
      : isPinComplete(digits);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-500" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {mode === "setup" && step === "confirm" ? (
            renderPinInputs(confirmDigits, confirmRefs, true)
          ) : (
            renderPinInputs(digits, inputRefs, false)
          )}

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {mode === "setup" ? "Setting up..." : "Unlocking..."}
              </>
            ) : mode === "setup" && step === "enter" ? (
              "Next"
            ) : mode === "setup" ? (
              "Create Vault"
            ) : (
              "Unlock"
            )}
          </Button>

          {mode === "setup" && step === "confirm" && (
            <Button
              variant="ghost"
              onClick={() => {
                setStep("enter");
                setConfirmDigits(Array(PIN_LENGTH).fill(""));
                setError(null);
                setTimeout(() => inputRefs.current[0]?.focus(), 100);
              }}
              disabled={isSubmitting}
              className="w-full"
            >
              Back
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
