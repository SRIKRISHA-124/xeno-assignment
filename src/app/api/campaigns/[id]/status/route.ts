import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = params.id;

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    const campaign = await db.getCampaignById(campaignId);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const deliveryStatuses = await db.getDeliveryStatuses(campaignId);

    // Compute metrics for this campaign
    const total = deliveryStatuses.length;
    const sent = deliveryStatuses.filter(s => ['sent', 'delivered', 'opened', 'clicked'].includes(s.status)).length;
    const delivered = deliveryStatuses.filter(s => ['delivered', 'opened', 'clicked'].includes(s.status)).length;
    const opened = deliveryStatuses.filter(s => ['opened', 'clicked'].includes(s.status)).length;
    const clicked = deliveryStatuses.filter(s => s.status === 'clicked').length;
    const failed = deliveryStatuses.filter(s => s.status === 'failed').length;

    const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;

    return NextResponse.json({
      success: true,
      campaign,
      stats: {
        total,
        sent,
        delivered,
        opened,
        clicked,
        failed,
        deliveryRate,
        openRate,
        clickRate
      },
      statuses: deliveryStatuses.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    });
  } catch (error: any) {
    console.error('[API Campaign Status Error]', error);
    return NextResponse.json({ error: error.message || 'Error fetching campaign status' }, { status: 500 });
  }
}
