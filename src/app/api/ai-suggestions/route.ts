import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * DELIVERY STATUS TRACKING API
 * Handles: sent / delivered / opened / clicked / failed
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("📩 Incoming status update:", body);

    let {
      campaign_id,
      customer_id,
      status,
      error_message
    } = body;

    // ✅ Normalize status (IMPORTANT FIX)
    status = (status || '').toLowerCase();

    // ❌ Validation fix
    if (!campaign_id || !customer_id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // ✅ Allowed statuses (prevents wrong data)
    const allowedStatuses = [
      'sent',
      'delivered',
      'opened',
      'clicked',
      'failed'
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status type' },
        { status: 400 }
      );
    }

    console.log("🔄 Updating DB:", {
      campaign_id,
      customer_id,
      status
    });

    // ✅ Safe DB update
    await db.updateDeliveryStatus(
      campaign_id,
      customer_id,
      status,
      error_message || null
    );

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully',
      data: {
        campaign_id,
        customer_id,
        status
      }
    });

  } catch (error: any) {
    console.error("❌ API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}

/**
 * CORS support (important for external delivery services)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}