require('dotenv').config();
const flatpayService = require('../services/flatpay.service');

async function syncWebhook() {
  const targetUrl = process.argv[2] || process.env.FLATPAY_WEBHOOK_URL;
  if (!targetUrl) {
    console.log("Usage: node src/scripts/syncFrisbiiWebhook.js <WEBHOOK_URL>");
    console.log("Example: node src/scripts/syncFrisbiiWebhook.js https://yourdomain.com/api/webhook/frisbii");
    return;
  }

  try {
    const authHeaders = flatpayService.getAuthHeaders();
    const getRes = await fetch('https://api.frisbii.com/v1/account/webhook_settings', {
      method: 'GET',
      headers: authHeaders
    });

    if (!getRes.ok) {
      throw new Error(`Failed to fetch current settings: ${getRes.status} ${getRes.statusText}`);
    }

    const currentSettings = await getRes.json();
    console.log("Current Frisbii Webhook URLs:", currentSettings.urls);

    const urls = new Set(currentSettings.urls || []);
    urls.add(targetUrl);

    const updatePayload = {
      urls: Array.from(urls),
      disabled: false,
      event_types: currentSettings.event_types || [
        "invoice_authorized",
        "invoice_settled",
        "invoice_failed",
        "invoice_cancelled",
        "invoice_refund"
      ]
    };

    const putRes = await fetch('https://api.frisbii.com/v1/account/webhook_settings', {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(updatePayload)
    });

    if (!putRes.ok) {
      const err = await putRes.text();
      throw new Error(`Failed to update settings: ${putRes.status} ${err}`);
    }

    const updated = await putRes.json();
    console.log("✅ Successfully updated Frisbii Webhook settings!");
    console.log("Active Webhook URLs:", updated.urls);
  } catch (err) {
    console.error("❌ Error updating Frisbii Webhook settings:", err.message);
  }
}

syncWebhook();

