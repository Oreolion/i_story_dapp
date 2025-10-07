import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock user profile data
    const mockProfile = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      name: 'Alex Johnson',
      bio: 'Digital storyteller sharing life moments on the blockchain',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
      badges: ['Early Adopter', '10-Day Streak', 'Community Star'],
      stats: {
        stories: 24,
        books: 2,
        followers: 156,
        following: 89,
        totalLikes: 456,
        totalViews: 2100,
        storyTokens: 150,
        ethBalance: 2.5
      },
      achievements: [
        { name: 'First Story', earned: true, date: '2025-01-15' },
        { name: '10-Day Streak', earned: true, date: '2025-01-20' },
        { name: 'Community Star', earned: true, date: '2025-01-18' }
      ],
      joinDate: '2025-01-15',
      lastActive: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: mockProfile
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json();
    
    // Validate and sanitize updates
    const allowedFields = ['name', 'bio', 'location', 'website'];
    const validUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as any);

    // Mock profile update
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      data: validUpdates,
      message: 'Profile updated successfully!'
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}