const prisma = require('../utils/prisma');
const { generateDiscountCode, slugify, interpolateTemplate } = require('../utils/helpers');
const { generateExcelFile, generateOrderPdf, generateZipArchive } = require('./export.service');

const DEFAULT_ORDER_STATUSES = [
  { name: 'Draft', slug: 'draft', sortOrder: 1, isInternal: true, triggersProduction: false, color: '#94a3b8' },
  { name: 'Paid', slug: 'paid', sortOrder: 2, isInternal: false, triggersProduction: false, color: '#22c55e' },
  { name: 'Ready For Production', slug: 'ready-for-production', sortOrder: 3, isInternal: false, triggersProduction: true, color: '#f59e0b' },
  { name: 'Sent To Manufacturer', slug: 'sent-to-manufacturer', sortOrder: 4, isInternal: true, triggersProduction: false, color: '#6366f1' },
  { name: 'In Production', slug: 'in-production', sortOrder: 5, isInternal: true, triggersProduction: false, color: '#8b5cf6' },
  { name: 'Shipped', slug: 'shipped', sortOrder: 6, isInternal: false, triggersProduction: false, color: '#0ea5e9' },
  { name: 'Delivered', slug: 'delivered', sortOrder: 7, isInternal: false, triggersProduction: false, color: '#10b981' },
  { name: 'Completed', slug: 'completed', sortOrder: 8, isInternal: false, triggersProduction: false, color: '#059669' },
];

const DEFAULT_EXCEL_COLUMNS = [
  { fieldKey: 'orderNumber', headerLabel: 'Order nr', sortOrder: 1 },
  { fieldKey: 'static:1', headerLabel: 'PAX', sortOrder: 2 }, // PAX remains static 1
  { fieldKey: 'options.STØRRELSE.Vælg størrelse', headerLabel: 'Size', sortOrder: 3 },
  { fieldKey: 'options.KOKARDE.Roset farve', headerLabel: 'Rosette Color', sortOrder: 4 },
  { fieldKey: 'options.KOKARDE.Type', headerLabel: 'Cockade Insignia', sortOrder: 5 },
  { fieldKey: 'options.KOKARDE.Emblem', headerLabel: 'Emblem Color', sortOrder: 6 },
  { fieldKey: 'options.KOKARDE.Kokarde', headerLabel: 'Cockade Style', sortOrder: 7 },
  { fieldKey: 'options.BRODERI.Navne broderi', headerLabel: 'Back Embroidery Name', sortOrder: 8 },
  { fieldKey: 'options.BRODERI.Broderifarve', headerLabel: 'Back Embroidery Color', sortOrder: 9 },
  { fieldKey: 'options.UDDANNELSESBÅND.Broderi foran', headerLabel: 'Front Embroidery Name', sortOrder: 10 },
  { fieldKey: 'options.UDDANNELSESBÅND.Broderi farve', headerLabel: 'Front Embroidery Color', sortOrder: 11 },
  { fieldKey: 'options.BRODERI.Skolebroderi', headerLabel: 'School Embroidery Text', sortOrder: 12 },
  { fieldKey: 'options.BRODERI.Skolebroderi farve', headerLabel: 'School Embroidery Color', sortOrder: 13 },
  { fieldKey: 'options.BETRÆK.Farve', headerLabel: 'Cover Color', sortOrder: 14 },
  { fieldKey: 'options.BRODERI.Top broderi', headerLabel: 'Top Embroidery', sortOrder: 15 },
  { fieldKey: 'options.BETRÆK.Topkant', headerLabel: 'Top Edging', sortOrder: 16 },
  { fieldKey: 'options.BETRÆK.Kantbånd', headerLabel: 'Edge Ribbon', sortOrder: 17 },
  { fieldKey: 'options.BETRÆK.Stjerner', headerLabel: 'Stars', sortOrder: 18 },
  { fieldKey: 'options.BETRÆK.Flagbånd', headerLabel: 'Flag Ribbon', sortOrder: 19 },
  { fieldKey: 'options.FOER.Svederem', headerLabel: 'Sweatband Material', sortOrder: 20 },
  { fieldKey: 'options.FOER.Farve', headerLabel: 'Inner Lining Color', sortOrder: 21 },
  { fieldKey: 'options.FOER.Sløjfe', headerLabel: 'Bow Color', sortOrder: 22 },
  { fieldKey: 'options.FOER.Foer', headerLabel: 'Lining Material', sortOrder: 23 },
  { fieldKey: 'options.FOER.Type', headerLabel: 'Lining Type', sortOrder: 24 },
  { fieldKey: 'options.UDDANNELSESBÅND.Hagerem', headerLabel: 'Chinstrap', sortOrder: 25 },
  { fieldKey: 'options.UDDANNELSESBÅND.Knap farve', headerLabel: 'Button Color', sortOrder: 26 },
  { fieldKey: 'options.SKYGGE.Type', headerLabel: 'Brim Type', sortOrder: 27 },
  { fieldKey: 'options.SKYGGE.Materiale', headerLabel: 'Brim edge', sortOrder: 28 },
  { fieldKey: 'options.SKYGGE.Skyggebånd', headerLabel: 'Shadow Band', sortOrder: 29 },
  { fieldKey: 'options.SKYGGE.Skyggegravering Line 1', headerLabel: 'Line 1', sortOrder: 30 },
  { fieldKey: 'options.SKYGGE.Skyggegravering Line 2', headerLabel: 'Line 2', sortOrder: 31 },
  { fieldKey: 'options.SKYGGE.Skyggegravering Line 3', headerLabel: 'Line 3', sortOrder: 32 },
  { fieldKey: 'options.TILBEHØR.Silkepude', headerLabel: 'Silk Cushion', sortOrder: 33 },
  { fieldKey: 'options.TILBEHØR.Hueæske', headerLabel: 'Cap Box', sortOrder: 34 },
  { fieldKey: 'options.UDDANNELSESBÅND.Huebånd', headerLabel: 'Band Pattern', sortOrder: 35 },
  { fieldKey: 'options.UDDANNELSESBÅND.Materiale', headerLabel: 'Band Material', sortOrder: 36 },
];

