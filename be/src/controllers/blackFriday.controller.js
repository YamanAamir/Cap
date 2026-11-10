const prisma = require('../utils/prisma');
const { sendSms, normalizeRecipientPhone } = require('../services/sms.service');
const { getTransporter } = require('../utils/mailer');

// Secret verification token shared with the WordPress embed form
const VIP_SECRET_TOKEN = process.env.BLACK_FRIDAY_TOKEN;

// In-memory rate limiting map: ip -> timestamps[]
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 20;

function checkRateLimit(ip) {
  if (!ip) return true;
  const now = Date.now();
  let timestamps = rateLimitMap.get(ip) || [];
  timestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return true;
}

// Allowed origins/referers for the WordPress form
function isAllowedOrigin(req) {
  const origin = req.headers['origin'] || '';
  const referer = req.headers['referer'] || '';
  const host = req.headers['host'] || '';

  // If running in development / test
  if (process.env.NODE_ENV === 'development' || host.includes('localhost') || host.includes('127.0.0.1')) {
    return true;
  }

  const allowedPatterns = [
    'studentlife.dk',
    'www.studentlife.dk',
    'preview.studentlife.dk',
    'capdashboard.studentlife.dk'
  ];

  const check = (str) => allowedPatterns.some(pattern => str.toLowerCase().includes(pattern));

  // If either origin or referer matches studentlife.dk
  if (origin && check(origin)) return true;
  if (referer && check(referer)) return true;

  // In case origin and referer are stripped by strict browser policies, we also require the secret header
  return false;
}

/**
 * Public VIP Registration Endpoint
 * POST /api/black-friday/register
 */
const registerLead = async (req, res) => {
  try {
    const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
    const userAgent = req.headers['user-agent'] || '';

    // 1. Anti-bot honeypot check (website_hp must be empty)
    if (req.body.website_hp && String(req.body.website_hp).trim().length > 0) {
      console.warn(`[BlackFriday] Bot detected via honeypot from IP ${ip}`);
      // Silently return success to confuse bot
      return res.status(200).json({
        success: true,
        message: 'Tak! Du er nu tilmeldt VIP-listen.'
      });
    }

    // 2. Secret token check
    const clientToken = req.headers['x-bw-token'] || req.headers['x-vip-token'] || req.body._bw_token;
    const originAllowed = isAllowedOrigin(req);

    if (clientToken !== VIP_SECRET_TOKEN && !originAllowed) {
      console.warn(`[BlackFriday] Unauthorized registration attempt: invalid token and origin. Origin: ${req.headers['origin']}, Referer: ${req.headers['referer']}, IP: ${ip}`);
      return res.status(403).json({
        success: false,
        error: 'Uautoriseret adgang. Registrering skal ske via den officielle Student Life hjemmeside.'
      });
    }

    // 3. Rate limiting check
    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        success: false,
        error: 'For mange forsøg fra denne forbindelse. Vent venligst et par minutter og prøv igen.'
      });
    }

    // 4. Validate and sanitize inputs
    const fullName = String(req.body.full_name || req.body.name || '').trim();
    const rawEmail = String(req.body.email || '').trim().toLowerCase();
    const rawPhone = String(req.body.phone || '').trim();
    const school = req.body.school ? String(req.body.school).trim() : null;

    if (!fullName || fullName.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Venligst indtast dit fulde navn.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!rawEmail || !emailRegex.test(rawEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Venligst indtast en gyldig e-mailadresse.'
      });
    }

    const normalizedPhone = normalizeRecipientPhone(rawPhone);
    if (!normalizedPhone || normalizedPhone.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Venligst indtast et gyldigt telefonnummer (f.eks. 8 cifre).'
      });
    }

    // 5. Check if lead already exists
    const existing = await prisma.blackFridayLead.findFirst({
      where: {
        OR: [
          { email: rawEmail },
          { phone: normalizedPhone }
        ]
      }
    });

    if (existing) {
      // Update details to make sure phone & name are fresh
      const updated = await prisma.blackFridayLead.update({
        where: { id: existing.id },
        data: {
          name: fullName || existing.name,
          phone: normalizedPhone || existing.phone,
          school: school || existing.school,
          ip: ip || existing.ip,
          userAgent: userAgent || existing.userAgent,
          updatedAt: new Date()
        }
      });

      return res.status(200).json({
        success: true,
        alreadyRegistered: true,
        message: `Du er allerede skrevet op til vores VIP-liste! Vi sender dit eksklusive link på SMS og e-mail, så snart Black Week åbner.`,
        lead: {
          id: updated.id,
          name: updated.name,
          email: updated.email
        }
      });
    }

    // 6. Create new VIP Lead
    const newLead = await prisma.blackFridayLead.create({
      data: {
        name: fullName,
        email: rawEmail,
        phone: normalizedPhone,
        school,
        ip,
        userAgent,
        source: 'wordpress_vip'
      }
    });

    console.log(`[BlackFriday] 🎉 New VIP Lead registered: ${fullName} (${rawEmail}, ${normalizedPhone})`);

    return res.status(201).json({
      success: true,
      message: `Tak ${fullName}! Du er nu officielt tilmeldt Black Week VIP-listen. Hold øje med din indbakke og SMS!`,
      lead: {
        id: newLead.id,
        name: newLead.name,
        email: newLead.email
      }
    });
  } catch (error) {
    console.error('[BlackFriday] Error registering lead:', error);
    return res.status(500).json({
      success: false,
      error: 'Der opstod en fejl under tilmeldingen. Prøv venligst igen om et øjeblik.'
    });
  }
};

