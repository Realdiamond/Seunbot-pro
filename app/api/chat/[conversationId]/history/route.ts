import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://seun-bot-4fb16422b74d.herokuapp.com';

// GET /api/chat/[conversationId]/history - Get conversation history
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await context.params;
    
    console.log('📜 Fetching conversation history:', conversationId);

    const response = await fetch(`${API_BASE_URL}/api/Chat/${conversationId}/history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Get History Error:', response.status, errorText);
      return NextResponse.json(
        { error: `Backend returned ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ History loaded:', data.length, 'messages');

    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Get History proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
