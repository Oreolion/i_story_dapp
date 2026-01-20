import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/utils/supabase/supabaseServer";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;

    if (!storyId) {
      return NextResponse.json(
        { error: "Story ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Fetch metadata for the story
    const { data, error } = await supabase
      .from("story_metadata")
      .select("*")
      .eq("story_id", storyId)
      .maybeSingle();

    if (error) {
      // Handle "table doesn't exist" error gracefully (code 42P01)
      // This allows the app to work before the migration is run
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        console.warn("story_metadata table does not exist yet. Run the migration in Supabase Dashboard.");
        return NextResponse.json({
          metadata: null,
          warning: "story_metadata table not yet created",
        });
      }

      console.error("Error fetching metadata:", error);
      return NextResponse.json(
        { error: "Failed to fetch metadata" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      metadata: data, // Will be null if no metadata exists
    });

  } catch (error: unknown) {
    console.error("Metadata fetch error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
