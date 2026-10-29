const crypto = require('crypto');

const FLATPAY_API_KEY = process.env.FLATPAY_API_KEY;
const FLATPAY_WEBHOOK_SECRET = process.env.FLATPAY_WEBHOOK_SECRET;

/**
 * Checks if Flatpay / Frisbii is currently the active payment gateway
 * Defaults to 'flatpay' if configured, but can be switched via PAYMENT_GATEWAY env ('flatpay' | 'stripe')
 */
const isFlatpayActive = () => {
  const gateway = (process.env.PAYMENT_GATEWAY || 'flatpay').trim().toLowerCase();
  return gateway === 'flatpay' || gateway === 'frisbii';
};

/**
 * Returns Basic Auth headers for Frisbii / Flatpay API
 */
const getAuthHeaders = () => {
  const token = Buffer.from(`${FLATPAY_API_KEY}:`).toString('base64');
  return {
    'Authorization': `Basic ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
};

/**
 * Create a charge session with Frisbii (Flatpay) Checkout API
 * @param {Object} params
 * @param {string} params.handle - Unique order / transaction handle
 * @param {number} params.amount - Amount in currency units (e.g. DKK)
 * @param {string} [params.currency='DKK']
 * @param {Object} [params.customer] - { email, firstName, lastName, phone }
 * @param {Array} [params.orderLines] - [{ ordertext, amount, quantity }]
 * @param {string} params.acceptUrl - Redirect URL on success
 * @param {string} params.cancelUrl - Redirect URL on cancellation
 * @returns {Promise<{ id: string, url: string }>}
 */
const createChargeSession = async ({
  handle,
  amount,
  currency = 'DKK',
  customer = {},
  orderLines = [],
  acceptUrl,
  cancelUrl
}) => {
  // Minor units: 1 DKK = 100 øre
  const minorAmount = Math.round(Number(amount) * 100);

  const payload = {
    order: {
      handle: String(handle),
      currency: (currency || 'DKK').toUpperCase(),
      customer: {
        email: customer.email || '',
        first_name: customer.firstName || customer.first_name || '',
        last_name: customer.lastName || customer.last_name || '',
        phone: customer.phone || customer.phoneNumber || ''
      }
    },
    accept_url: acceptUrl,
    cancel_url: cancelUrl
  };

  // Frisbii API strictly requires either 'amount' or 'order_lines', not both.
  if (Array.isArray(orderLines) && orderLines.length > 0) {
    payload.order.order_lines = orderLines.map(line => ({
      ordertext: line.ordertext || line.description || line.title || 'Vare',
      amount: Math.round(Number(line.amount || amount) * 100),
      quantity: Number(line.quantity) || 1
    }));
  } else {
    payload.order.amount = minorAmount;
  }

  const response = await fetch('https://checkout-api.frisbii.com/v1/session/charge', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || response.statusText || 'Failed to create Frisbii checkout session';
    throw new Error(`Frisbii / Flatpay API error: ${errorMsg}`);
  }

  return {
    id: data.id,
    url: data.url
  };
};

/**
 * Get invoice by handle from Frisbii API
 */
const getInvoice = async (handle) => {
  try {
    const response = await fetch(`https://api.frisbii.com/v1/invoice/${encodeURIComponent(handle)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching Frisbii invoice ${handle}:`, error.message);
    return null;
  }
};

/**
 * Get charge by handle from Frisbii API
 */
const getCharge = async (handle) => {
  try {
    const response = await fetch(`https://api.frisbii.com/v1/charge/${encodeURIComponent(handle)}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching Frisbii charge ${handle}:`, error.message);
    return null;
  }
};

/**
 * Verifies Frisbii Webhook HMAC-SHA256 signature
 * Formula: hexencode(hmac_sha_256(webhook_secret, timestamp + id))
 */
const verifyWebhookSignature = (payload) => {
  const secret = process.env.FLATPAY_WEBHOOK_SECRET || FLATPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("⚠️ No FLATPAY_WEBHOOK_SECRET configured; skipping signature check.");
    return true;
  }

  const { id, timestamp, signature } = payload || {};
  if (!id || !timestamp || !signature) {
    console.error("❌ Webhook payload missing id, timestamp, or signature");
    return false;
  }

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${timestamp}${id}`);
  const expectedSig = hmac.digest('hex');

  const matches = expectedSig === signature;
  if (!matches) {
    console.error("❌ Frisbii signature mismatch. Expected:", expectedSig, "Received:", signature);
  }
  return matches;
};

module.exports = {
  isFlatpayActive,
  createChargeSession,
  getInvoice,
  getCharge,
  verifyWebhookSignature,
  getAuthHeaders
};
