import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Quick health check - just return 200 if server is up
    return NextResponse.json({ 
      status: 'ok',
      timestamp: Date.now()
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ 
      status: 'error',
      error: 'Server is unhealthy'
    }, { status: 503 });
  }
}

