const prisma = require('../utils/prisma');
const { generateDiscountCode } = require('../utils/helpers');

const scheduleCampaignMessages = async (enrollmentId, customer, discountCode) => {
  const enrollment = await prisma.smsCampaignEnrollment.findUnique({
    where: { id: enrollmentId },
    include: { campaign: { include: { steps: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } } } },
  });

  if (!enrollment) return;

  const vars = {
    name: customer.name,
    discountCode: discountCode?.code || '',
    expiryDate: discountCode ? new Date(discountCode.expiresAt).toLocaleDateString('da-DK') : '',
  };

  for (const step of enrollment.campaign.steps) {
    const message = step.message
      .replace(/\{\{name\}\}/g, vars.name)
      .replace(/\{\{discountCode\}\}/g, vars.discountCode)
      .replace(/\{\{expiryDate\}\}/g, vars.expiryDate);

    const scheduledFor = new Date(enrollment.enrolledAt);
    scheduledFor.setDate(scheduledFor.getDate() + step.dayOffset);

    await prisma.smsMessage.create({
      data: {
        customerId: customer.id,
        enrollmentId,
        phone: customer.phone,
        message,
        scheduledFor,
        status: scheduledFor <= new Date() ? 'PENDING' : 'SCHEDULED',
      },
    });
  }
};

const sendSms = async (phone, message) => {
  console.log(`\n[SMS] Attempting to send to ${phone}...`);
  if (process.env.GATEWAYAPI_TOKEN) {
    try {
      const fetch = (await import('node-fetch')).default;
      const recipientNumber = parseInt(phone.replace(/\D/g, ''), 10);
      
      const payload = {
        sender: process.env.GATEWAYAPI_SENDER,
        message: message,
        recipient: recipientNumber
      };
      
      console.log(`[SMS] Payload to GatewayAPI:`, payload);

      const response = await fetch('https://messaging.gatewayapi.com/mobile/single', {
        method: 'POST',
        headers: {
          'Authorization': 'Token ' + process.env.GATEWAYAPI_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      console.log(`[SMS] GatewayAPI Response HTTP ${response.status}:`, data);
      
      if (!response.ok) {
        throw new Error(data.message || data.detail || 'GatewayAPI error');
      }
      return { 
        sent: true, 
        provider: 'gatewayapi', 
        gatewayId: data.ids ? String(data.ids[0]) : (data.msg_id ? String(data.msg_id) : null) 
      };
    } catch (err) {
      console.error('[SMS] GatewayAPI SMS error:', err.message);
      return { sent: false, error: err.message };
    }
  }

  console.log(`[SMS STUB] To: ${phone} | Message: ${message}`);
  return { sent: true, provider: 'stub', gatewayId: 'stub_' + Date.now() };
};

const processPendingSms = async () => {
  const now = new Date();
  console.log(`\n[SMS] processPendingSms triggered at ${now.toISOString()}`);
  const pending = await prisma.smsMessage.findMany({
    where: {
      status: { in: ['SCHEDULED', 'PENDING'] },
      scheduledFor: { lte: now },
    },
    include: { customer: true },
    take: 50,
  });

  console.log(`[SMS] Found ${pending.length} pending messages to send.`);

  for (const msg of pending) {
    if (!msg.customer.smsMarketingConsent || msg.customer.smsOptOut) {
      console.log(`[SMS] Skipping msg ID ${msg.id} due to opt-out or missing consent`);
      await prisma.smsMessage.update({
        where: { id: msg.id },
        data: { status: 'CANCELLED' },
      });
      continue;
    }

    const result = await sendSms(msg.phone, msg.message);
    console.log(`[SMS] DB Update for msg ID ${msg.id}: status=${result.sent ? 'SENT' : 'FAILED'} gatewayId=${result.gatewayId || 'N/A'}`);
    await prisma.smsMessage.update({
      where: { id: msg.id },
      data: {
        status: result.sent ? 'SENT' : 'FAILED',
        sentAt: result.sent ? new Date() : null,
        gatewayId: result.gatewayId || null,
      },
    });
  }
};

const cancelPendingCampaignMessages = async (customerId) => {
  await prisma.smsMessage.updateMany({
    where: { customerId: customerId, status: { in: ['SCHEDULED', 'PENDING'] } },
    data: { status: 'CANCELLED' },
  });
};

const handleSmsOptOut = async (phone) => {
  const customer = await prisma.customer.findFirst({ where: { phone } });
  if (!customer) return false;

  await prisma.customer.update({
    where: { id: customer.id },
    data: { smsOptOut: true, smsOptOutAt: new Date(), smsMarketingConsent: false },
  });

  await prisma.smsMessage.updateMany({
    where: { customerId: customer.id, status: { in: ['SCHEDULED', 'PENDING'] } },
    data: { status: 'CANCELLED' },
  });

  return true;
};

const registerSmsSignup = async ({ name, phone, email, school, gdprConsent, campaignId }) => {
  phone = phone.replace(/^\+/, '');
  const localPhone = phone.length > 8 ? phone.slice(-8) : phone;
  console.log(`\n[SMS] registerSmsSignup called for: ${name} (${phone}, local: ${localPhone}) - Campaign: ${campaignId}`);
  if (!gdprConsent) {
    console.error('[SMS] GDPR consent missing');
    throw new Error('GDPR consent is required');
  }

  const existingPhone = await prisma.customer.findFirst({ where: { phone } });
  if (existingPhone?.smsMarketingConsent && !existingPhone.smsOptOut) {
    const existingCode = await prisma.discountCode.findFirst({
      where: { customerId: existingPhone.id, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (existingCode) {
      return { customer: existingPhone, discountCode: existingCode, alreadyRegistered: true };
    }
  }

  let customer = await prisma.customer.findUnique({ where: { email } });
  if (customer) {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        name,
        phone,
        school: school || customer.school,
        smsMarketingConsent: true,
        smsConsentAt: new Date(),
        gdprConsentAt: new Date(),
        smsOptOut: false,
        smsOptOutAt: null,
      },
    });
  } else {
    customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        school,
        smsMarketingConsent: true,
        smsConsentAt: new Date(),
        gdprConsentAt: new Date(),
      },
    });
  }

  let campaign = null;
  if (campaignId) {
    campaign = await prisma.smsCampaign.findUnique({ where: { id: parseInt(campaignId) } });
  }
  if (!campaign) {
    campaign = await prisma.smsCampaign.findFirst({ where: { isActive: true } });
  }

  let discountCode = null;
  if (campaign && campaign.discountValue && campaign.discountValue > 0 && campaign.discountType) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 20);

    discountCode = await prisma.discountCode.create({
      data: {
        code: localPhone,
        type: campaign.discountType,
        value: campaign.discountValue,
        expiresAt,
        phoneNumber: phone,
        customerId: customer.id,
        source: 'QR',
      },
    });
  }

  if (campaign) {
    const enrollment = await prisma.smsCampaignEnrollment.create({
      data: {
        campaignId: campaign.id,
        customerId: customer.id,
        discountCodeId: discountCode ? discountCode.id : null,
      },
    });
    await scheduleCampaignMessages(enrollment.id, customer, discountCode);
    
    // Process immediate (Day 0) messages instantly without waiting for the 15m cron job
    processPendingSms().catch(err => console.error("Failed to send instant SMS:", err.message));
  }

  return { customer, discountCode, alreadyRegistered: false };
};

module.exports = {
  scheduleCampaignMessages,
  sendSms,
  processPendingSms,
  cancelPendingCampaignMessages,
  handleSmsOptOut,
  registerSmsSignup,
};
