import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { storyId, userId } = await request.json();
    
    // Validate input
    if (!storyId || !userId) {
      return NextResponse.json(
        { error: 'Story ID and User ID are required' },
        { status: 400 }
      );
    }

    // Mock like processing
    const isLiked = Math.random() > 0.5; // Randomly determine if it's a like or unlike
    const storyTokensEarned = isLiked ? 1 : 0;
    
    // Mock database update
    const likeResult = {
      storyId,
      userId,
      isLiked,
      storyTokensEarned,
      totalLikes: Math.floor(Math.random() * 200) + 50, // Mock total likes
      timestamp: new Date().toISOString()
    };

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      data: likeResult,
      message: isLiked 
        ? `Story liked! You earned ${storyTokensEarned} $STORY token.`
        : 'Story unliked.'
    });

  } catch (error) {
    console.error('Error processing like:', error);
    return NextResponse.json(
      { error: 'Failed to process like' },
      { status: 500 }
    );
  }
}