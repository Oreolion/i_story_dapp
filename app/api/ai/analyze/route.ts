import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";

// Valid values for validation
const VALID_EMOTIONAL_TONES = [
  'reflective', 'joyful', 'anxious', 'hopeful', 'melancholic',
  'grateful', 'frustrated', 'peaceful', 'excited', 'uncertain', 'neutral'
];

const VALID_LIFE_DOMAINS = [
  'work', 'relationships', 'health', 'identity', 'growth',
  'creativity', 'spirituality', 'family', 'adventure', 'learning', 'general'
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

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error: API Key missing" },
        { status: 500 }
      );
    }

    const { storyId, storyText } = await req.json();

    if (!storyId || !storyText) {
      return NextResponse.json(
        { error: "Missing required fields: storyId and storyText" },
        { status: 400 }
      );
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Generate analysis
    const prompt = ANALYSIS_PROMPT.replace("{STORY_TEXT}", storyText);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let analysisText = response.text();

    // Clean up the response (remove markdown code blocks if present)
    analysisText = analysisText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();

    // Parse JSON
    let metadata;
    try {
      metadata = JSON.parse(analysisText);
    } catch {
      console.error("Failed to parse AI response:", analysisText);
      return NextResponse.json(
        { error: "AI returned invalid JSON format" },
        { status: 500 }
      );
    }

    // Validate and sanitize the metadata
    const sanitizedMetadata = {
      themes: Array.isArray(metadata.themes)
        ? metadata.themes.slice(0, 5).map((t: unknown) => String(t).toLowerCase())
        : [],
      emotional_tone: VALID_EMOTIONAL_TONES.includes(metadata.emotional_tone)
        ? metadata.emotional_tone
        : 'neutral',
      life_domain: VALID_LIFE_DOMAINS.includes(metadata.life_domain)
        ? metadata.life_domain
        : 'general',
      intensity_score: typeof metadata.intensity_score === 'number'
        ? Math.max(0, Math.min(1, metadata.intensity_score))
        : 0.5,
      significance_score: typeof metadata.significance_score === 'number'
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
      brief_insight: typeof metadata.brief_insight === 'string'
        ? metadata.brief_insight.slice(0, 500)
        : null,
    };

    // Save to database using admin client (bypasses RLS)
    const supabase = createSupabaseAdminClient();

    const { data, error: insertError } = await supabase
      .from("story_metadata")
      .upsert({
        story_id: storyId,
        ...sanitizedMetadata,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'story_id'
      })
      .select()
      .single();

    if (insertError) {
      // Handle "table doesn't exist" error
      if (insertError.code === "42P01" || insertError.message?.includes("does not exist")) {
        console.error("story_metadata table does not exist. Please run the migration in Supabase Dashboard.");
        return NextResponse.json(
          {
            error: "Database table 'story_metadata' not found. Please run the migration.",
            migration_required: true
          },
          { status: 500 }
        );
      }
      console.error("Database insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save metadata to database" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      metadata: data,
      insight: sanitizedMetadata.brief_insight,
    });

  } catch (error: unknown) {
    console.error("Analysis error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze story";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
