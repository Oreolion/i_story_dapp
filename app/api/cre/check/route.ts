import { NextRequest, NextResponse } from "next/server";
import { validateAuthOrReject, isAuthError } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";
import { createPublicClient, http, parseAbi } from "viem";
import { baseSepolia } from "viem/chains";

const VERIFIED_METRICS_ADDRESS = process.env.NEXT_PUBLIC_VERIFIED_METRICS_ADDRESS as `0x${string}` | undefined;

const abi = parseAbi([
  "function isVerified(bytes32 storyId) view returns (bool)",
  "function getMetrics(bytes32 storyId) view returns (uint8 significanceScore, uint8 emotionalDepth, uint8 qualityScore, uint32 wordCount, string[] themes, bytes32 attestationId, uint256 verifiedAt)",
]);

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http("https://sepolia.base.org"),
});

/**
 * Convert UUID string to bytes32 (same encoding as CRE workflow)
 */
function uuidToBytes32(uuid: string): `0x${string}` {
  return `0x${uuid.replace(/-/g, "").padEnd(64, "0")}` as `0x${string}`;
}

/**
 * POST /api/cre/check
 * Reads verified metrics from the VerifiedMetrics contract on-chain.
 * If found, caches to Supabase and updates verification_logs status.
 * Called by the frontend hook while polling for results.
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await validateAuthOrReject(req);
    if (isAuthError(authResult)) return authResult;

    const { storyId } = await req.json();

    if (!storyId) {
      return NextResponse.json({ error: "Story ID is required" }, { status: 400 });
    }

    if (!VERIFIED_METRICS_ADDRESS || VERIFIED_METRICS_ADDRESS === "0x0000000000000000000000000000000000000000") {
      return NextResponse.json({ verified: false, reason: "Contract not deployed" });
    }

    const storyIdBytes32 = uuidToBytes32(storyId);

    // Check if verified on-chain
    const isVerified = await publicClient.readContract({
      address: VERIFIED_METRICS_ADDRESS,
      abi,
      functionName: "isVerified",
      args: [storyIdBytes32],
    });

    if (!isVerified) {
      return NextResponse.json({ verified: false });
    }

    // Read full metrics from contract
    const [
      significanceScore,
      emotionalDepth,
      qualityScore,
      wordCount,
      themes,
      attestationId,
      verifiedAt,
    ] = await publicClient.readContract({
      address: VERIFIED_METRICS_ADDRESS,
      abi,
      functionName: "getMetrics",
      args: [storyIdBytes32],
    });

    const metricsData = {
      significance_score: Number(significanceScore),
      emotional_depth: Number(emotionalDepth),
      quality_score: Number(qualityScore),
      word_count: Number(wordCount),
      verified_themes: themes as string[],
      cre_attestation_id: attestationId,
      on_chain_verified_at: Number(verifiedAt),
    };

    // Cache to Supabase
    const admin = createSupabaseAdminClient();

    const { error: upsertError } = await admin
      .from("verified_metrics")
      .upsert(
        {
          story_id: storyId,
          significance_score: metricsData.significance_score,
          emotional_depth: metricsData.emotional_depth,
          quality_score: metricsData.quality_score,
          word_count: metricsData.word_count,
          verified_themes: metricsData.verified_themes,
          cre_attestation_id: metricsData.cre_attestation_id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "story_id" }
      );

    if (upsertError) {
      console.error("[CRE/CHECK] Supabase cache error:", upsertError);
      // Non-critical — data is still on-chain. Return it anyway.
    }

    // Update verification log to completed
    await admin
      .from("verification_logs")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("story_id", storyId)
      .eq("status", "pending");

    return NextResponse.json({
      verified: true,
      metrics: metricsData,
    });
  } catch (error) {
    console.error("[CRE/CHECK] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
