import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { campaign_id, customer_id, status, error_message } = payload;

    if (!campaign_id || !customer_id || !status) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Update status in database. The wrapper handles idempotency (preventing state regression).
    await db.updateDeliveryStatus(campaign_id, customer_id, status, error_message || null);

    return NextResponse.json({
      success: true,
      message: 'Status receipt recorded successfully'
    });
  } catch (error: any) {
    console.error('[API Receipt Error]', error);
    return NextResponse.json({ error: error.message || 'Error processing status callback' }, { status: 500 });
  }
}

// Support OPTIONS pre-flight requests from CORS if the channel service runs from a different origin
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
