import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/app/utils/supabase/supabaseServer";
import { NextRequest, NextResponse } from "next/server";
import { 
  AnalysisResponse, 
  StoryMetadata,
  EMOTIONAL_TONES,
  LIFE_DOMAINS 
} from "@/app/types/metadata";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

// Analysis prompt template
const ANALYSIS_PROMPT = `You are an expert narrative analyst. Analyze this personal story and extract structured metadata.

IMPORTANT: Respond ONLY with valid JSON. No markdown, no code blocks, no explanation.

Story to analyze:
"""
{STORY_TEXT}
"""

Extract and return this exact JSON structure:
{
  "themes": ["theme1", "theme2"],
  "emotional_tone": "one of: reflective, joyful, anxious, hopeful, melancholic, grateful, frustrated, peaceful, excited, uncertain",
  "life_domain": "one of: work, relationships, health, identity, growth, creativity, spirituality, family, adventure, learning",
  "intensity_score": 0.0 to 1.0 (how emotionally charged),
  "significance_score": 0.0 to 1.0 (life event importance - births, deaths, major decisions = high),
  "people_mentioned": ["names or roles of people mentioned"],
  "places_mentioned": ["locations mentioned"],
  "time_references": ["time periods like 'childhood', 'last week', '2020'"],
  "brief_insight": "One sentence capturing the core meaning or lesson of this story"
}

Guidelines:
- themes: 1-4 core themes (e.g., "growth", "loss", "discovery", "conflict", "connection", "transition")
- intensity_score: 0.0-0.3 (mundane), 0.4-0.6 (moderate), 0.7-1.0 (highly emotional)
- significance_score: 0.0-0.3 (daily life), 0.4-0.6 (notable event), 0.7-1.0 (life-changing)
- Keep brief_insight under 100 characters
- If unsure about a field, use reasonable defaults rather than leaving empty`;

// Validate analysis response
function validateAnalysis(data: unknown): AnalysisResponse | null {
  if (!data || typeof data !== 'object') return null;
  
  const obj = data as Record<string, unknown>;
  
  // Validate required fields exist
  if (!Array.isArray(obj.themes)) return null;
  if (typeof obj.emotional_tone !== 'string') return null;
  if (typeof obj.life_domain !== 'string') return null;
  
  // Validate enums
  const tone = obj.emotional_tone as string;
  const domain = obj.life_domain as string;
  
  if (!EMOTIONAL_TONES.includes(tone as typeof EMOTIONAL_TONES[number])) {
    obj.emotional_tone = 'reflective'; // Default fallback
  }
  
  if (!LIFE_DOMAINS.includes(domain as typeof LIFE_DOMAINS[number])) {
    obj.life_domain = 'identity'; // Default fallback
  }
  
  // Clamp scores to 0-1
  obj.intensity_score = Math.max(0, Math.min(1, Number(obj.intensity_score) || 0.5));
  obj.significance_score = Math.max(0, Math.min(1, Number(obj.significance_score) || 0.5));
  
  // Ensure arrays
  obj.people_mentioned = Array.isArray(obj.people_mentioned) ? obj.people_mentioned : [];
  obj.places_mentioned = Array.isArray(obj.places_mentioned) ? obj.places_mentioned : [];
  obj.time_references = Array.isArray(obj.time_references) ? obj.time_references : [];
  
  // Ensure brief_insight
  obj.brief_insight = typeof obj.brief_insight === 'string' ? obj.brief_insight : '';
  
  return obj as unknown as AnalysisResponse;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { storyId, storyText } = await request.json();
    
    // Validate input
    if (!storyId || typeof storyId !== 'string') {
      return NextResponse.json(
        { success: false, error: "Missing or invalid storyId" },
        { status: 400 }
      );
    }
    
    if (!storyText || typeof storyText !== 'string') {
      return NextResponse.json(
        { success: false, error: "Missing or invalid storyText" },
        { status: 400 }
      );
    }
    
    // Skip very short content
    if (storyText.trim().length < 50) {
      return NextResponse.json(
        { success: false, error: "Story too short for meaningful analysis (min 50 chars)" },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Mark as processing
    await supabase
      .from("story_metadata")
      .upsert({
        story_id: storyId,
        analysis_status: 'processing',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'story_id' });
    
    // Call Gemini for analysis
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent output
        maxOutputTokens: 1024,
      }
    });
    
    const prompt = ANALYSIS_PROMPT.replace("{STORY_TEXT}", storyText.substring(0, 5000)); // Limit input size
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    let analysisData: AnalysisResponse;
    try {
      // Clean potential markdown formatting
      const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const parsed = JSON.parse(cleanedText);
      const validated = validateAnalysis(parsed);
      
      if (!validated) {
        throw new Error("Validation failed");
      }
      
      analysisData = validated;
    } catch (parseError) {
      console.error("Failed to parse AI response:", text);
      
      // Update status to failed
      await supabase
        .from("story_metadata")
        .update({
          analysis_status: 'failed',
          analysis_error: 'Failed to parse AI response',
          updated_at: new Date().toISOString(),
        })
        .eq('story_id', storyId);
      
      return NextResponse.json(
        { success: false, error: "Failed to parse AI analysis" },
        { status: 500 }
      );
    }
    
    // Save to database
    const { data: metadata, error: dbError } = await supabase
      .from("story_metadata")
      .upsert({
        story_id: storyId,
        themes: analysisData.themes,
        emotional_tone: analysisData.emotional_tone,
        life_domain: analysisData.life_domain,
        intensity_score: analysisData.intensity_score,
        significance_score: analysisData.significance_score,
        people_mentioned: analysisData.people_mentioned,
        places_mentioned: analysisData.places_mentioned,
        time_references: analysisData.time_references,
        brief_insight: analysisData.brief_insight,
        analysis_status: 'completed',
        analysis_error: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'story_id' })
      .select()
      .single();
    
    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { success: false, error: "Failed to save metadata" },
        { status: 500 }
      );
    }
    
    const duration = Date.now() - startTime;
    console.log(`Analysis completed for story ${storyId} in ${duration}ms`);
    
    return NextResponse.json({
      success: true,
      metadata: metadata as StoryMetadata,
      insight: analysisData.brief_insight,
      processingTime: duration,
    });
    
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { success: false, error: "Analysis failed unexpectedly" },
      { status: 500 }
    );
  }
}

// GET endpoint to check analysis status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storyId = searchParams.get('storyId');
  
  if (!storyId) {
    return NextResponse.json(
      { success: false, error: "Missing storyId parameter" },
      { status: 400 }
    );
  }
  
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("story_metadata")
    .select("*")
    .eq("story_id", storyId)
    .single();
  
  if (error) {
    return NextResponse.json(
      { success: false, error: "Metadata not found" },
      { status: 404 }
    );
  }
  
  return NextResponse.json({
    success: true,
    metadata: data as StoryMetadata,
  });
}