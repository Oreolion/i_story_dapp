/**
 * Backfill Script: Generate AI metadata for existing stories
 *
 * This script finds all stories without metadata and analyzes them using the Gemini AI.
 * Run with: npx ts-node --esm scripts/backfill-metadata.ts
 *
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - GOOGLE_GENERATIVE_AI_API_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY!;

// Rate limiting: delay between API calls (ms)
const RATE_LIMIT_DELAY = 2000;

// Batch size
const BATCH_SIZE = 10;

// Valid values for validation
const VALID_EMOTIONAL_TONES = [
  "reflective", "joyful", "anxious", "hopeful", "melancholic",
  "grateful", "frustrated", "peaceful", "excited", "uncertain", "neutral",
];

const VALID_LIFE_DOMAINS = [
  "work", "relationships", "health", "identity", "growth",
  "creativity", "spirituality", "family", "adventure", "learning", "general",
];

const ANALYSIS_PROMPT = `You are a cognitive analysis engine for a personal journaling app. Analyze the following story and extract structured metadata.

Story:
"""
{STORY_TEXT}
"""

Extract and return ONLY valid JSON (no markdown, no code blocks, no explanation). Use this exact structure:

{
  "themes": ["theme1", "theme2", "theme3"],
  "emotional_tone": "string",
  "life_domain": "string",
  "intensity_score": 0.0,
  "significance_score": 0.0,
  "people_mentioned": ["name1", "name2"],
  "places_mentioned": ["place1", "place2"],
  "time_references": ["reference1", "reference2"],
  "brief_insight": "A single sentence insight about this story's meaning or significance."
}

Guidelines:
- themes: 1-5 key themes from the story (e.g., "growth", "loss", "discovery", "connection")
- emotional_tone: MUST be one of: reflective, joyful, anxious, hopeful, melancholic, grateful, frustrated, peaceful, excited, uncertain, neutral
- life_domain: MUST be one of: work, relationships, health, identity, growth, creativity, spirituality, family, adventure, learning, general
- intensity_score: 0.0-1.0, how emotionally charged is this story?
- significance_score: 0.0-1.0, how important is this event to the person's life story?
- people_mentioned: Extract proper names of people mentioned (empty array if none)
- places_mentioned: Extract specific locations mentioned (empty array if none)
- time_references: Extract time references like "last summer", "when I was 12", "yesterday" (empty array if none)
- brief_insight: A compassionate, insightful one-sentence observation about the story's meaning

Return ONLY the JSON object, nothing else.`;

interface Story {
  id: string;
  content: string;
  title: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function analyzeStory(
  genAI: GoogleGenerativeAI,
  story: Story
): Promise<Record<string, unknown> | null> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = ANALYSIS_PROMPT.replace("{STORY_TEXT}", story.content);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let analysisText = response.text();

    // Clean up the response
    analysisText = analysisText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();

    const metadata = JSON.parse(analysisText);

    // Validate and sanitize
    return {
      story_id: story.id,
      themes: Array.isArray(metadata.themes)
        ? metadata.themes.slice(0, 5).map((t: unknown) => String(t).toLowerCase())
        : [],
      emotional_tone: VALID_EMOTIONAL_TONES.includes(metadata.emotional_tone)
        ? metadata.emotional_tone
        : "neutral",
      life_domain: VALID_LIFE_DOMAINS.includes(metadata.life_domain)
        ? metadata.life_domain
        : "general",
      intensity_score:
        typeof metadata.intensity_score === "number"
          ? Math.max(0, Math.min(1, metadata.intensity_score))
          : 0.5,
      significance_score:
        typeof metadata.significance_score === "number"
          ? Math.max(0, Math.min(1, metadata.significance_score))
          : 0.5,
      people_mentioned: Array.isArray(metadata.people_mentioned)
        ? metadata.people_mentioned.map((p: unknown) => String(p))
        : [],
      places_mentioned: Array.isArray(metadata.places_mentioned)
        ? metadata.places_mentioned.map((p: unknown) => String(p))
        : [],
      time_references: Array.isArray(metadata.time_references)
        ? metadata.time_references.map((t: unknown) => String(t))
        : [],
      brief_insight:
        typeof metadata.brief_insight === "string"
          ? metadata.brief_insight.slice(0, 500)
          : null,
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error analyzing story ${story.id}:`, error);
    return null;
  }
}

async function main() {
  console.log("=== Story Metadata Backfill Script ===\n");

  // Validate environment variables
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !GEMINI_API_KEY) {
    console.error("Missing required environment variables.");
    console.error("Please ensure these are set in .env.local:");
    console.error("  - NEXT_PUBLIC_SUPABASE_URL");
    console.error("  - SUPABASE_SERVICE_ROLE_KEY");
    console.error("  - GOOGLE_GENERATIVE_AI_API_KEY");
    process.exit(1);
  }

  // Initialize clients
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  // Find stories without metadata
  console.log("Fetching stories without metadata...");

  const { data: storiesWithoutMetadata, error: fetchError } = await supabase
    .from("stories")
    .select("id, title, content")
    .not("content", "is", null)
    .order("created_at", { ascending: false });

  if (fetchError) {
    console.error("Error fetching stories:", fetchError);
    process.exit(1);
  }

  // Get existing metadata story IDs
  const { data: existingMetadata } = await supabase
    .from("story_metadata")
    .select("story_id");

  const existingIds = new Set(
    (existingMetadata || []).map((m) => m.story_id)
  );

  // Filter stories that don't have metadata
  const storiesToProcess = (storiesWithoutMetadata || []).filter(
    (s) => !existingIds.has(s.id) && s.content && s.content.length > 20
  );

  console.log(`Found ${storiesToProcess.length} stories to process.\n`);

  if (storiesToProcess.length === 0) {
    console.log("No stories need processing. Exiting.");
    process.exit(0);
  }

  // Process in batches
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < storiesToProcess.length; i += BATCH_SIZE) {
    const batch = storiesToProcess.slice(i, i + BATCH_SIZE);
    console.log(
      `\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(storiesToProcess.length / BATCH_SIZE)}...`
    );

    for (const story of batch) {
      processed++;
      console.log(`  [${processed}/${storiesToProcess.length}] Analyzing: "${story.title?.slice(0, 40)}..."`);

      const metadata = await analyzeStory(genAI, story);

      if (metadata) {
        const { error: insertError } = await supabase
          .from("story_metadata")
          .upsert(metadata, { onConflict: "story_id" });

        if (insertError) {
          console.error(`    Error saving metadata: ${insertError.message}`);
          failed++;
        } else {
          console.log(`    Success - Tone: ${metadata.emotional_tone}, Domain: ${metadata.life_domain}`);
          succeeded++;
        }
      } else {
        failed++;
      }

      // Rate limiting
      await sleep(RATE_LIMIT_DELAY);
    }
  }

  console.log("\n=== Backfill Complete ===");
  console.log(`Total processed: ${processed}`);
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Failed: ${failed}`);
}

main().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
