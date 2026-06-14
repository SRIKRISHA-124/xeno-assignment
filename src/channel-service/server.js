const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const CRM_RECEIPT_URL = process.env.CRM_RECEIPT_URL || 'http://localhost:3000/api/receipt';

console.log("=========================================");
console.log("ReachIQ Channel Service Starting...");
console.log("Target CRM Callback URL:", CRM_RECEIPT_URL);
console.log("NOTE: At scale, this stateless service would use a robust message queue (e.g. BullMQ, SQS, RabbitMQ).");
console.log("For this local/sandbox scope, we utilize direct HTTP callback workers with asynchronous setTimeout event loops.");
console.log("=========================================");

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ReachIQ Channel Service' });
});

// Helper function to send status receipt callback with retries
async function sendCallbackWithRetry(payload, attempt = 1) {
  const maxAttempts = 3;
  const backoffDelay = attempt * 2000; // 2s, 4s, 6s

  try {
    const response = await fetch(CRM_RECEIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`[Callback SUCCESS] Campaign ${payload.campaign_id}, Customer ${payload.customer_id} -> ${payload.status}`);
      return true;
    } else {
      console.warn(`[Callback FAILED] Status ${response.status} on attempt ${attempt} for Customer ${payload.customer_id} (${payload.status})`);
      if (attempt < maxAttempts) {
        setTimeout(() => sendCallbackWithRetry(payload, attempt + 1), backoffDelay);
      }
      return false;
    }
  } catch (error) {
    console.error(`[Callback ERROR] ${error.message} on attempt ${attempt} for Customer ${payload.customer_id} (${payload.status})`);
    if (attempt < maxAttempts) {
      setTimeout(() => sendCallbackWithRetry(payload, attempt + 1), backoffDelay);
    }
    return false;
  }
}

// Main Send Campaign Endpoint
app.post('/send', (req, res) => {
  const { campaignId, channel, recipients } = req.body;

  if (!campaignId || !recipients || !Array.isArray(recipients)) {
    return res.status(400).json({ error: 'Missing campaignId or recipients array' });
  }

  console.log(`\n[Launch Campaign] Received campaign: ${campaignId} via ${channel.toUpperCase()} for ${recipients.length} recipients.`);

  // Acknowledge campaign launch immediately
  res.status(202).json({
    success: true,
    message: 'Campaign processing initiated',
    estimatedRecipients: recipients.length
  });

  // Process each recipient asynchronously in the background
  recipients.forEach((recipient) => {
    // Determine lifecycle path for this user
    // We want realistic statistics:
    // - 5% fail at 'sent' (leads to 'failed' status)
    // - 95% reach 'delivered'
    // - Of those delivered, ~60% get 'opened'
    // - Of those opened, ~30% get 'clicked'
    
    const rand = Math.random();
    let finalStage = 'delivered'; // Default fallback
    
    if (rand < 0.05) {
      finalStage = 'failed';
    } else if (rand < 0.45) {
      finalStage = 'delivered'; // Stays at delivered
    } else if (rand < 0.80) {
      finalStage = 'opened';    // Opened but not clicked
    } else {
      finalStage = 'clicked';   // Opened and clicked
    }

    const stages = ['sent'];
    if (finalStage === 'failed') {
      stages.push('failed');
    } else {
      stages.push('delivered');
      if (finalStage === 'opened' || finalStage === 'clicked') {
        stages.push('opened');
      }
      if (finalStage === 'clicked') {
        stages.push('clicked');
      }
    }

    // Schedule the states with random delays (2s - 10s per transition)
    let accumulatedDelay = 0;

    stages.forEach((status, index) => {
      // Add random delay between 2 and 10 seconds for each stage
      const stepDelay = Math.floor(Math.random() * 8000) + 2000;
      accumulatedDelay += stepDelay;

      setTimeout(() => {
        const payload = {
          campaign_id: campaignId,
          customer_id: recipient.id,
          status: status,
          error_message: status === 'failed' ? 'Simulated delivery channel bounce' : null,
          timestamp: new Date().toISOString()
        };

        sendCallbackWithRetry(payload);
      }, accumulatedDelay);
    });
  });
});

app.listen(PORT, () => {
  console.log(`\n[Channel Service Running] Listening on port ${PORT}`);
  console.log(`Ready to process campaign intents.\n`);
});
