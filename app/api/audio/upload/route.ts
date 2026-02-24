import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/app/utils/supabase/supabaseAdmin";
import { validateAuthOrReject, isAuthError, resolveUserId } from "@/lib/auth";

/**
 * POST /api/audio/upload — Upload audio file to Supabase Storage (bypasses RLS)
 *
 * Expects multipart form data with:
 *   - file: audio blob
 *   - userId: the user's ID (validated against auth)
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await validateAuthOrReject(req);
    if (isAuthError(authResult)) return authResult;
    const resolvedUserId = await resolveUserId(authResult);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Verify ownership
    if (userId && userId !== resolvedUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate file type
    if (!file.type.startsWith("audio/")) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Limit file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const fileName = `${resolvedUserId}/${Date.now()}.webm`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { data: uploadData, error: uploadError } = await admin.storage
      .from("story-audio")
      .upload(fileName, buffer, { contentType: file.type });

    if (uploadError) {
      console.error("[API /audio/upload] storage error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const { data: urlData } = admin.storage
      .from("story-audio")
      .getPublicUrl(uploadData.path);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: uploadData.path,
    });
  } catch (err: unknown) {
    console.error("[API /audio/upload] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
