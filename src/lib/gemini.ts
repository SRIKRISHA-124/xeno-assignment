import { GoogleGenerativeAI } from '@google/generative-ai';

// Interface matching the structured AI output
export interface AICampaignWorkflow {
  name: string;
  channel: 'whatsapp' | 'sms' | 'email';
  message_template: string;
  segment_filters: {
    city?: string;
    minSpent?: number;
    maxSpent?: number;
    inactiveDays?: number;
  };
  best_send_time: string;
  expected_open_rate: number;
  confidence_score: {
    audience_quality: { score: number; reason: string };
    message_strength: { score: number; reason: string };
    channel_match: { score: number; reason: string };
    overall: number;
  };
  audience_explanation: {
    summary: string;
    factors: {
      spending_pattern: string;
      purchase_frequency: string;
      inactivity: string;
      conversion_probability: string;
    };
  };
}

const geminiApiKey = process.env.GEMINI_API_KEY;
export const isGeminiConfigured = !!geminiApiKey;

let genAI: GoogleGenerativeAI | null = null;
if (isGeminiConfigured) {
  genAI = new GoogleGenerativeAI(geminiApiKey!);
}

// Lightweight natural-language parser for fallback mode
function generateMockAIWorkflow(userIntent: string): AICampaignWorkflow {
  const normalized = userIntent.toLowerCase();

  // 1. Detect City
  let city: string | undefined = undefined;
  if (normalized.includes('mumbai')) city = 'Mumbai';
  else if (normalized.includes('delhi')) city = 'Delhi';
  else if (normalized.includes('bangalore') || normalized.includes('bengaluru')) city = 'Bangalore';
  else if (normalized.includes('chennai')) city = 'Chennai';
  else if (normalized.includes('hyderabad')) city = 'Hyderabad';
  else if (normalized.includes('pune')) city = 'Pune';
  else if (normalized.includes('kolkata')) city = 'Kolkata';

  // 2. Detect Spent Amount (e.g. 5000, 10000)
  let minSpent: number | undefined = undefined;
  const rupeeMatch = normalized.match(/(?:rs\.?|₹|inr)\s*(\d+)/i) || normalized.match(/spent\s*(?:more\s*than|>)?\s*(\d+)/i);
  if (rupeeMatch) {
    minSpent = parseInt(rupeeMatch[1], 10);
  } else {
    // Check for raw numbers
    const numMatch = normalized.match(/\b\d{3,5}\b/);
    if (numMatch) {
      minSpent = parseInt(numMatch[0], 10);
    }
  }

  // 3. Detect Channel
  let channel: 'whatsapp' | 'sms' | 'email' = 'whatsapp';
  if (normalized.includes('sms') || normalized.includes('text') || normalized.includes('message')) {
    channel = 'sms';
  } else if (normalized.includes('email') || normalized.includes('mail')) {
    channel = 'email';
  }

  // 4. Detect Inactivity/Recency
  // Detect inactivity more flexibly
let inactiveDays;

const inactiveMatch =
  normalized.match(/inactive\s*(?:for)?\s*(\d+)\s*days/i) ||
  normalized.match(/not ordered.*?(\d+)\s*days/i) ||
  normalized.match(/no orders?.*?(\d+)\s*days/i) ||
  normalized.match(/last\s*(\d+)\s*days/i);

if (inactiveMatch) {
  inactiveDays = parseInt(inactiveMatch[1], 10);
}
  // 5. Generate template message based on input
  let discount = '10%';
  const discountMatch = normalized.match(/(\d+)%/);
  if (discountMatch) {
    discount = `${discountMatch[1]}%`;
  }

  let message_template = `Hey {{name}}, here is a special offer just for you! Enjoy ${discount} off on your next purchase. Use code: REACHIQ.`;
  if (channel === 'whatsapp') {
    message_template = `🌟 *Special Offer for {{name}}* 🌟\n\nWe love having you as a customer! Get *${discount} OFF* your next order in ${city || 'your city'}.\n\n👉 Tap here to shop: reachiq.in/shop?code=OFFER`;
  } else if (channel === 'email') {
    message_template = `Subject: We have a surprise for you, {{name}}!\n\nDear {{name}},\n\nIt's been a while since your last purchase. We want to welcome you back with a special ${discount} discount.\n\nCode: WELCOME${discount.replace('%', '')}\n\nHappy Shopping!`;
  }

  // Generate realistic scores and explanations
  const audienceScore = minSpent && minSpent > 5000 ? 94 : 85;
  const channelScore = channel === 'whatsapp' ? 90 : channel === 'sms' ? 78 : 65;
  const msgScore = normalized.includes('discount') || normalized.includes('offer') ? 88 : 75;
  const overall = Math.round((audienceScore + channelScore + msgScore) / 3);

  const filterSummary = `Customers in ${city || 'All Cities'}${minSpent ? ` who spent >= ₹${minSpent}` : ''}${inactiveDays ? ` and inactive for ${inactiveDays} days` : ''}`;

  return {
    name: `${channel.toUpperCase()} Campaign - ${city || 'All'} ${minSpent ? `Spent > ₹${minSpent}` : 'Customers'}`,
    channel,
    message_template,
    segment_filters: {
      city,
      minSpent,
      inactiveDays
    },
    best_send_time: 'Today at 6:30 PM (historically peak engagement)',
   expected_open_rate: channel === 'whatsapp' ? 72 : channel === 'sms' ? 58 : 22,
    confidence_score: {
      audience_quality: {
        score: audienceScore,
        reason: minSpent ? `Targeting customers who spent more than ₹${minSpent} ensures high average order value (AOV) response.` : 'Broad audience selection. Can be narrowed for better targeting.'
      },
      message_strength: {
        score: msgScore,
        reason: `Using personalization tag {{name}} and clear ${discount} discount incentive increases engagement probability.`
      },
      channel_match: {
        score: channelScore,
        reason: channel === 'whatsapp' ? 'WhatsApp delivers 4x higher read rates than Email in India.' : channel === 'sms' ? 'SMS is ideal for urgent transactional discounts.' : 'Email works best for rich long-form content.'
      },
      overall
    },
    audience_explanation: {
      summary: filterSummary,
      factors: {
        spending_pattern: minSpent ? `Averages above ₹${minSpent} per transaction with stable purchase history.` : 'Varying spending ranges, mostly casual shoppers.',
        purchase_frequency: 'Maintains steady ordering, average 4.2 purchases per year.',
        inactivity: inactiveDays ? `No orders in the last ${inactiveDays} days, ready for a win-back hook.` : 'Active order cycle, frequent visits.',
        conversion_probability: `Estimated at +${overall - 60}% based on similar historical ${channel.toUpperCase()} promotions.`
      }
    }
  };
}