const DEFAULT_EMAIL_TEMPLATES = [
  {
    key: 'customer_confirmation',
    subject: 'Your Graduation Cap Order Confirmation - {{orderNumber}}',
    body: `Dear {{customerName}},

Thank you for your order! Your graduation cap design has been received.

Order Number: {{orderNumber}}
Total: {{totalPrice}} {{currency}}

Your cap design images (Front, Back, Top, Bottom) are attached to this email.

Best regards,
StudentLife Team`,
  },
  {
    key: 'manufacturer_production',
    subject: 'Weekly Production Batch - {{orderCount}} Orders',
    body: `Hello,

Please find attached this week's production batch containing {{orderCount}} graduation cap orders.

Excel file and individual PDFs are included.

Best regards,
StudentLife Production`,
  },
];

const seedDefaults = async () => {
  for (const status of DEFAULT_ORDER_STATUSES) {
    await prisma.orderStatus.upsert({
      where: { slug: status.slug },
      update: status,
      create: status,
    });
  }

  const existingColumnsCount = await prisma.excelColumnConfig.count();
  if (existingColumnsCount === 0 || existingColumnsCount === 15) {
    await prisma.excelColumnConfig.deleteMany({});
    for (const col of DEFAULT_EXCEL_COLUMNS) {
      await prisma.excelColumnConfig.create({
        data: { ...col, isVisible: true },
      });
    }
  }

  for (const tpl of DEFAULT_EMAIL_TEMPLATES) {
    await prisma.emailTemplate.upsert({
      where: { key: tpl.key },
      update: { subject: tpl.subject, body: tpl.body },
      create: tpl,
    });
  }

  await prisma.systemSetting.upsert({
    where: { key: 'manufacturer_email' },
    update: { value: { email: process.env.MANUFACTURER_EMAIL || 'factory@studentlife.dk' } },
    create: { key: 'manufacturer_email', value: { email: process.env.MANUFACTURER_EMAIL || 'factory@studentlife.dk' } },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'production_status_slug' },
    update: { value: { slug: 'ready-for-production' } },
    create: { key: 'production_status_slug', value: { slug: 'ready-for-production' } },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'sent_to_manufacturer_slug' },
    update: { value: { slug: 'sent-to-manufacturer' } },
    create: { key: 'sent_to_manufacturer_slug', value: { slug: 'sent-to-manufacturer' } },
  });
};

const upsertCustomerFromOrder = async (customerDetails, email) => {
  const name = `${customerDetails?.firstName || ''} ${customerDetails?.lastName || ''}`.trim() || customerDetails?.name || 'Customer';
  const phone = customerDetails?.phone || null;

  let customer = await prisma.customer.findUnique({ where: { email } });

  if (customer) {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: { name, phone: phone || customer.phone },
    });
  } else {
    customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        orderEmailConsent: customerDetails?.orderEmailConsent !== false,
        smsMarketingConsent: !!customerDetails?.smsMarketingConsent,
        emailMarketingConsent: !!customerDetails?.emailMarketingConsent,
      },
    });
  }

  return customer;
};

const getStatusBySlug = async (slug) => {
  return prisma.orderStatus.findUnique({ where: { slug } });
};

