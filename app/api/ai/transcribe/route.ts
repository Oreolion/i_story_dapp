import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { validateAuthOrReject, isAuthError } from "@/lib/auth";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_AUDIO_TYPES = [
  "audio/webm", "audio/wav", "audio/mp3", "audio/mpeg",
  "audio/ogg", "audio/flac", "audio/m4a", "audio/mp4",
  "audio/x-m4a", "audio/aac", "video/webm",
];

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authResult = await validateAuthOrReject(req);
    if (isAuthError(authResult)) return authResult;

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 25MB." },
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = file.type || "audio/webm";
    if (!ALLOWED_AUDIO_TYPES.some(t => fileType.startsWith(t.split("/")[0]))) {
      return NextResponse.json(
        { error: "Invalid file type. Only audio files are accepted." },
        { status: 400 }
      );
    }

    // Convert the incoming file to a Blob-like object that the SDK accepts
    const arrayBuffer = await file.arrayBuffer();
    const audioBlob = new Blob([arrayBuffer], { type: fileType });

    // Call ElevenLabs Scribe Model
    const transcription = await client.speechToText.convert({
      file: audioBlob,
      modelId: "scribe_v1",
      tagAudioEvents: true,
      languageCode: "eng",
      diarize: false,
    });

    const responseText = (transcription as { text?: string }).text ||
                         (typeof transcription === 'string' ? transcription : '');
    return NextResponse.json({ text: responseText });

  } catch (error: unknown) {
    console.error("ElevenLabs Transcription error:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
