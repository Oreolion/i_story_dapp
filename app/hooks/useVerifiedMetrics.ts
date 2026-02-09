"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useBrowserSupabase } from "./useBrowserSupabase";

interface VerifiedMetrics {
  significance_score: number;
  emotional_depth: number;
  quality_score: number;
  word_count: number;
  verified_themes: string[];
  cre_attestation_id: string | null;
  cre_workflow_run_id: string | null;
  on_chain_tx_hash: string | null;
  on_chain_block_number: number | null;
}

interface UseVerifiedMetricsResult {
  metrics: VerifiedMetrics | null;
  isPending: boolean;
  isVerified: boolean;
  error: string | null;
  refetch: () => void;
}

export function useVerifiedMetrics(storyId: string | null): UseVerifiedMetricsResult {
  const supabase = useBrowserSupabase();
  const [metrics, setMetrics] = useState<VerifiedMetrics | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!supabase || !storyId) return;

    try {
      setError(null);

      // Step 1: Check Supabase cache first (fast)
      const { data: metricsData, error: metricsError } = await supabase
        .from("verified_metrics")
        .select("*")
        .eq("story_id", storyId)
        .maybeSingle();

      if (metricsError) {
        console.error("[useVerifiedMetrics] Metrics fetch error:", metricsError);
        setError("Failed to load metrics");
        return;
      }

      if (metricsData) {
        setMetrics(metricsData);
        setIsPending(false);
        // Stop polling — we have results
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        return;
      }

      // Step 2: Check if verification is pending
      const { data: logData } = await supabase
        .from("verification_logs")
        .select("status")
        .eq("story_id", storyId)
        .eq("status", "pending")
        .maybeSingle();

      if (!logData) {
        // Not pending, not verified — nothing to do
        setIsPending(false);
        setMetrics(null);
        return;
      }

      // Step 3: Pending — check on-chain via /api/cre/check
      // This reads from the contract and caches to Supabase if found
      setIsPending(true);

      const token = (await supabase.auth.getSession())?.data?.session?.access_token;
      if (!token) return;

      const res = await fetch("/api/cre/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ storyId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.verified && data.metrics) {
          // Chain read found data — it's now cached in Supabase too
          setMetrics({
            significance_score: data.metrics.significance_score,
            emotional_depth: data.metrics.emotional_depth,
            quality_score: data.metrics.quality_score,
            word_count: data.metrics.word_count,
            verified_themes: data.metrics.verified_themes,
            cre_attestation_id: data.metrics.cre_attestation_id || null,
            cre_workflow_run_id: null,
            on_chain_tx_hash: null,
            on_chain_block_number: null,
          });
          setIsPending(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
        // If not verified yet, keep polling
      }
    } catch (err) {
      console.error("[useVerifiedMetrics] Error:", err);
      setError("Failed to load verification status");
    }
  }, [supabase, storyId]);

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

  return {
    metrics,
    isPending,
    isVerified: !!metrics,
    error,
    refetch: fetchMetrics,
  };
}
