import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://seun-bot-4fb16422b74d.herokuapp.com';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbols = searchParams.get('symbols');
    
    if (!symbols) {
      return NextResponse.json(
        { error: 'symbols parameter is required' },
        { status: 400 }
      );
    }
    
    const symbolsArray = symbols.split(',');
    const backendUrl = `${API_BASE_URL}/api/Prediction/batch?symbols=${symbols}`;
    
    console.log('');
    console.log('🔄 PROXY ROUTE: Batch Prediction');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 Received from frontend:');
    console.log('   - Symbols count:', symbolsArray.length);
    console.log('   - Symbols:', symbols);
    console.log('');
    console.log('📤 Forwarding to backend:');
    console.log('   - URL:', backendUrl);
    console.log('   - Method: GET');
    console.log('   - Time:', new Date().toISOString());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const startTime = Date.now();
    const response = await fetch(backendUrl);
    const duration = Date.now() - startTime;
    
    console.log('');
    console.log('📨 BACKEND RESPONSE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   - Status:', response.status, response.statusText);
    console.log('   - Duration:', duration, 'ms');
    console.log('   - Headers:', Object.fromEntries(response.headers.entries()));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend Error Response:', errorText);
      return NextResponse.json(
        { error: `API returned ${response.status}`, details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('✅ Success! Predictions returned:', Array.isArray(data) ? data.length : 'N/A');
    return NextResponse.json(data);
  } catch (error) {
    console.error('');
    console.error('💥 PROXY ERROR:');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('   Error:', error);
    console.error('   Message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');
    return NextResponse.json(
      { error: 'Failed to fetch batch predictions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
