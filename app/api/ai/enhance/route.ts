import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Server configuration error: API Key missing" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // FIX: Reverted to the standard "gemini-1.5-flash"
    // Since you fixed your API key, this standard alias will now work.
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert storytelling editor. Please enhance the following journal entry.
      - Fix grammar and spelling errors.
      - Improve the flow and vocabulary while keeping the original personal tone.
      - Do not change the underlying meaning or add fictional events.
      - Return ONLY the enhanced text. Do not include quotes around the result.
      
      Original Text:
      "${text}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const enhancedText = response.text();

    return NextResponse.json({ text: enhancedText });

  } catch (error: any) {
    console.error("Enhancement error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to enhance text" },
      { status: 500 }
    );
  }
}