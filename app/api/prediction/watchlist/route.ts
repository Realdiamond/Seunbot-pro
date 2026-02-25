import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://seun-bot-4fb16422b74d.herokuapp.com';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/Prediction/watchlist`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `API returned ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Watchlist proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}
