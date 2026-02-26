import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://seun-bot-4fb16422b74d.herokuapp.com';

// GET /api/chat/examples - Get example chat prompts
export async function GET(request: NextRequest) {
  try {
    console.log('💡 Fetching chat examples...');

    const response = await fetch(`${API_BASE_URL}/api/Chat/examples`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Chat Examples API Error:', response.status, errorText);
      return NextResponse.json(
        { error: `Backend returned ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Chat Examples loaded');

    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Chat Examples proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch examples', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
