import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://seun-bot-4fb16422b74d.herokuapp.com';

// POST /api/chat - Send chat message and get AI response
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('💬 Chat API POST - Request:', {
      conversationId: body.conversationId,
      hasMessage: !!body.message,
      symbol: body.symbol || 'none',
    });

    const response = await fetch(`${API_BASE_URL}/api/Chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Chat API Error:', response.status, errorText);
      return NextResponse.json(
        { error: `Backend returned ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Chat POST Response - ConversationId:', data.conversationId);

    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Chat POST proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to get chat response', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/chat?message=...&symbol=... - Quick chat endpoint
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const message = searchParams.get('message');
    const symbol = searchParams.get('symbol');

    if (!message) {
      return NextResponse.json(
        { error: 'Message parameter is required' },
        { status: 400 }
      );
    }

    console.log('💬 Chat API GET - Message:', message, 'Symbol:', symbol || 'none');

    const params = new URLSearchParams({ message });
    if (symbol) params.append('symbol', symbol);

    const response = await fetch(`${API_BASE_URL}/api/Chat?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Chat GET API Error:', response.status, errorText);
      return NextResponse.json(
        { error: `Backend returned ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Chat GET Response - ConversationId:', data.conversationId);

    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Chat GET proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to get chat response', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
