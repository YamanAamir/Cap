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
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await twilio.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
      return { sent: true, provider: 'twilio' };
    } catch (err) {
      console.error('Twilio SMS error:', err.message);
      return { sent: false, error: err.message };
    }
  }

  console.log(`[SMS STUB] To: ${phone} | Message: ${message}`);
  return { sent: true, provider: 'stub' };
};

const processPendingSms = async () => {
  const now = new Date();
  const pending = await prisma.smsMessage.findMany({
    where: {
      status: { in: ['SCHEDULED', 'PENDING'] },
      scheduledFor: { lte: now },
    },
    include: { customer: true },
    take: 50,
  });

  for (const msg of pending) {
    if (!msg.customer.smsMarketingConsent || msg.customer.smsOptOut) {
      await prisma.smsMessage.update({
        where: { id: msg.id },
        data: { status: 'CANCELLED' },
      });
      continue;
    }

    const result = await sendSms(msg.phone, msg.message);
    await prisma.smsMessage.update({
      where: { id: msg.id },
      data: {
        status: result.sent ? 'SENT' : 'FAILED',
        sentAt: result.sent ? new Date() : null,
      },
    });
  }
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

const registerSmsSignup = async ({ name, phone, email, gdprConsent, campaignId }) => {
  if (!gdprConsent) {
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
        smsMarketingConsent: true,
        smsConsentAt: new Date(),
        gdprConsentAt: new Date(),
      },
    });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 20);

  const discountCode = await prisma.discountCode.create({
    data: {
      code: generateDiscountCode('SAVE'),
      type: 'PERCENTAGE',
      value: 10,
      expiresAt,
      phoneNumber: phone,
      customerId: customer.id,
      source: 'QR',
    },
  });

  let campaign = null;
  if (campaignId) {
    campaign = await prisma.smsCampaign.findUnique({ where: { id: parseInt(campaignId) } });
  }
  if (!campaign) {
    campaign = await prisma.smsCampaign.findFirst({ where: { isActive: true } });
  }

  if (campaign) {
    const enrollment = await prisma.smsCampaignEnrollment.create({
      data: {
        campaignId: campaign.id,
        customerId: customer.id,
        discountCodeId: discountCode.id,
      },
    });
    await scheduleCampaignMessages(enrollment.id, customer, discountCode);
  }

  return { customer, discountCode, alreadyRegistered: false };
};

module.exports = {
  scheduleCampaignMessages,
  sendSms,
  processPendingSms,
  handleSmsOptOut,
  registerSmsSignup,
};
