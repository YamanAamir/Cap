const {
  getDashboardStats,
  seedDefaults,
  createProductionBatch,
  sendProductionBatch,
  applyDiscountCode,
} = require('../services/core.service');
const prisma = require('../utils/prisma');
const { slugify } = require('../utils/helpers');

// Dashboard
exports.getStats = async (req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.seedSystem = async (req, res) => {
  try {
    await seedDefaults();
    res.json({ message: 'System defaults seeded successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Customers
exports.getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [customers, totalCount] = await prisma.$transaction([
      prisma.customer.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' }, include: { _count: { select: { orders: true } } } }),
      prisma.customer.count({ where }),
    ]);

    res.json({ customers, pagination: { totalCount, totalPages: Math.ceil(totalCount / parseInt(limit)), currentPage: parseInt(page) } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { orders: { orderBy: { createdAt: 'desc' } }, discountCodes: true },
    });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { name, email, phone, orderEmailConsent, smsMarketingConsent, emailMarketingConsent } = req.body;
    const customer = await prisma.customer.update({
      where: { id: parseInt(req.params.id) },
      data: { name, email, phone, orderEmailConsent, smsMarketingConsent, emailMarketingConsent }
    });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    await prisma.customer.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Order Statuses
exports.getOrderStatuses = async (req, res) => {
  try {
    const statuses = await prisma.orderStatus.findMany({ 
      orderBy: { sortOrder: 'asc' },
      include: { emailTemplate: true }
    });
    res.json(statuses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createOrderStatus = async (req, res) => {
  try {
    const { name, sortOrder, isInternal, isVisibleToProduction, triggersProduction, color, customerEmailTemplateId } = req.body;
    const slug = slugify(name);
    const status = await prisma.orderStatus.create({
      data: { 
        name, 
        slug, 
        sortOrder: sortOrder ?? 0, 
        isInternal: !!isInternal, 
        isVisibleToProduction: isVisibleToProduction !== undefined ? !!isVisibleToProduction : true,
        triggersProduction: !!triggersProduction, 
        color: color || '#6366f1',
        customerEmailTemplateId: customerEmailTemplateId ? parseInt(customerEmailTemplateId) : null
      },
      include: { emailTemplate: true }
    });
    res.status(201).json(status);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { name, sortOrder, isInternal, isVisibleToProduction, triggersProduction, isActive, color, customerEmailTemplateId } = req.body;
    const data = { sortOrder, isInternal, triggersProduction, isActive, color };
    if (isVisibleToProduction !== undefined) data.isVisibleToProduction = !!isVisibleToProduction;
    if (customerEmailTemplateId !== undefined) data.customerEmailTemplateId = customerEmailTemplateId ? parseInt(customerEmailTemplateId) : null;
    if (name) {
      data.name = name;
      data.slug = slugify(name);
    }
    const status = await prisma.orderStatus.update({ 
      where: { id: parseInt(req.params.id) }, 
      data,
      include: { emailTemplate: true }
    });
    res.json(status);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteOrderStatus = async (req, res) => {
  try {
    await prisma.orderStatus.update({ where: { id: parseInt(req.params.id) }, data: { isActive: false } });
    res.json({ message: 'Status deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Discount Codes
exports.getDiscountCodes = async (req, res) => {
  try {
    const codes = await prisma.discountCode.findMany({ orderBy: { createdAt: 'desc' }, include: { customer: true } });
    res.json(codes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createDiscountCode = async (req, res) => {
  try {
    const { code, type, value, expiresAt, phoneNumber } = req.body;
    const discount = await prisma.discountCode.create({
      data: {
        code: code.toUpperCase(),
        type,
        value: parseFloat(value),
        expiresAt: new Date(expiresAt),
        phoneNumber: phoneNumber || null,
        source: 'ADMIN',
      },
    });
    res.status(201).json(discount);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.validateDiscountCode = async (req, res) => {
  try {
    const { code, phone, totalPrice } = req.body;
    const result = await applyDiscountCode(code, phone, parseFloat(totalPrice));
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Production
exports.getProductionBatches = async (req, res) => {
  try {
    const batches = await prisma.productionBatch.findMany({
      orderBy: { createdAt: 'desc' },
      include: { sentByUser: { select: { name: true, email: true } }, _count: { select: { orders: true } } },
    });
    res.json(batches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProductionBatch = async (req, res) => {
  try {
    const batch = await prisma.productionBatch.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { orders: true, logs: { include: { adminUser: { select: { name: true } } } } },
    });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json(batch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.generateProductionBatch = async (req, res) => {
  try {
    const batch = await createProductionBatch();
    if (!batch) return res.json({ message: 'No orders ready for production', batch: null });
    res.status(201).json(batch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendProductionBatch = async (req, res) => {
  try {
    const { recipientEmail, emailSubject, emailBody } = req.body;
    const batch = await sendProductionBatch(parseInt(req.params.id), req.user.id, { recipientEmail, emailSubject, emailBody });
    res.json(batch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDispatchLogs = async (req, res) => {
  try {
    const logs = await prisma.productionDispatchLog.findMany({
      orderBy: { sentAt: 'desc' },
      include: { adminUser: { select: { name: true } }, batch: true },
      take: 50,
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// SMS Campaigns
exports.getSmsCampaigns = async (req, res) => {
  try {
    const campaigns = await prisma.smsCampaign.findMany({
      include: { steps: { orderBy: { sortOrder: 'asc' } }, _count: { select: { enrollments: true } } },
    });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createSmsCampaign = async (req, res) => {
  try {
    const { name, steps = [] } = req.body;
    const campaign = await prisma.smsCampaign.create({
      data: {
        name,
        steps: {
          create: steps.map((s, i) => ({
            dayOffset: s.dayOffset,
            message: s.message,
            sortOrder: s.sortOrder ?? i,
            isActive: s.isActive !== false,
          })),
        },
      },
      include: { steps: true },
    });
    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSmsCampaign = async (req, res) => {
  try {
    const { name, isActive, steps } = req.body;
    const id = parseInt(req.params.id);

    if (name !== undefined || isActive !== undefined) {
      await prisma.smsCampaign.update({
        where: { id },
        data: { ...(name !== undefined && { name }), ...(isActive !== undefined && { isActive }) },
      });
    }

    if (steps) {
      await prisma.smsCampaignStep.deleteMany({ where: { campaignId: id } });
      await prisma.smsCampaignStep.createMany({
        data: steps.map((s, i) => ({
          campaignId: id,
          dayOffset: s.dayOffset,
          message: s.message,
          sortOrder: s.sortOrder ?? i,
          isActive: s.isActive !== false,
        })),
      });
    }

    const campaign = await prisma.smsCampaign.findUnique({
      where: { id },
      include: { steps: { orderBy: { sortOrder: 'asc' } } },
    });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.exportCampaignNonPurchasers = async (req, res) => {
  const campaignId = parseInt(req.params.id);
  try {
    const enrollments = await prisma.smsCampaignEnrollment.findMany({
      where: {
        campaignId,
        customer: { orders: { none: {} } }
      },
      include: { customer: true, discountCode: true }
    });
    
    let csv = "Name,Phone,Email,DiscountCode\n";
    enrollments.forEach(e => {
      csv += `"${e.customer.name}","${e.customer.phone}","${e.customer.email}","${e.discountCode?.code || ''}"\n`;
    });
    
    res.header('Content-Type', 'text/csv');
    res.attachment(`campaign_${campaignId}_non_purchasers.csv`);
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSmsMessages = async (req, res) => {
  try {
    const messages = await prisma.smsMessage.findMany({
      orderBy: { scheduledFor: 'desc' },
      take: 100,
      include: { customer: { select: { name: true, phone: true } } },
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Excel Config
exports.getExcelColumns = async (req, res) => {
  try {
    const columns = await prisma.excelColumnConfig.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json(columns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateExcelColumns = async (req, res) => {
  try {
    const { columns } = req.body;
    for (const col of columns) {
      await prisma.excelColumnConfig.update({
        where: { id: col.id },
        data: { headerLabel: col.headerLabel, sortOrder: col.sortOrder, isVisible: col.isVisible },
      });
    }
    const updated = await prisma.excelColumnConfig.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createExcelColumn = async (req, res) => {
  try {
    const { fieldKey, headerLabel, sortOrder } = req.body;
    const column = await prisma.excelColumnConfig.create({
      data: { fieldKey, headerLabel, sortOrder: sortOrder ?? 0, isVisible: true },
    });
    res.status(201).json(column);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteExcelColumn = async (req, res) => {
  try {
    await prisma.excelColumnConfig.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ message: 'Excel column deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Email Templates
exports.getEmailTemplates = async (req, res) => {
  try {
    const templates = await prisma.emailTemplate.findMany();
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateEmailTemplate = async (req, res) => {
  try {
    const { subject, body, name } = req.body;
    const template = await prisma.emailTemplate.update({
      where: { key: req.params.key },
      data: { subject, body, name },
    });
    res.json(template);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createEmailTemplate = async (req, res) => {
  try {
    const { key, name, subject, body } = req.body;
    const template = await prisma.emailTemplate.create({
      data: { 
        key: key || slugify(name || 'Custom Template'), 
        name: name || 'Custom Template',
        subject, 
        body 
      },
    });
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteEmailTemplate = async (req, res) => {
  try {
    await prisma.orderStatus.updateMany({
      where: { customerEmailTemplateId: parseInt(req.params.id) },
      data: { customerEmailTemplateId: null }
    });
    await prisma.emailTemplate.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Public marketing
exports.smsSignup = async (req, res) => {
  try {
    const { registerSmsSignup } = require('../services/sms.service');
    const result = await registerSmsSignup(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.smsWebhook = async (req, res) => {
  try {
    const { handleSmsOptOut } = require('../services/sms.service');
    const body = req.body.Body || req.body.message || '';
    const from = req.body.From || req.body.phone || '';

    if (body.trim().toUpperCase() === 'STOP') {
      await handleSmsOptOut(from.replace(/\D/g, '').slice(-10));
      return res.json({ message: 'Opt-out processed' });
    }
    res.json({ received: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
