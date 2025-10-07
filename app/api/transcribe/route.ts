import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // In a real implementation, you would:
    // 1. Extract audio data from the request
    // 2. Send it to AssemblyAI or Google Cloud Speech-to-Text
    // 3. Return the transcribed text

    // Mock transcription service
    const mockTranscriptions = [
      "Today was an incredible day. I woke up early and went for a walk in the park. The morning mist was still hanging over the lake, and I could hear birds chirping in the trees. It reminded me of how important it is to take time for these simple moments of beauty in our busy lives.",
      
      "I had the most interesting conversation with a stranger at the coffee shop today. We talked about dreams, goals, and the importance of following your passion. It's amazing how a random encounter can spark such deep reflection about life's direction.",
      
      "Spending time with my grandmother today brought back so many memories. She shared stories about her youth that I'd never heard before. These family connections and the wisdom of older generations are truly precious gifts we should cherish.",
      
      "Working on my new project has been both challenging and rewarding. Every obstacle teaches me something new about problem-solving and perseverance. I'm learning that the journey is often more valuable than the destination."
    ];

    const randomTranscription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    return NextResponse.json({
      success: true,
      transcript: randomTranscription,
      confidence: 0.95,
      language: 'en-US',
      duration: Math.floor(Math.random() * 120) + 30, // 30-150 seconds
    });

  } catch (error) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}