/**
 * Admin: Get all leads with pagination, search, date filtering, and KPI stats
 * GET /api/admin/black-friday/leads
 */
const getLeads = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit) || 25));
    const skip = (page - 1) * limit;

    const { search, dateFrom, dateTo } = req.query;

    const where = {};

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { school: { contains: q } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    const [leads, totalCount] = await Promise.all([
      prisma.blackFridayLead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.blackFridayLead.count({ where })
    ]);

    // KPI Summary Calculations
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [allTotal, todayCount, aggregations] = await Promise.all([
      prisma.blackFridayLead.count(),
      prisma.blackFridayLead.count({
        where: { createdAt: { gte: todayStart } }
      }),
      prisma.blackFridayLead.aggregate({
        _sum: {
          smsSentCount: true,
          emailSentCount: true
        }
      })
    ]);

    return res.json({
      success: true,
      leads,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1
      },
      stats: {
        total: allTotal,
        today: todayCount,
        smsSentTotal: aggregations._sum.smsSentCount || 0,
        emailSentTotal: aggregations._sum.emailSentCount || 0
      }
    });
  } catch (error) {
    console.error('[BlackFriday] Error getting leads:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve leads' });
  }
};

/**
 * Admin: Delete single lead
 * DELETE /api/admin/black-friday/leads/:id
 */
const deleteLead = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.blackFridayLead.delete({ where: { id } });
    return res.json({ success: true, message: 'VIP Lead deleted successfully' });
  } catch (error) {
    console.error('[BlackFriday] Error deleting lead:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete lead' });
  }
};

/**
 * Admin: Bulk delete leads
 * POST /api/admin/black-friday/leads/bulk-delete
 */
const bulkDeleteLeads = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'No lead IDs provided' });
    }

    const numIds = ids.map(id => parseInt(id, 10)).filter(Boolean);
    const result = await prisma.blackFridayLead.deleteMany({
      where: { id: { in: numIds } }
    });

    return res.json({
      success: true,
      message: `Successfully deleted ${result.count} lead(s)`
    });
  } catch (error) {
    console.error('[BlackFriday] Error bulk deleting leads:', error);
    return res.status(500).json({ success: false, error: 'Failed to bulk delete leads' });
  }
};

/**
 * Admin: Broadcast SMS to all or selected leads
 * POST /api/admin/black-friday/broadcast-sms
 */