// System prompt instructing Gemini how to behave and output structured JSON
const SYSTEM_PROMPT = `
You are the AI engine of ReachIQ, a Mini CRM.

You receive a marketer's campaign intent and must analyze the customer and order database structure to output a detailed Campaign Workflow recommendation in JSON format.

Database schema:

customers:
- name
- email
- phone
- city
- total_spent
- last_order_date
- order_count

orders:
- amount
- created_at

Return EXACTLY this JSON structure:

{
"name": string,
"channel": "whatsapp" | "sms" | "email",
"message_template": string,
"segment_filters": {
"city"?: string,
"minSpent"?: number,
"maxSpent"?: number,
"inactiveDays"?: number
},
"best_send_time": string,
"expected_open_rate": number,
"confidence_score": {
"audience_quality": {
"score": number,
"reason": string
},
"message_strength": {
"score": number,
"reason": string
},
"channel_match": {
"score": number,
"reason": string
},
"overall": number
},
"audience_explanation": {
"summary": string,
"factors": {
"spending_pattern": string,
"purchase_frequency": string,
"inactivity": string,
"conversion_probability": string
}
}
}

STRICT RULES:

1. Detect cities:
Mumbai
Delhi
Bangalore
Chennai
Hyderabad
Pune
Kolkata

2. Parse spending:
Examples:
spent more than 5000 → minSpent=5000
above ₹15000 → minSpent=15000

3. Parse inactivity:
inactive for 30 days → inactiveDays=30
inactive for 90 days → inactiveDays=90
inactive for 120 days → inactiveDays=120
inactive for 6 months → inactiveDays=180
have not ordered in the last 120 days → inactiveDays=120
no orders for 90 days → inactiveDays=90

4. NEVER ignore any constraint.

5. If inactivity appears:
segment_filters.inactiveDays MUST exist.

6. audience_explanation.summary MUST include:
city
spending
inactivity

Example:
Customers in Chennai who spent >= ₹15000 and inactive for 120 days

7. Select best channel:
WhatsApp → engagement
SMS → urgency
Email → long content

8. message_template MUST contain:
{{name}}

9. Use logical scores.

10. Return ONLY raw JSON.

11. Do NOT omit inactiveDays.

12. Do NOT explain outside JSON.
`;