const applyDiscountCode = async (code, phone, orderTotal) => {
  const discount = await prisma.discountCode.findUnique({ where: { code: code.toUpperCase() } });

  if (!discount || !discount.isActive) {
    throw new Error('Invalid discount code');
  }
  if (new Date() > discount.expiresAt) {
    throw new Error('Discount code has expired');
  }
  if (discount.usedAt) {
    throw new Error('Discount code already used');
  }
  const cleanPhone = (p) => p ? p.replace(/[^\d]/g, '') : '';
  const dPhone = cleanPhone(discount.phoneNumber);
  const cPhone = cleanPhone(phone);
  if (dPhone && cPhone && !dPhone.endsWith(cPhone) && !cPhone.endsWith(dPhone)) {
    throw new Error('Discount code not valid for this phone number');
  }

  let discountAmount = 0;
  if (discount.type === 'PERCENTAGE') {
    discountAmount = (orderTotal * discount.value) / 100;
  } else {
    discountAmount = Math.min(discount.value, orderTotal);
  }

  return { discount, discountAmount, finalPrice: Math.max(0, orderTotal - discountAmount) };
};

const createProductionBatch = async () => {
  const setting = await prisma.systemSetting.findUnique({ where: { key: 'production_status_slug' } });
  const slug = setting?.value?.slug || 'ready-for-production';
  const productionStatus = await prisma.orderStatus.findUnique({ where: { slug } });

  if (!productionStatus) {
    throw new Error('Production status not configured');
  }

  const orders = await prisma.order.findMany({
    where: { statusId: productionStatus.id, productionBatchId: null },
    include: { discountCode: true, customer: true },
  });

  if (orders.length === 0) {
    return null;
  }

  const manufacturerSetting = await prisma.systemSetting.findUnique({ where: { key: 'manufacturer_email' } });
  const emailTemplate = await prisma.emailTemplate.findUnique({ where: { key: 'manufacturer_production' } });
  const columns = await prisma.excelColumnConfig.findMany();

  const batch = await prisma.productionBatch.create({
    data: {
      orderCount: orders.length,
      recipientEmail: manufacturerSetting?.value?.email || 'factory@studentlife.dk',
      emailSubject: interpolateTemplate(emailTemplate?.subject || 'Production Batch', { orderCount: orders.length }),
      emailBody: interpolateTemplate(emailTemplate?.body || '', { orderCount: orders.length }),
    },
  });

  const excel = await generateExcelFile(orders, columns, batch.id);
  const pdfFiles = [];
  for (const order of orders) {
    pdfFiles.push(await generateOrderPdf(order));
  }
  const zip = await generateZipArchive(pdfFiles, batch.id);

  await prisma.productionBatch.update({
    where: { id: batch.id },
    data: {
      excelFilePath: excel.filePath,
      zipFilePath: zip.filePath,
    },
  });

  await prisma.order.updateMany({
    where: { id: { in: orders.map((o) => o.id) } },
    data: { productionBatchId: batch.id },
  });

  return prisma.productionBatch.findUnique({
    where: { id: batch.id },
    include: { orders: true },
  });
};

