import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://seun-bot-4fb16422b74d.herokuapp.com';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await context.params;
    console.log('🔍 Single Prediction Proxy - Symbol:', symbol);
    const response = await fetch(`${API_BASE_URL}/api/Prediction/${symbol}`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `API returned ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Prediction proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prediction' },
      { status: 500 }
    );
  }
}
