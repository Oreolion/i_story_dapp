// Hook: CRE verified metrics - check on-chain verification status
import { useState, useEffect, useRef } from "react";
import { apiPost } from "../lib/api";

export interface VerifiedMetrics {
  significance_score: number;
  emotional_depth: number;
  quality_score: number;
  word_count: number;
  verified_themes: string[];
  cre_attestation_id: string | null;
  on_chain_tx_hash: string | null;
}

export interface VerifiedProof {
  qualityTier: number;
  meetsQualityThreshold: boolean;
  metricsHash?: string;
  attestationId?: string;
  verifiedAt?: number;
}

interface CRECheckResponse {
  verified: boolean;
  isAuthor?: boolean;
  legacy?: boolean;
  metrics?: VerifiedMetrics;
  proof?: VerifiedProof;
}

interface UseVerifiedMetricsResult {
  metrics: VerifiedMetrics | null;
  proof: VerifiedProof | null;
  isVerified: boolean;
  isAuthor: boolean;
  isLoading: boolean;
  error: string | null;
  triggerVerification: () => Promise<void>;
}

const EMOTIONAL_DEPTH_LABELS: Record<number, string> = {
  1: "Surface",
  2: "Mild",
  3: "Moderate",
  4: "Deep",
  5: "Profound",
};

export function getEmotionalDepthLabel(depth: number): string {
  return EMOTIONAL_DEPTH_LABELS[depth] || "Moderate";
}

export function useVerifiedMetrics(storyId: string | undefined): UseVerifiedMetricsResult {
  const [metrics, setMetrics] = useState<VerifiedMetrics | null>(null);
  const [proof, setProof] = useState<VerifiedProof | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkMetrics = async () => {
    if (!storyId) return;
    try {
      const res = await apiPost<CRECheckResponse>("/api/cre/check", { storyId });

      if (res.ok && res.data) {
        setIsVerified(res.data.verified);
        setIsAuthor(res.data.isAuthor ?? false);

        if (res.data.verified) {
          if (res.data.metrics) {
            setMetrics(res.data.metrics);
          }
          if (res.data.proof) {
            setProof(res.data.proof);
          }
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

  return { metrics, proof, isVerified, isAuthor, isLoading, error, triggerVerification };
}
