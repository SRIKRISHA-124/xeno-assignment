import { NextRequest, NextResponse } from 'next/server';
import { generateCampaignWorkflow } from '@/lib/gemini';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required and must be a string' }, { status: 400 });
    }

    console.log(`[API Chat] Processing intent: "${prompt}"`);

    // 1. Invoke AI model (Gemini or Mock fallback)
    const workflow = await generateCampaignWorkflow(prompt);

    // 2. Fetch matching customers from database to compute real estimated reach
    const matchingCustomers = await db.getCustomers({
      city: workflow.segment_filters.city,
      minSpent: workflow.segment_filters.minSpent,
      inactiveDays: workflow.segment_filters.inactiveDays
    });

    console.log(`[API Chat] Segment evaluated: ${matchingCustomers.length} matching customers.`);

    // 3. Return results
    return NextResponse.json({
      success: true,
      workflow,
      reach_count: matchingCustomers.length,
      customers_preview: matchingCustomers.slice(0, 5).map(c => ({
        id: c.id,
        name: c.name,
        city: c.city,
        total_spent: c.total_spent,
        last_order_date: c.last_order_date
      }))
    });
  } catch (error: any) {
    console.error('[API Chat Error]', error);
    return NextResponse.json({ error: error.message || 'An error occurred during segment analysis' }, { status: 500 });
  }
}