const broadcastSms = async (req, res) => {
  try {
    const { leadIds, message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'SMS message text is required' });
    }

    let leads = [];
    if (leadIds === 'all' || !Array.isArray(leadIds) || leadIds.length === 0) {
      leads = await prisma.blackFridayLead.findMany();
    } else {
      const ids = leadIds.map(id => parseInt(id, 10)).filter(Boolean);
      leads = await prisma.blackFridayLead.findMany({
        where: { id: { in: ids } }
      });
    }

    if (leads.length === 0) {
      return res.status(400).json({ success: false, error: 'No recipients found for this broadcast' });
    }

    let sentCount = 0;
    let failedCount = 0;
    const errors = [];

    // Send in sequence or small batches to respect rate limits
    for (const lead of leads) {
      if (!lead.phone) {
        failedCount++;
        continue;
      }

      // Personalize message with {{name}}
      const personalizedMessage = message.replace(/\{\{name\}\}/gi, lead.name || 'Student');

      try {
        const smsResult = await sendSms(lead.phone, personalizedMessage);
        if (smsResult && smsResult.sent) {
          sentCount++;
          // Increment smsSentCount for this lead
          await prisma.blackFridayLead.update({
            where: { id: lead.id },
            data: {
              smsSentCount: { increment: 1 },
              lastContactedAt: new Date()
            }
          });
        } else {
          failedCount++;
          errors.push(`${lead.phone}: ${smsResult?.error || 'Send failed'}`);
        }
      } catch (err) {
        failedCount++;
        errors.push(`${lead.phone}: ${err.message}`);
      }
    }

    return res.json({
      success: true,
      total: leads.length,
      sentCount,
      failedCount,
      errors: errors.slice(0, 10) // top 10 errors
    });
  } catch (error) {
    console.error('[BlackFriday] Error broadcasting SMS:', error);
    return res.status(500).json({ success: false, error: 'Failed to broadcast SMS' });
  }
};

/**
 * Admin: Broadcast Email to all or selected leads
 * POST /api/admin/black-friday/broadcast-email
 */
const broadcastEmail = async (req, res) => {
  try {
    const { leadIds, subject, html } = req.body;
    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, error: 'Email subject is required' });
    }
    if (!html || !html.trim()) {
      return res.status(400).json({ success: false, error: 'Email content is required' });
    }

    let leads = [];
    if (leadIds === 'all' || !Array.isArray(leadIds) || leadIds.length === 0) {
      leads = await prisma.blackFridayLead.findMany();
    } else {
      const ids = leadIds.map(id => parseInt(id, 10)).filter(Boolean);
      leads = await prisma.blackFridayLead.findMany({
        where: { id: { in: ids } }
      });
    }

    if (leads.length === 0) {
      return res.status(400).json({ success: false, error: 'No recipients found for this broadcast' });
    }

    const transporter = getTransporter();
    const fromAddress = process.env.EMAIL_FROM || 'StudentLife <info@studentlife.dk>';

    let sentCount = 0;
    let failedCount = 0;
    const errors = [];

    for (const lead of leads) {
      if (!lead.email) {
        failedCount++;
        continue;
      }

      const personalizedHtml = html.replace(/\{\{name\}\}/gi, lead.name || 'Kære Kunde');
      const personalizedSubject = subject.replace(/\{\{name\}\}/gi, lead.name || 'Kære Kunde');

      try {
        await transporter.sendMail({
          from: fromAddress,
          to: lead.email,
          subject: personalizedSubject,
          html: personalizedHtml
        });

        sentCount++;
        await prisma.blackFridayLead.update({
          where: { id: lead.id },
          data: {
            emailSentCount: { increment: 1 },
            lastContactedAt: new Date()
          }
        });
      } catch (err) {
        failedCount++;
        errors.push(`${lead.email}: ${err.message}`);
      }
    }

    return res.json({
      success: true,
      total: leads.length,
      sentCount,
      failedCount,
      errors: errors.slice(0, 10)
    });
  } catch (error) {
    console.error('[BlackFriday] Error broadcasting Email:', error);
    return res.status(500).json({ success: false, error: 'Failed to broadcast Email' });
  }
};

/**
 * Admin: Export leads to CSV
 * GET /api/admin/black-friday/export
 */
const exportLeadsCsv = async (req, res) => {
  try {
    const leads = await prisma.blackFridayLead.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const headers = ['ID', 'Name', 'Email', 'Phone', 'School', 'Source', 'SMS Sent', 'Email Sent', 'Created At'];
    const rows = leads.map(l => [
      l.id,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${l.phone || ''}"`,
      `"${(l.school || '').replace(/"/g, '""')}"`,
      `"${l.source || ''}"`,
      l.smsSentCount || 0,
      l.emailSentCount || 0,
      `"${new Date(l.createdAt).toISOString()}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="studentlife_black_friday_leads_${Date.now()}.csv"`);
    return res.status(200).send('\uFEFF' + csvContent); // \uFEFF BOM for Excel utf-8 support
  } catch (error) {
    console.error('[BlackFriday] Error exporting CSV:', error);
    return res.status(500).json({ success: false, error: 'Failed to export CSV' });
  }
};

module.exports = {
  registerLead,
  getLeads,
  deleteLead,
  bulkDeleteLeads,
  broadcastSms,
  broadcastEmail,
  exportLeadsCsv,
  VIP_SECRET_TOKEN
};

