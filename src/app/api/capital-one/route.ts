/**
 * Capital One API Health Check
 * GET /api/capital-one
 */

import { NextResponse } from 'next/server';
import { getCustomers } from '@/lib/capitalOne';

export async function GET() {
  try {
    // Test the API connection by fetching customers
    const customers = await getCustomers();
    
    return NextResponse.json({
      status: 'connected',
      message: 'Capital One Nessie API is working',
      customersFound: customers.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to connect to Capital One API',
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
