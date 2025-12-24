import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isDatabaseError } from '@/lib/error-handler';

export async function GET() {
  try {
    // Check database connection by running a simple query
    await prisma.$queryRaw`SELECT 1`;
    
    // Database is connected, server is healthy
    return NextResponse.json({ 
      status: 'ok',
      timestamp: Date.now()
    }, { status: 200 });
  } catch (error: any) {
    console.error('Health check error:', error);
    
    // Check if it's a database error
    if (isDatabaseError(error)) {
      // Return 503 with database error indicator
      return NextResponse.json({ 
        status: 'error',
        error: 'Database unavailable',
        errorType: 'database'
      }, { 
        status: 503,
        headers: {
          'X-Error-Type': 'database'
        }
      });
    }
    
    // Other server errors
    return NextResponse.json({ 
      status: 'error',
      error: 'Server is unhealthy',
      errorType: 'server'
    }, { 
      status: 503,
      headers: {
        'X-Error-Type': 'server'
      }
    });
  }
}