const sendProductionBatch = async (batchId, adminUserId, overrides = {}) => {
  const batch = await prisma.productionBatch.findUnique({
    where: { id: batchId },
    include: { orders: true },
  });

  if (!batch) throw new Error('Batch not found');
  if (batch.status === 'SENT') throw new Error('Batch already sent');

  const sentStatusSetting = await prisma.systemSetting.findUnique({ where: { key: 'sent_to_manufacturer_slug' } });
  const sentSlug = sentStatusSetting?.value?.slug || 'sent-to-manufacturer';
  const sentStatus = await prisma.orderStatus.findUnique({ where: { slug: sentSlug } });

  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: 'smtp.simply.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const recipient = overrides.recipientEmail || batch.recipientEmail;
  const subject = overrides.emailSubject || batch.emailSubject;
  const body = overrides.emailBody || batch.emailBody;
  
  const sendExcel = overrides.sendExcel !== undefined ? overrides.sendExcel : true;
  const sendZip = overrides.sendZip !== undefined ? overrides.sendZip : true;

  const attachments = [];
  const path = require('path');
  const fs = require('fs');

  if (sendExcel && batch.excelFilePath) {
    const excelFull = path.join(__dirname, '../../public', batch.excelFilePath.replace(/^\//, ''));
    if (fs.existsSync(excelFull)) {
      attachments.push({ filename: path.basename(excelFull), path: excelFull });
    }
  }
  if (sendZip && batch.zipFilePath) {
    const zipFull = path.join(__dirname, '../../public', batch.zipFilePath.replace(/^\//, ''));
    if (fs.existsSync(zipFull)) {
      attachments.push({ filename: path.basename(zipFull), path: zipFull });
    }
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: recipient,
    subject,
    text: body,
    attachments,
  });

  if (sentStatus) {
    await prisma.order.updateMany({
      where: { productionBatchId: batchId },
      data: { statusId: sentStatus.id, status: sentStatus.name.toUpperCase().replace(/\s+/g, '_') },
    });
  }

  const fileNames = [batch.excelFilePath, batch.zipFilePath].filter(Boolean);

  await prisma.productionBatch.update({
    where: { id: batchId },
    data: {
      status: 'SENT',
      sentAt: new Date(),
      sentByUserId: adminUserId,
      recipientEmail: recipient,
      emailSubject: subject,
      emailBody: body,
    },
  });

  await prisma.productionDispatchLog.create({
    data: {
      batchId,
      adminUserId,
      orderCount: batch.orderCount,
      fileNames,
    },
  });

  return prisma.productionBatch.findUnique({ where: { id: batchId } });
};

const sendCustomerStatusEmail = async (orderId, emailTemplateId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true, orderStatus: true }
  });
  if (!order || !order.customerEmail) return;

  const template = await prisma.emailTemplate.findUnique({
    where: { id: emailTemplateId }
  });
  if (!template) return;

  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: 'smtp.simply.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const replacements = {
    orderNumber: order.orderNumber,
    customerName: order.customer?.name || order.customerEmail.split('@')[0],
    totalPrice: order.totalPrice.toString(),
    currency: order.currency,
  };

  const subject = interpolateTemplate(template.subject, replacements);
  const body = interpolateTemplate(template.body, replacements);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: order.customerEmail,
      subject,
      text: body,
    });
  } catch (error) {
    console.error('Failed to send customer status email:', error);
  }
};

const getDashboardStats = async () => {
  const productionSetting = await prisma.systemSetting.findUnique({ where: { key: 'production_status_slug' } });
  const slug = productionSetting?.value?.slug || 'ready-for-production';
  const productionStatus = await prisma.orderStatus.findUnique({ where: { slug } });

  const [
    readyForProduction,
    totalOrders,
    activeCampaigns,
    smsConsentCount,
    totalDiscountCodes,
    usedDiscountCodes,
    lastDispatch,
    revenueAgg,
    recentOrders,
    allStatuses,
    statusCountsRaw
  ] = await Promise.all([
    productionStatus
      ? prisma.order.count({ where: { statusId: productionStatus.id, productionBatchId: null } })
      : 0,
    prisma.order.count(),
    prisma.smsCampaign.count({ where: { isActive: true } }),
    prisma.customer.count({ where: { smsMarketingConsent: true, smsOptOut: false } }),
    prisma.discountCode.count(),
    prisma.discountCode.count({ where: { usedAt: { not: null } } }),
    prisma.productionDispatchLog.findFirst({ orderBy: { sentAt: 'desc' }, include: { batch: true } }),
    prisma.order.aggregate({ _sum: { totalPrice: true } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { customer: true, orderStatus: true }
    }),
    prisma.orderStatus.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.order.groupBy({
      by: ['statusId'],
      _count: { id: true }
    })
  ]);

  const statusCounts = allStatuses.map(status => {
    const countMatch = statusCountsRaw.find(s => s.statusId === status.id);
    const count = countMatch ? countMatch._count.id : 0;
    const percentage = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
    return {
      id: status.id,
      name: status.name,
      color: status.color,
      count,
      percentage
    };
  });

  return {
    readyForProduction,
    totalOrders,
    activeCampaigns,
    smsConsentCount,
    totalDiscountCodes,
    usedDiscountCodes,
    unusedDiscountCodes: totalDiscountCodes - usedDiscountCodes,
    totalRevenue: revenueAgg._sum.totalPrice || 0,
    recentOrders: recentOrders.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      date: o.orderDate,
      customerName: o.customer?.name || o.customerEmail,
      price: o.totalPrice,
      status: o.orderStatus?.name || 'Pending',
      statusColor: o.orderStatus?.color || '#000'
    })),
    statusCounts,
    lastDispatch: lastDispatch
      ? { date: lastDispatch.sentAt, orderCount: lastDispatch.orderCount }
      : null,
  };
};

module.exports = {
  seedDefaults,
  upsertCustomerFromOrder,
  getStatusBySlug,
  applyDiscountCode,
  createProductionBatch,
  sendProductionBatch,
  getDashboardStats,
  generateDiscountCode,
  slugify,
  sendCustomerStatusEmail,
};
