"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";

// Full metrics — only available to the story author
export interface VerifiedMetrics {
  significance_score: number;
  emotional_depth: number;
  quality_score: number;
  word_count: number;
  verified_themes: string[];
  cre_attestation_id: string | null;
  on_chain_tx_hash: string | null;
}

// Minimal proof — available to everyone
export interface VerifiedMetricsProof {
  qualityTier: number; // 1-5
  meetsQualityThreshold: boolean;
  metricsHash?: string;
  attestationId?: string;
  verifiedAt?: number;
}

export interface UseVerifiedMetricsResult {
  metrics: VerifiedMetrics | null;     // Full data, author only
  proof: VerifiedMetricsProof | null;  // Minimal proof, always available
  isPending: boolean;
  isVerified: boolean;
  isAuthor: boolean;
  error: string | null;
  refetch: () => void;
}

export function useVerifiedMetrics(storyId: string | null): UseVerifiedMetricsResult {
  const { getAccessToken } = useAuth();
  const [metrics, setMetrics] = useState<VerifiedMetrics | null>(null);
  const [proof, setProof] = useState<VerifiedMetricsProof | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!storyId) return;

    try {
      setError(null);

      const token = await getAccessToken();
      if (!token) return;

      const res = await fetch("/api/cre/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ storyId }),
      });

      if (!res.ok) {
        if (res.status !== 401) {
          setError("Failed to load verification status");
        }
        return;
      }

      const data = await res.json();

      if (data.verified) {
        setIsAuthor(!!data.isAuthor);

        // Set proof (always available when verified)
        if (data.proof) {
          setProof({
            qualityTier: data.proof.qualityTier,
            meetsQualityThreshold: data.proof.meetsQualityThreshold,
            metricsHash: data.proof.metricsHash,
            attestationId: data.proof.attestationId,
            verifiedAt: data.proof.verifiedAt,
          });
        }

        // Set full metrics (only for author)
        if (data.metrics) {
          setMetrics({
            significance_score: data.metrics.significance_score,
            emotional_depth: data.metrics.emotional_depth,
            quality_score: data.metrics.quality_score,
            word_count: data.metrics.word_count,
            verified_themes: data.metrics.verified_themes || [],
            cre_attestation_id: data.metrics.cre_attestation_id || null,
            on_chain_tx_hash: data.metrics.on_chain_tx_hash || null,
          });
        }

        setIsPending(false);
        // Stop polling — we have results
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } else {
        // Not verified — check if pending by looking for a pending state
        // The trigger route sets this, so if not verified, poll a few times
        setIsPending(false);
        setMetrics(null);
        setProof(null);
      }
    } catch (err) {
      console.error("[useVerifiedMetrics] Error:", err);
      setError("Failed to load verification status");
    }
  }, [storyId, getAccessToken]);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Poll every 10 seconds while pending
  useEffect(() => {
    if (isPending && !pollIntervalRef.current) {
      pollIntervalRef.current = setInterval(fetchMetrics, 10000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isPending, fetchMetrics]);

  // Expose a startPolling function for when trigger is called
  const startPolling = useCallback(() => {
    setIsPending(true);
  }, []);

  return {
    metrics,
    proof,
    isPending,
    isVerified: !!proof,
    isAuthor,
    error,
    refetch: () => {
      startPolling();
      fetchMetrics();
    },
  };
}
