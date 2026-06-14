import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || 'http://localhost:3001';

export async function POST(req: NextRequest) {
  try {
    const { workflow } = await req.json();

    if (!workflow || !workflow.channel || !workflow.message_template || !workflow.segment_filters) {
      return NextResponse.json({ error: 'Invalid campaign workflow data' }, { status: 400 });
    }

    console.log(`[API Launch] Creating campaign: "${workflow.name}" via ${workflow.channel.toUpperCase()}`);

    // 1. Create Campaign in DB
    const campaign = await db.createCampaign({
      name: workflow.name,
      intent: workflow.audience_explanation?.summary || 'AI Segmented Campaign',
      segment_filters: workflow.segment_filters,
      channel: workflow.channel,
      message_template: workflow.message_template,
      scheduled_time: new Date().toISOString()
    });

    // 2. Fetch matching customer list
    const matchingCustomers = await db.getCustomers({
      city: workflow.segment_filters.city,
      minSpent: workflow.segment_filters.minSpent,
      inactiveDays: workflow.segment_filters.inactiveDays
    });

    if (matchingCustomers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No customers match this segment. Campaign aborted.'
      }, { status: 400 });
    }

    // 3. Initialize delivery statuses to 'pending'
    for (const customer of matchingCustomers) {
      await db.updateDeliveryStatus(campaign.id, customer.id, 'pending', null);
    }

    // Mark campaign as sending
    await db.updateCampaignStatus(campaign.id, 'sending');

    // 4. Send payload to Channel Service simulator
    console.log(`[API Launch] Dispatching to Channel Service at: ${CHANNEL_SERVICE_URL}/send`);
    
    let channelServiceContacted = false;
    let channelServiceError = null;

    try {
      const response = await fetch(`${CHANNEL_SERVICE_URL}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: campaign.id,
          channel: campaign.channel,
          recipients: matchingCustomers.map(c => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            city: c.city
          }))
        })
      });

      if (response.ok) {
        channelServiceContacted = true;
      } else {
        const errorText = await response.text();
        channelServiceError = `Channel service returned status ${response.status}: ${errorText}`;
      }
    } catch (err: any) {
      channelServiceError = `Could not contact Channel Service at ${CHANNEL_SERVICE_URL}. Ensure it is running! (Details: ${err.message})`;
    }

    // Update campaign status based on dispatch success
    if (channelServiceContacted) {
      await db.updateCampaignStatus(campaign.id, 'completed');
    } else {
      console.warn(`[API Launch WARNING] Campaign created but channel service dispatch failed: ${channelServiceError}`);
    }

    return NextResponse.json({
      success: true,
      campaign,
      recipientCount: matchingCustomers.length,
      channelServiceContacted,
      channelServiceError
    });
  } catch (error: any) {
    console.error('[API Launch Error]', error);
    return NextResponse.json({ error: error.message || 'An error occurred during campaign launch' }, { status: 500 });
  }
}
