import { NextRequest, NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server config: Missing ELEVENLABS_API_KEY" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Convert the incoming file to a Blob-like object that the SDK accepts
    const arrayBuffer = await file.arrayBuffer();
    const audioBlob = new Blob([arrayBuffer], { type: file.type || "audio/webm" });

    // Call ElevenLabs Scribe Model
    const transcription = await client.speechToText.convert({
      file: audioBlob,
      modelId: "scribe_v1", // The latest Scribe model
      tagAudioEvents: true, // (Optional) Captures laughs, applause, etc.
      languageCode: "eng", // Set to 'eng' or remove for auto-detect
      diarize: false, // Set to true if you want to distinguish speakers
    });

    // ElevenLabs returns the transcription result
    // Cast to access the text property which may not be in all response types
    const responseText = (transcription as { text?: string }).text ||
                         (typeof transcription === 'string' ? transcription : '');
    return NextResponse.json({ text: responseText });

  } catch (error: any) {
    console.error("ElevenLabs Transcription error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}