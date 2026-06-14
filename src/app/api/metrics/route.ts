import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const metrics = await db.getMetrics();
    const campaigns = await db.getCampaigns();
    const allCustomers = await db.getCustomers();

    // 1. Calculate statistics for dynamic insights
    // a. Inactivity count (90+ days inactive)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    const inactiveCount = allCustomers.filter(c => new Date(c.last_order_date) <= cutoffDate).length;
    const inactivePercentage = Math.round((inactiveCount / (allCustomers.length || 1)) * 100);

    // b. Regional analysis: find city with highest average spend
    const cityTotals: { [key: string]: { total: number; count: number } } = {};
    allCustomers.forEach(c => {
      if (!cityTotals[c.city]) {
        cityTotals[c.city] = { total: 0, count: 0 };
      }
      cityTotals[c.city].total += c.total_spent;
      cityTotals[c.city].count += 1;
    });

    let bestCity = 'Mumbai';
    let highestAvgSpend = 0;
    Object.keys(cityTotals).forEach(city => {
      const avg = cityTotals[city].total / cityTotals[city].count;
      if (avg > highestAvgSpend) {
        highestAvgSpend = avg;
        bestCity = city;
      }
    });

    // c. Campaign Performance metrics
    const overallCtr = metrics.clickRate;
    const deliveryRate = metrics.deliveryRate;

    // 2. Generate lightweight business rule insights
    const dynamicInsights = [
      {
        insight: `${inactivePercentage}% of your subscribers (${inactiveCount} customers) have not ordered in over 90 days.`,
        action: "Launch a win-back WhatsApp campaign offering a ₹500 discount code.",
        impact: "Estimated +18% customer re-engagement and ₹1.5L in reclaimed sales."
      },
      {
        insight: `Customers in ${bestCity} are highly valuable, maintaining the highest average order value (AOV: ₹${Math.round(highestAvgSpend).toLocaleString()}).`,
        action: `Deploy a premium WhatsApp VIP catalog drop targeted exclusively at ${bestCity} shoppers.`,
        impact: "Estimated +15% conversion lift and increased customer lifetime value."
      },
      {
        insight: `Your overall campaign click-through rate is holding at ${overallCtr.toFixed(1)}%, with WhatsApp significantly outperforming email.`,
        action: "Configure your upcoming discount pings to default to WhatsApp with interactive buttons.",
        impact: "Estimated +22% CTR growth compared to email templates."
      },
      {
        insight: `Delivery efficiency is stable at ${deliveryRate.toFixed(1)}%, but ${metrics.failed} contact bounces were flagged on recent runs.`,
        action: "Run contact list sanitation and filter out unverified phone numbers.",
        impact: "Estimated +8% delivery accuracy on future SMS campaigns."
      }
    ];

    // 3. Get recently updated statuses to show live stream on dashboard
    let recentCallbacks: any[] = [];
    if (campaigns.length > 0) {
      const statuses = await db.getDeliveryStatuses(campaigns[0].id);
      recentCallbacks = statuses
        .filter(s => s.status !== 'pending')
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 10);
    }

    return NextResponse.json({
      success: true,
      metrics,
      campaigns: campaigns.slice(0, 5), // return top 5
      recentCallbacks,
      insights: dynamicInsights
    });
  } catch (error: any) {
    console.error('[API Metrics Error]', error);
    return NextResponse.json({ error: error.message || 'Error fetching dashboard metrics' }, { status: 500 });
  }
}
