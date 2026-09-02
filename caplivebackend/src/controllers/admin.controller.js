const {
  getDashboardStats,
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
    const { name, email, phone, school, orderEmailConsent, smsMarketingConsent, emailMarketingConsent } = req.body;
    const customer = await prisma.customer.update({
      where: { id: parseInt(req.params.id) },
      data: { name, email, phone, school, orderEmailConsent, smsMarketingConsent, emailMarketingConsent }
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
    const { name, sortOrder, isInternal, isVisibleToProduction, triggersProduction, color, customerEmailTemplateId, isInstallmentTrigger, installmentTriggerIndex } = req.body;
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
        customerEmailTemplateId: customerEmailTemplateId ? parseInt(customerEmailTemplateId) : null,
        isInstallmentTrigger: !!isInstallmentTrigger,
        installmentTriggerIndex: isInstallmentTrigger && installmentTriggerIndex !== undefined && installmentTriggerIndex !== '' ? parseInt(installmentTriggerIndex) : null,
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
    const { name, sortOrder, isInternal, isVisibleToProduction, triggersProduction, isActive, color, customerEmailTemplateId, isInstallmentTrigger, installmentTriggerIndex } = req.body;
    const data = { sortOrder, isInternal, triggersProduction, isActive, color };
    if (isVisibleToProduction !== undefined) data.isVisibleToProduction = !!isVisibleToProduction;
    if (customerEmailTemplateId !== undefined) data.customerEmailTemplateId = customerEmailTemplateId ? parseInt(customerEmailTemplateId) : null;
    if (isInstallmentTrigger !== undefined) {
      data.isInstallmentTrigger = !!isInstallmentTrigger;
      data.installmentTriggerIndex = data.isInstallmentTrigger && installmentTriggerIndex !== undefined && installmentTriggerIndex !== '' ? parseInt(installmentTriggerIndex) : null;
    }
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

exports.updateDiscountCode = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const { code, type, value, expiresAt, phoneNumber, isActive } = req.body;
    const data = {};
    if (code !== undefined) data.code = code.toUpperCase();
    if (type !== undefined) data.type = type;
    if (value !== undefined) data.value = parseFloat(value);
    if (expiresAt !== undefined) data.expiresAt = new Date(expiresAt);
    if (phoneNumber !== undefined) data.phoneNumber = phoneNumber || null;
    if (isActive !== undefined) data.isActive = !!isActive;

    const updated = await prisma.discountCode.update({
      where: { id },
      data,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteDiscountCode = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const discount = await prisma.discountCode.findUnique({
      where: { id },
      include: { orders: true }
    });

    if (!discount) {
      return res.status(404).json({ message: 'Discount code not found' });
    }

    if (discount.orders && discount.orders.length > 0) {
      return res.status(400).json({ 
        message: 'This coupon has already been used in completed/placed orders and cannot be deleted.' 
      });
    }

    // Disconnect from any campaign enrollments before deleting
    await prisma.smsCampaignEnrollment.updateMany({
      where: { discountCodeId: id },
      data: { discountCodeId: null }
    });

    await prisma.discountCode.delete({
      where: { id }
    });

    res.json({ message: 'Discount code deleted successfully' });
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
      include: { orders: { include: { customer: true } }, logs: { include: { adminUser: { select: { name: true } } } } },
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
    const { recipientEmail, emailSubject, emailBody, sendExcel, sendZip } = req.body;
    const batch = await sendProductionBatch(parseInt(req.params.id), req.user.id, { recipientEmail, emailSubject, emailBody, sendExcel, sendZip });
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
    const mapped = campaigns.map(c => {
      let expiry = 20;
      let type = c.discountType;
      if (type && type.includes(':')) {
        const parts = type.split(':');
        type = parts[0];
        expiry = parseInt(parts[1]) || 20;
      }
      return { ...c, discountType: type, discountExpiryDays: expiry };
    });
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createSmsCampaign = async (req, res) => {
  try {
    const { name, steps = [], discountType, discountValue, discountExpiryDays } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 1000);

    let finalType = discountType;
    if (discountType && discountExpiryDays) {
      finalType = `${discountType}:${discountExpiryDays}`;
    }

    const campaign = await prisma.smsCampaign.create({
      data: {
        name,
        slug,
        discountType: finalType,
        discountValue: discountValue !== undefined ? parseFloat(discountValue) : null,
        steps: {
          create: steps.map((s, i) => ({
            dayOffset: parseInt(s.dayOffset) || 0,
            message: s.message,
            sortOrder: s.sortOrder ?? i,
          })),
        },
      },
    });
    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSmsCampaignBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const campaign = await prisma.smsCampaign.findUnique({
      where: { slug },
      select: { id: true, name: true, isActive: true },
    });
    if (!campaign || !campaign.isActive) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateSmsCampaign = async (req, res) => {
  try {
    const { name, slug, isActive, steps, applyToExisting, discountType, discountValue, discountExpiryDays } = req.body;
    const id = parseInt(req.params.id);

    if (name !== undefined || isActive !== undefined || slug !== undefined || discountType !== undefined || discountValue !== undefined || discountExpiryDays !== undefined) {
      
      let finalType = discountType;
      if (discountType && discountExpiryDays) {
        finalType = `${discountType}:${discountExpiryDays}`;
      } else if (discountType) {
        finalType = `${discountType}:20`; // default fallback if updating just type
      }

      await prisma.smsCampaign.update({
        where: { id },
        data: { 
          ...(name !== undefined && { name }), 
          ...(isActive !== undefined && { isActive }),
          ...(slug !== undefined && { slug }),
          ...(discountType !== undefined && { discountType: finalType }),
          ...(discountValue !== undefined && { discountValue: discountValue !== null ? parseFloat(discountValue) : null })
        }
      });
    }

    if (steps) {
      await prisma.smsCampaignStep.deleteMany({ where: { campaignId: id } });
      await prisma.smsCampaignStep.createMany({
        data: steps.map((s, i) => ({
          campaignId: id,
          dayOffset: parseInt(s.dayOffset) || 0,
          message: s.message,
          sortOrder: s.sortOrder ?? i,
          isActive: s.isActive !== false,
        })),
      });

      if (applyToExisting) {
        // Fetch the updated campaign to get current details (slug, discount type, value, etc)
        const campaign = await prisma.smsCampaign.findUnique({ where: { id } });

        // Fetch all enrollments for this campaign
        const enrollments = await prisma.smsCampaignEnrollment.findMany({
          where: { campaignId: id },
          include: { customer: true, discountCode: true }
        });

        // Delete all currently pending or scheduled messages for these enrollments
        const enrollmentIds = enrollments.map(e => e.id);
        if (enrollmentIds.length > 0) {
          await prisma.smsMessage.deleteMany({
            where: {
              enrollmentId: { in: enrollmentIds },
              status: { in: ['PENDING', 'SCHEDULED'] }
            }
          });

          // Parse actual discount type and expiry days
          let actualType = null;
          let expiryDays = 20;
          if (campaign && campaign.discountType) {
            if (campaign.discountType.includes(':')) {
              const parts = campaign.discountType.split(':');
              actualType = parts[0];
              expiryDays = parseInt(parts[1]) || 20;
            } else {
              actualType = campaign.discountType;
            }
          }

          // Re-generate future messages based on new steps
          const newMessages = [];
          for (const enrollment of enrollments) {
            // Update the discount code details if it exists and is unused
            if (enrollment.discountCode && !enrollment.discountCode.usedAt) {
              const discountUpdateData = {};
              if (actualType !== undefined) {
                discountUpdateData.type = actualType;
              }
              if (campaign.discountValue !== undefined) {
                discountUpdateData.value = campaign.discountValue !== null ? parseFloat(campaign.discountValue) : null;
              }
              if (expiryDays !== undefined) {
                const expiresAt = new Date(enrollment.enrolledAt);
                expiresAt.setDate(expiresAt.getDate() + expiryDays);
                discountUpdateData.expiresAt = expiresAt;
              }

              if (Object.keys(discountUpdateData).length > 0) {
                enrollment.discountCode = await prisma.discountCode.update({
                  where: { id: enrollment.discountCode.id },
                  data: discountUpdateData
                });
              }
            }

            for (const step of steps) {
              const scheduledFor = new Date(enrollment.enrolledAt);
              scheduledFor.setDate(scheduledFor.getDate() + (parseInt(step.dayOffset) || 0));

              // Only queue messages that are in the future to avoid spamming old steps
              if (scheduledFor > new Date()) {
                const customer = enrollment.customer;
                const discountCode = enrollment.discountCode;
                const frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'https://studenterhue.studentlife.dk/studentlife';
                const campaignSlug = campaign.slug || '';

                const vars = {
                  name: customer.name,
                  discountCode: discountCode?.code || '',
                  expiryDate: discountCode ? new Date(discountCode.expiresAt).toLocaleDateString('da-DK') : '',
                  link: campaignSlug ? `${frontendBaseUrl}/sms-signup/${campaignSlug}` : ''
                };

                const parsedMessage = step.message
                  .replace(/\{\{name\}\}/g, vars.name)
                  .replace(/\{\{discountCode\}\}/g, vars.discountCode)
                  .replace(/\{\{expiryDate\}\}/g, vars.expiryDate)
                  .replace(/\{\{link\}\}/g, vars.link);

                newMessages.push({
                  customerId: enrollment.customerId,
                  enrollmentId: enrollment.id,
                  phone: enrollment.customer.phone,
                  message: parsedMessage,
                  scheduledFor,
                  status: 'SCHEDULED'
                });
              }
            }
          }

          if (newMessages.length > 0) {
            await prisma.smsMessage.createMany({ data: newMessages });
          }
        }
      }
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

exports.deleteSmsCampaign = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const force = req.query.force === 'true';
    
    // Check if campaign has enrollments
    const enrollmentsCount = await prisma.smsCampaignEnrollment.count({ where: { campaignId: id } });
    if (enrollmentsCount > 0) {
      if (!force) {
        return res.status(400).json({ message: 'Cannot delete campaign that has enrollments. Deactivate it instead.' });
      }

      // Cascade delete:
      // 1. Fetch enrollments to get discount codes and enrollment IDs
      const enrollments = await prisma.smsCampaignEnrollment.findMany({
        where: { campaignId: id },
        select: { id: true, discountCodeId: true }
      });
      
      const enrollmentIds = enrollments.map(e => e.id);
      const discountCodeIds = enrollments.map(e => e.discountCodeId).filter(Boolean);
      
      // Delete associated SMS Messages
      if (enrollmentIds.length > 0) {
        await prisma.smsMessage.deleteMany({
          where: { enrollmentId: { in: enrollmentIds } }
        });
      }
      
      // Delete associated Enrollments
      await prisma.smsCampaignEnrollment.deleteMany({
        where: { campaignId: id }
      });
      
      // Delete associated DiscountCodes
      if (discountCodeIds.length > 0) {
        await prisma.discountCode.deleteMany({
          where: { id: { in: discountCodeIds } }
        });
      }
    }

    await prisma.smsCampaign.delete({ where: { id } });
    res.json({ message: 'Campaign deleted successfully' });
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
    const { campaignId, status, dateFrom, dateTo, search, orderStatus } = req.query;

    // Auto-cleanup: Cancel any pending/scheduled messages for customers who already placed active orders
    await prisma.smsMessage.updateMany({
      where: {
        status: { in: ['SCHEDULED', 'PENDING'] },
        customer: {
          orders: {
            some: { status: { not: 'CANCELLED' } }
          }
        }
      },
      data: { status: 'CANCELLED' }
    });

    const where = {};
    if (campaignId) {
      where.enrollment = { campaignId: parseInt(campaignId) };
    }
    if (status) {
      where.status = status;
    }
    if (dateFrom || dateTo) {
      where.scheduledFor = {};
      if (dateFrom) where.scheduledFor.gte = new Date(dateFrom);
      if (dateTo) where.scheduledFor.lte = new Date(dateTo);
    }
    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { email: { contains: search } } }
      ];
    }
    
    if (orderStatus) {
      if (orderStatus === 'NOT_CANCELLED' || orderStatus === 'ACTIVE') {
        where.customer = {
          ...where.customer,
          orders: { some: { status: { not: 'CANCELLED' } } }
        };
      } else if (orderStatus === 'CANCELLED') {
        where.customer = {
          ...where.customer,
          orders: {
            some: { status: 'CANCELLED' },
            none: { status: { not: 'CANCELLED' } }
          }
        };
      } else if (orderStatus === 'NO_ORDER') {
        where.customer = {
          ...where.customer,
          orders: { none: {} }
        };
      }
    }

    const messages = await prisma.smsMessage.findMany({
      where,
      orderBy: { id: 'desc' }, // Newest first
      take: 500,
      include: { 
        customer: { 
          select: { 
            id: true, 
            name: true, 
            phone: true, 
            email: true, 
            school: true, 
            orders: { select: { id: true, status: true, orderNumber: true } } 
          } 
        },
        enrollment: {
          select: { 
            campaignId: true, 
            campaign: { select: { id: true, name: true, slug: true } } 
          }
        }
      },
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteSmsMessage = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const msg = await prisma.smsMessage.findUnique({
      where: { id }
    });

    if (!msg) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Delete ONLY the targeted SMS message (Customer & DiscountCode are NEVER deleted)
    await prisma.smsMessage.delete({ where: { id } });

    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteRecipientMessages = async (req, res) => {
  try {
    const { messageIds, phone, customerId } = req.body;

    let targetIds = [];
    if (Array.isArray(messageIds) && messageIds.length > 0) {
      targetIds = messageIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    } else if (phone) {
      const clean = phone.replace(/\D/g, '');
      const localPhone = clean.length >= 8 ? clean.slice(-8) : clean;
      const msgs = await prisma.smsMessage.findMany({
        where: {
          OR: [
            { phone: phone },
            { phone: clean },
            { phone: localPhone },
            { phone: `45${localPhone}` },
            { phone: `+45${localPhone}` }
          ]
        },
        select: { id: true }
      });
      targetIds = msgs.map(m => m.id);
    } else if (customerId) {
      const msgs = await prisma.smsMessage.findMany({
        where: { customerId: parseInt(customerId) },
        select: { id: true }
      });
      targetIds = msgs.map(m => m.id);
    }

    if (targetIds.length === 0) {
      return res.status(404).json({ message: 'No messages found to delete' });
    }

    // Delete ONLY the target SMS messages (Customer, Orders, & DiscountCodes are NEVER touched)
    await prisma.smsMessage.deleteMany({
      where: { id: { in: targetIds } }
    });

    res.json({ message: `${targetIds.length} message(s) deleted successfully` });
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
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: serialized },
      create: { key, value: serialized },
    });
    // setting.value is auto-parsed by prisma.js extension; return as-is
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
    console.log(`\n[SMS WEBHOOK] Received payload:`, JSON.stringify(req.body, null, 2));
    
    // Check if it's a Delivery Report (DLR)
    let webhookId = req.body.msg_id || req.body.id;
    let status = req.body.status;

    if (req.body.event_type === 'message.status.sms' && req.body.event) {
      webhookId = req.body.event.msg_id;
      status = req.body.event.status;
    }

    if (status && webhookId) {
      const gatewayId = String(webhookId);
      console.log(`[SMS WEBHOOK] Delivery report received: ID=${gatewayId}, Status=${status}`);
      
      const message = await prisma.smsMessage.findUnique({
        where: { gatewayId }
      });
      
      if (message) {
        await prisma.smsMessage.update({
          where: { gatewayId },
          data: { status }
        });
        console.log(`[SMS WEBHOOK] Updated message ${message.id} to ${status}`);
      }
      return res.json({ received: true });
    }

    // Otherwise, assume it might be an inbound MO SMS (e.g. STOP)
    const body = req.body.Body || req.body.message || '';
    const from = req.body.From || req.body.phone || '';

    if (body.trim().toUpperCase() === 'STOP') {
      await handleSmsOptOut(from.replace(/\D/g, '').slice(-10));
      return res.json({ message: 'Opt-out processed' });
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[SMS WEBHOOK] Error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

exports.forceSendSmsMessage = async (req, res) => {
  try {
    const messageId = parseInt(req.params.id);
    const msg = await prisma.smsMessage.findUnique({
      where: { id: messageId },
      include: { customer: true }
    });
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (msg.status === 'SENT' || msg.status === 'DELIVERED') return res.status(400).json({ message: 'Message already sent' });
    if (!msg.customer.smsMarketingConsent || msg.customer.smsOptOut) {
      await prisma.smsMessage.update({ where: { id: messageId }, data: { status: 'CANCELLED' } });
      return res.status(400).json({ message: 'Customer opted out or has no consent' });
    }
    const { sendSms } = require('../services/sms.service');
    const result = await sendSms(msg.phone, msg.message);
    if (result.sent) {
      await prisma.smsMessage.update({ where: { id: messageId }, data: { status: 'SENT', sentAt: new Date(), gatewayId: result.gatewayId } });
      res.json({ success: true, message: 'Message sent successfully' });
    } else {
      await prisma.smsMessage.update({ where: { id: messageId }, data: { status: 'FAILED' } });
      res.status(500).json({ success: false, message: result.error || 'Failed to send SMS' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
