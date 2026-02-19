// Hook: CRE verified metrics - check on-chain verification status
import { useState, useEffect, useRef } from "react";
import { apiPost } from "../lib/api";

interface VerifiedMetrics {
  significanceScore: number;
  emotionalDepth: number;
  qualityScore: number;
  wordCount: number;
  themes: string[];
  attestationId: string;
  verifiedAt: number;
}

interface UseVerifiedMetricsResult {
  metrics: VerifiedMetrics | null;
  isVerified: boolean;
  isLoading: boolean;
  error: string | null;
  triggerVerification: () => Promise<void>;
}

export function useVerifiedMetrics(storyId: string | undefined): UseVerifiedMetricsResult {
  const [metrics, setMetrics] = useState<VerifiedMetrics | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkMetrics = async () => {
    if (!storyId) return;
    try {
      const res = await apiPost<{
        verified: boolean;
        metrics: VerifiedMetrics;
      }>("/api/cre/check", { storyId });

      if (res.ok && res.data) {
        setIsVerified(res.data.verified);
        if (res.data.verified && res.data.metrics) {
          setMetrics(res.data.metrics);
          // Stop polling once verified
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      }
    } catch (err) {
      console.error("[useVerifiedMetrics] Check failed:", err);
    }
  };

  const triggerVerification = async () => {
    if (!storyId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiPost("/api/cre/trigger", { storyId });
      if (!res.ok) {
        throw new Error(res.error || "Verification failed");
      }
      // Start polling every 10 seconds
      pollRef.current = setInterval(checkMetrics, 10000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (storyId) {
      checkMetrics();
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [storyId]);

  return { metrics, isVerified, isLoading, error, triggerVerification };
}
