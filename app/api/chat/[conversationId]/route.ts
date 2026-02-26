import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://seun-bot-4fb16422b74d.herokuapp.com';

// DELETE /api/chat/[conversationId] - Clear conversation history
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await context.params;
    
    console.log('🗑️ Deleting conversation:', conversationId);

    const response = await fetch(`${API_BASE_URL}/api/Chat/${conversationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok && response.status !== 204) {
      const errorText = await response.text();
      console.error('❌ Delete Conversation Error:', response.status, errorText);
      return NextResponse.json(
        { error: `Backend returned ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    console.log('✅ Conversation deleted:', conversationId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('💥 Delete Conversation proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