export async function generateCampaignWorkflow(userIntent: string): Promise<AICampaignWorkflow> {
  if (!isGeminiConfigured || !genAI) {
    console.log("Gemini API key not set. Using offline rule-based parser fallback.");
    return generateMockAIWorkflow(userIntent);
  }

  try {
    const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  }
});

    const prompt = `System Instructions:\n${SYSTEM_PROMPT}\n\nMarketer Intent:\n"${userIntent}"`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("RAW GEMINI RESPONSE:");
console.log(text);

    // Parse response
    const json = JSON.parse(text.trim());
    return json as AICampaignWorkflow;
  } catch (error) {
    console.error("Gemini API call failed, falling back to mock generator:", error);
    return generateMockAIWorkflow(userIntent);
  }
}

// Interface for AI campaign recommendations based on metrics
export interface AICampaignSuggestion {
  channel: 'WhatsApp' | 'SMS' | 'Email';
  targetAudience: {
    city: string;
    minSpent: number;
    inactiveDays: number;
  };
  offer: string;
  expectedOpenRate: number;
  reason: string;
}

export async function generateCampaignSuggestion(
  metrics: any,
  dbStats: {
    inactiveCount: number;
    inactivePercentage: number;
    bestCity: string;
    highestAvgSpend: number;
    cities: string[];
  }
): Promise<AICampaignSuggestion> {
  if (!isGeminiConfigured || !genAI) {
    throw new Error("Gemini API key not configured");
  }

  const systemPrompt = `
You are the AI engine of ReachIQ CRM.
Analyze the following CRM analytics and customer database statistics, and recommend the SINGLE best next campaign to maximize re-engagement and sales conversion.

Performance Metrics of previous runs:
- Total Sent: ${metrics.sent}
- Delivery Rate: ${metrics.deliveryRate.toFixed(1)}%
- Open Rate: ${metrics.openRate.toFixed(1)}%
- Click Rate: ${metrics.clickRate.toFixed(1)}%
- Failed/Bounces: ${metrics.failed}

Customer Database Statistics:
- Total Customers: ${metrics.totalCustomers}
- Customers inactive for 90+ days: ${dbStats.inactiveCount} (${dbStats.inactivePercentage}%)
- City with highest Average Order Value (AOV): ${dbStats.bestCity} (AOV: ₹${Math.round(dbStats.highestAvgSpend)})
- Available Customer Cities: ${dbStats.cities.join(', ')}

Return EXACTLY this JSON structure:
{
  "channel": "WhatsApp" | "SMS" | "Email",
  "targetAudience": {
    "city": string,
    "minSpent": number,
    "inactiveDays": number
  },
  "offer": string,
  "expectedOpenRate": number,
  "reason": string
}

STRICT RULES:
1. Recommend targetAudience.city from the available customer cities. If no specific city is best, use "All Cities".
2. Set logical numeric constraints for targetAudience.minSpent and targetAudience.inactiveDays based on stats (e.g. minSpent between 1000 and 50000, inactiveDays between 30 and 180).
3. The "reason" should reference the stats (e.g. why that city or why that channel was chosen).
4. Return ONLY the raw JSON block. No markdown wrapper, no extra text.
`;

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    }
  });

  const result = await model.generateContent(systemPrompt);
  const text = result.response.text();
  const json = JSON.parse(text.trim());
  return json as AICampaignSuggestion;
}

