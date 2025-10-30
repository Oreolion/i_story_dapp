import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, content, mood, tags, hasAudio } = await request.json();
    
    // Validate input
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Mock IPFS upload
    const mockIPFSHash = `Qm${Math.random().toString(36).substring(2, 15)}`;
    
    // Mock NFT minting
    const mockTokenId = Math.floor(Math.random() * 10000);
    
    // Mock database save
    const journalEntry = {
      id: mockTokenId,
      title: title || `Journal Entry ${new Date().toLocaleDateString()}`,
      content,
      mood: mood || 'neutral',
      tags: tags || [],
      hasAudio: !!hasAudio,
      ipfsHash: mockIPFSHash,
      tokenId: mockTokenId,
      author: '0x1234...5678', // Mock wallet address
      createdAt: new Date().toISOString(),
      likes: 0,
      views: 0
    };

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    return NextResponse.json({
      success: true,
      data: journalEntry,
      message: 'Journal entry saved to blockchain successfully!'
    });

  } catch (error) {
    console.error('Error saving journal entry:', error);
    return NextResponse.json(
      { error: 'Failed to save journal entry' },
      { status: 500 }
    );
  }
}