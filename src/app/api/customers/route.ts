import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const customers = await db.getCustomers();
    return NextResponse.json({
      success: true,
      customers
    });
  } catch (error: any) {
    console.error('[API Customers Error]', error);
    return NextResponse.json({ error: error.message || 'Error fetching customers list' }, { status: 500 });
  }
}
