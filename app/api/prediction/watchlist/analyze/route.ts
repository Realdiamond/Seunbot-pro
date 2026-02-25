import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://seun-bot-4fb16422b74d.herokuapp.com';

export async function POST() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/Prediction/watchlist/analyze`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `API returned ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Watchlist analyze proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze watchlist' },
      { status: 500 }
    );
  }
}
