require('dotenv').config();
const crypto = require('crypto');

const port = process.env.PORT || 5000;
const secret = process.env.FLATPAY_WEBHOOK_SECRET || 'webhook_secret_fe60a5ae8b9c972a28488621e205b51b';

const eventId = "evt_local_test_" + Date.now();
const timestamp = Math.floor(Date.now() / 1000);

// Generate valid Frisbii signature
const hmac = crypto.createHmac('sha256', secret);
hmac.update(`${timestamp}${eventId}`);
const signature = hmac.digest('hex');

// Sample test payload
const testPayload = {
  id: eventId,
  timestamp: timestamp,
  signature: signature,
  event_type: "invoice_settled",
  invoice: process.argv[2] || "test_invoice_123"
};

console.log("🚀 Sending simulated Frisbii webhook to http://localhost:" + port + "/api/webhook/frisbii ...");
console.log("Payload:", JSON.stringify(testPayload, null, 2));

fetch(`http://localhost:${port}/api/webhook/frisbii`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testPayload)
})
  .then(async (res) => {
    const text = await res.text();
    console.log(`\nResponse Status: ${res.status} ${res.statusText}`);
    console.log("Response Body:", text);
    if (res.ok) {
      console.log("\n✅ Webhook endpoint successfully received and processed the event!");
    } else {
      console.log("\n❌ Webhook returned an error status.");
    }
  })
  .catch((err) => {
    console.error("\n❌ Could not connect to localhost:" + port + ". Is your backend running?\nError:", err.message);
  });

