const prisma = require('../utils/prisma');
const { sendSms, normalizeRecipientPhone } = require('../services/sms.service');
const { getTransporter } = require('../utils/mailer');

// Secret verification token shared with the WordPress embed form
const VIP_SECRET_TOKEN = process.env.BLACK_FRIDAY_TOKEN || 'sl_bw_sec_f4f1902f4ddc2099617c70cb730b778a586aed48e0791212';

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

  if (origin && check(origin)) return true;
  if (referer && check(referer)) return true;

  return false;
}

/**
 * Standard Student Life Email Template Generator (Matches Customer / Admin / Factory Order Emails)
 * Converts plain text into clean, branded HTML email without requiring the admin to write HTML tags!
 */
function generateOfficialStudentLifeEmailHtml({ name, headline, bodyText, buttonText, buttonUrl }) {
  const safeName = name ? String(name).trim() : 'Kunde';
  const safeHeadline = headline ? String(headline).trim() : '';
  const safeButtonText = buttonText ? String(buttonText).trim() : '';
  const safeButtonUrl = buttonUrl ? String(buttonUrl).trim() : '';

  // Convert plain text into clean paragraphs with line breaks preserved
  const paragraphs = (bodyText || '')
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 14px 0; font-size:16px; line-height:1.6; color:#333333;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeHeadline || 'Studentlife'}</title>
  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <style>
    @media only screen and (max-width: 600px) {
      table[class="container"] { width: 100% !important; }
      td[class="mobile-padding"] { padding: 20px 15px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family:Arial, sans-serif; color:#333333; line-height:1.4;">

  <div style="text-align: center; padding: 20px 5px;">
    <img src="https://studenterhue.studentlife.dk/studentlife/image/landing/email.png" alt="Studentlife" style="max-width: 100%; height: auto;">
  </div>

  <table width="100%" border="0" cellpadding="0" cellspacing="0">
    <tr>
      <td style="height:10px; font-size:0; line-height:0;">&nbsp;</td>
    </tr>
  </table>

  <!-- Full-width wrapper -->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">
    <tr>
      <td align="center">
        <!-- Fixed-width container (700px) -->
        <table width="700" border="0" cellpadding="0" cellspacing="0" class="container" style="max-width:700px; width:100%;">
          <tr>
            <td style="padding:0 20px;">

              <!-- Premium Quality Banner (Official Student Life Email Header) -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f9fafb; border-top:1px solid #e5e7eb; border-bottom:1px solid #e5e7eb;">
                <tr>
                  <td align="center" style="padding:15px 0;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:16px; font-weight:bold; color:#111827; padding:0 15px;">✓ Premium kvalitet</td>
                        <td style="font-size:16px; font-weight:bold; color:#111827; padding:0 15px;">✓ Personligt design</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:20px; font-size:0; line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Greeting Section -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:18px; font-weight:bold; padding-bottom:15px; color:#111827;">
                    Kære: ${safeName},
                  </td>
                </tr>
              </table>

              <!-- Headline Banner if provided -->
              ${safeHeadline ? `
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom:15px;">
                <tr>
                  <td style="background-color:#f2f3f2; padding:15px 20px; font-weight:bold; font-size:17px; text-align:center; color:#111827;">
                    ${safeHeadline}
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Content Box -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color:#f2f3f2; padding:30px 25px; margin-bottom:20px;">
                <tr>
                  <td style="font-size:15px; line-height:1.6; color:#333333;">
                    ${paragraphs || '<p style="margin:0; font-size:16px; line-height:1.6;">Du er hermed tilmeldt Student Life Black Week VIP!</p>'}
                  </td>
                </tr>
              </table>

              <!-- Optional Call-To-Action Button -->
              ${safeButtonText && safeButtonUrl ? `
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:20px 0 15px;">
                <tr>
                  <td align="center">
                    <a href="${safeButtonUrl}" style="background-color:#111827; color:#ffffff; font-size:16px; font-weight:bold; text-decoration:none; padding:15px 35px; display:inline-block; border-radius:4px; text-transform:uppercase; letter-spacing:0.5px;">
                      ${safeButtonText}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}

              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:15px; font-size:0; line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Official Signature (Matches Order Confirmation Email) -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top:1px solid #cdcdcd; margin-top:20px;">
                <tr>
                  <td style="font-size:14px; padding-top:15px; color:#333333; line-height:1.5;">
                    <p style="margin:0 0 10px 0;">Er du i tvivl om noget? Kundeservice altid klar, hvis du har brug for hjælp.</p>
                    <p style="margin:0 0 10px 0;">Vi ønsker dig en dejlig dag,</p>
                    <p style="margin:0; font-weight:bold;">Studentlife 😊</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * Public VIP Registration Endpoint
 * POST /api/black-friday/register
 */
const registerLead = async (req, res) => {
  try {
    const ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
    const userAgent = req.headers['user-agent'] || '';

    // 1. Anti-bot honeypot check
    if (req.body.website_hp && String(req.body.website_hp).trim().length > 0) {
      console.warn(`[BlackFriday] Bot detected via honeypot from IP ${ip}`);
      return res.status(200).json({
        success: true,
        message: 'Tak! Du er nu tilmeldt VIP-listen.'
      });
    }

    // 2. Secret token check
    const clientToken = req.headers['x-bw-token'] || req.headers['x-vip-token'] || req.body._bw_token;
    const originAllowed = isAllowedOrigin(req);

    if (clientToken !== VIP_SECRET_TOKEN && !originAllowed) {
      console.warn(`[BlackFriday] Unauthorized registration attempt: invalid token and origin. IP: ${ip}`);
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

    // 4. Validate inputs
    const fullName = String(req.body.full_name || req.body.name || '').trim();
    const rawEmail = String(req.body.email || '').trim().toLowerCase();
    const rawPhone = String(req.body.phone || '').trim();
    const school = req.body.school ? String(req.body.school).trim() : null;

    if (!fullName || fullName.length < 2) {
      return res.status(400).json({ success: false, error: 'Venligst indtast dit fulde navn.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!rawEmail || !emailRegex.test(rawEmail)) {
      return res.status(400).json({ success: false, error: 'Venligst indtast en gyldig e-mailadresse.' });
    }

    const normalizedPhone = normalizeRecipientPhone(rawPhone);
    if (!normalizedPhone || normalizedPhone.length < 8) {
      return res.status(400).json({ success: false, error: 'Venligst indtast et gyldigt telefonnummer (f.eks. 8 cifre).' });
    }

    // 5. Existing check
    let lead = await prisma.blackFridayLead.findFirst({
      where: {
        OR: [{ email: rawEmail }, { phone: normalizedPhone }]
      }
    });

    let isNew = false;
    if (lead) {
      lead = await prisma.blackFridayLead.update({
        where: { id: lead.id },
        data: {
          name: fullName || lead.name,
          phone: normalizedPhone || lead.phone,
          school: school || lead.school,
          ip: ip || lead.ip,
          userAgent: userAgent || lead.userAgent,
          updatedAt: new Date()
        }
      });
    } else {
      lead = await prisma.blackFridayLead.create({
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
      isNew = true;
      console.log(`[BlackFriday] 🎉 New VIP Lead registered: ${fullName} (${rawEmail}, ${normalizedPhone})`);
    }

    // 6. Send Customer Confirmation Email (ONLY FOR NEW REGISTRATIONS)
    if (isNew) {
      try {
        const transporter = getTransporter();
        const fromAddress = process.env.EMAIL_FROM || 'StudentLife <salg@studentlife.dk>';

        const customerConfirmationSubject = 'Du er på VIP-listen! 🖤';
        const customerConfirmationBody = `Du er nu et skridt tættere på årets Black Week-tilbud hos Student Life!\n\nHold øje med din mail og SMS. Vi sender dig dit personlige VIP-link, så snart din eksklusive adgang åbner.\n\nVi ses til Black Week!`;

        const customerHtml = generateOfficialStudentLifeEmailHtml({
          name: fullName,
          headline: 'Du er på VIP-listen! 🖤',
          bodyText: customerConfirmationBody,
          buttonText: '',
          buttonUrl: ''
        });

        transporter.sendMail({
          from: fromAddress,
          to: rawEmail,
          subject: customerConfirmationSubject,
          html: customerHtml
        })
          .then(async () => {
            await prisma.blackFridayLead.update({
              where: { id: lead.id },
              data: { emailSentCount: { increment: 1 }, lastContactedAt: new Date() }
            });
            console.log(`[BlackFriday] Confirmation email successfully sent to ${rawEmail}`);
          })
          .catch(err => console.error('[BlackFriday] Failed to send customer confirmation email:', err.message));

        // 7. Send Notification Email to Client/Admin (if configured in Dashboard)
        const setting = await prisma.systemSetting.findUnique({
          where: { key: 'black_friday_settings' }
        });

        let targetAdminEmail = 'salg@studentlife.dk';
        let isNotifyEnabled = true;

        if (setting && setting.value) {
          const val = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
          if (val && val.notifyEmail) targetAdminEmail = String(val.notifyEmail).trim();
          if (val && typeof val.notifyEnabled === 'boolean') isNotifyEnabled = val.notifyEnabled;
        }

        if (isNotifyEnabled && targetAdminEmail) {
          const formattedTime = new Date().toLocaleString('da-DK', {
            timeZone: 'Europe/Copenhagen',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          const adminNotificationHtml = generateOfficialStudentLifeEmailHtml({
            name: 'Administrator',
            headline: 'Ny VIP Tilmelding Modtaget 🔔',
            bodyText: `En ny kunde har netop tilmeldt sig Black Week VIP-listen på studentlife.dk:\n\n• Navn: ${fullName}\n• E-mail: ${rawEmail}\n• Telefon: ${normalizedPhone}\n• Skole: ${school || 'Ikke angivet'}\n• Tidspunkt: ${formattedTime}\n\nKunden har automatisk modtaget bekræftelsesmailen.`,
            buttonText: '',
            buttonUrl: ''
          });

          transporter.sendMail({
            from: fromAddress,
            to: targetAdminEmail,
            subject: `🔔 Ny Black Week VIP-tilmelding: ${fullName}`,
            html: adminNotificationHtml
          })
            .then(() => console.log(`[BlackFriday] Admin notification email sent to ${targetAdminEmail}`))
            .catch(err => console.error('[BlackFriday] Failed to send admin notification email:', err.message));
        }
      } catch (emailErr) {
        console.error('[BlackFriday] Registration email dispatch error:', emailErr.message);
      }
    }

    return res.status(isNew ? 201 : 200).json({
      success: true,
      alreadyRegistered: !isNew,
      message: isNew
        ? `Tak ${fullName}! Du er nu officielt tilmeldt Black Week VIP-listen. Hold øje med din indbakke og SMS!`
        : `Du er allerede skrevet op til vores VIP-liste! Vi sender dit eksklusive link på SMS og e-mail, så snart Black Week åbner.`,
      lead: { id: lead.id, name: lead.name, email: lead.email }
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
 * Admin: Get Notification Settings
 * GET /api/admin/black-friday/settings
 */
const getSettings = async (req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'black_friday_settings' }
    });

    let notifyEmail = 'salg@studentlife.dk';
    let notifyEnabled = true;

    if (setting && setting.value) {
      const val = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
      if (val && val.notifyEmail) notifyEmail = val.notifyEmail;
      if (val && typeof val.notifyEnabled === 'boolean') notifyEnabled = val.notifyEnabled;
    }

    return res.json({
      success: true,
      settings: {
        notifyEmail,
        notifyEnabled
      }
    });
  } catch (error) {
    console.error('[BlackFriday] Error getting settings:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve settings' });
  }
};

/**
 * Admin: Update Notification Settings
 * POST /api/admin/black-friday/settings
 */
const updateSettings = async (req, res) => {
  try {
    const { notifyEmail, notifyEnabled } = req.body;
    const cleanEmail = String(notifyEmail || '').trim();
    const cleanEnabled = notifyEnabled !== false;

    // Must store as valid JSON string because MySQL SystemSetting table has CHECK (json_valid(value)) constraint (SystemSetting_chk_1)
    const payload = JSON.stringify({
      notifyEmail: cleanEmail,
      notifyEnabled: cleanEnabled
    });

    await prisma.systemSetting.upsert({
      where: { key: 'black_friday_settings' },
      update: { value: payload },
      create: { key: 'black_friday_settings', value: payload }
    });

    return res.json({
      success: true,
      message: 'Notification settings updated successfully'
    });
  } catch (error) {
    console.error('[BlackFriday] Error updating settings:', error);
    return res.status(500).json({ success: false, error: 'Failed to update settings' });
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

    for (const lead of leads) {
      if (!lead.phone) {
        failedCount++;
        continue;
      }

      const personalizedMessage = message.replace(/\{\{name\}\}/gi, lead.name || 'Student');

      try {
        const smsResult = await sendSms(lead.phone, personalizedMessage);
        if (smsResult && smsResult.sent) {
          sentCount++;
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
      errors: errors.slice(0, 10)
    });
  } catch (error) {
    console.error('[BlackFriday] Error broadcasting SMS:', error);
    return res.status(500).json({ success: false, error: 'Failed to broadcast SMS' });
  }
};

/**
 * Admin: Broadcast Email to all or selected leads
 * Accepts PLAIN TEXT ONLY from admin - auto-wrapped in official Student Life template!
 * POST /api/admin/black-friday/broadcast-email
 */
const broadcastEmail = async (req, res) => {
  try {
    const { leadIds, subject, headline, bodyText, buttonText, buttonUrl } = req.body;
    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, error: 'Email subject is required' });
    }
    if (!bodyText || !bodyText.trim()) {
      return res.status(400).json({ success: false, error: 'Email message text is required' });
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
    const fromAddress = process.env.EMAIL_FROM || 'StudentLife <salg@studentlife.dk>';

    let sentCount = 0;
    let failedCount = 0;
    const errors = [];

    for (const lead of leads) {
      if (!lead.email) {
        failedCount++;
        continue;
      }

      const personalizedSubject = subject.replace(/\{\{name\}\}/gi, lead.name || 'Kære Kunde');
      const personalizedHeadline = (headline || 'BLACK WEEK STARTER HER! 🖤').replace(/\{\{name\}\}/gi, lead.name || 'Kære Kunde');
      const personalizedBody = bodyText.replace(/\{\{name\}\}/gi, lead.name || 'Kære Kunde');

      // Auto-wrap plain text into Student Life template!
      const html = generateOfficialStudentLifeEmailHtml({
        name: lead.name,
        headline: personalizedHeadline,
        bodyText: personalizedBody,
        buttonText: buttonText || '',
        buttonUrl: buttonUrl || ''
      });

      try {
        await transporter.sendMail({
          from: fromAddress,
          to: lead.email,
          subject: personalizedSubject,
          html: html
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
    return res.status(200).send('\uFEFF' + csvContent);
  } catch (error) {
    console.error('[BlackFriday] Error exporting CSV:', error);
    return res.status(500).json({ success: false, error: 'Failed to export CSV' });
  }
};

module.exports = {
  registerLead,
  getSettings,
  updateSettings,
  getLeads,
  deleteLead,
  bulkDeleteLeads,
  broadcastSms,
  broadcastEmail,
  exportLeadsCsv,
  generateOfficialStudentLifeEmailHtml,
  VIP_SECRET_TOKEN
};
