const prisma = require('../utils/prisma');
const { Prisma } = require('@prisma/client');
const { sendCustomerStatusEmail } = require('../services/core.service');

// Auto-fix orders whose installmentDetails were corrupted into 100+ rates by character-count string bug
const fixCorruptedInstallments = async (order) => {
  if (!order || !order.installmentDetails) return order;

  let details = order.installmentDetails;
  if (typeof details === 'string') {
    try { details = JSON.parse(details); } catch { return order; }
  }

  if (details && Array.isArray(details.installments) && details.installments.length > 20) {
    let plan = order.installmentPlan;
    if (!plan && order.installmentPlanId) {
      plan = await prisma.installmentPlan.findUnique({ where: { id: order.installmentPlanId } });
    }

    let planRows = plan ? plan.installments : [];
    if (typeof planRows === 'string') {
      try { planRows = JSON.parse(planRows); } catch { planRows = []; }
    }
    if (!Array.isArray(planRows) || planRows.length === 0) {
      planRows = [{ label: 'Rate 2' }, { label: 'Rate 3' }];
    }

    const downPayment = plan?.downPaymentAmount || details.downPayment || 399;
    const remainingAmount = Math.max(0, (order.totalPrice || 0) - downPayment);
    const installmentCount = planRows.length;
    const installmentAmount = installmentCount > 0 ? (remainingAmount / installmentCount).toFixed(2) : 0;

    const firstPaidAt = details.installments[0]?.paidAt || order.orderDate || new Date().toISOString();

    const correctedInstallments = [
      {
        amount: downPayment,
        label: "1. betaling (ved bestilling)",
        status: 'Paid',
        paidAt: firstPaidAt
      }
    ];

    for (let i = 0; i < installmentCount; i++) {
      const prevInst = details.installments[i + 1];
      correctedInstallments.push({
        amount: parseFloat(installmentAmount),
        label: planRows[i]?.label || `${i + 2}. rate`,
        status: (prevInst && prevInst.status === 'Paid') ? 'Paid' : 'Pending',
        paidAt: (prevInst && prevInst.status === 'Paid') ? prevInst.paidAt : null
      });
    }

    const fixedDetails = {
      downPayment,
      installments: correctedInstallments
    };

    try {
      await prisma.order.update({
        where: { id: order.id },
        data: { installmentDetails: JSON.stringify(fixedDetails) }
      });
    } catch (e) {
      console.error('Failed to update fixed installment details:', e);
    }

    order.installmentDetails = fixedDetails;
  }

  return order;
};

const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
      status = 'all',
      statusId = 'all',
      installment = 'all',
      isVisibleToProduction = null,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { customerEmail: { contains: search } },
        { orderNumber: { contains: search } },
      ];
    }
    if (status !== 'all') {
      where.status = status;
    }
    if (statusId !== 'all') {
      where.statusId = parseInt(statusId);
    }
    if (isVisibleToProduction === 'true') {
      where.productionBatch = { status: 'SENT' };
    }
    if (installment === 'yes') {
      where.installmentDetails = { not: Prisma.AnyNull };
    } else if (installment === 'no') {
      where.installmentDetails = { equals: Prisma.AnyNull };
    }

    const orderBy = {};
    orderBy[sortBy] = order;

    const [rawOrders, totalCount] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          orderStatus: true,
          customer: true,
          discountCode: true,
          installmentPlan: true,
        },

      }),
      prisma.order.count({ where }),
    ]);

    const orders = await Promise.all(rawOrders.map(fixCorruptedInstallments));

    res.status(200).json({
      orders,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / take),
        currentPage: parseInt(page),
        limit: take,
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    let order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        orderStatus: true,
        customer: true,
        discountCode: true,
        productionBatch: true,
        installmentPlan: true,
      },

    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order = await fixCorruptedInstallments(order);

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, statusId } = req.body;

    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderStatus: true },
    });

    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const data = {};
    let newOrderStatus = null;
    
    if (statusId !== undefined && statusId !== null && statusId !== '') {
      const numericStatusId = parseInt(statusId);
      if (!isNaN(numericStatusId)) {
        const orderStatus = await prisma.orderStatus.findUnique({ where: { id: numericStatusId } });
        if (orderStatus) {
          data.statusId = orderStatus.id;
          data.status = orderStatus.name.toUpperCase().replace(/\s+/g, '_');
          newOrderStatus = orderStatus;
        } else {
          return res.status(400).json({ message: `Order status with ID ${statusId} not found` });
        }
      }
    } else if (status) {
      data.status = status;
      const orderStatus = await prisma.orderStatus.findFirst({
        where: { name: { equals: status.replace(/_/g, ' ') } },
      });
      if (orderStatus) {
        data.statusId = orderStatus.id;
        newOrderStatus = orderStatus;
      }
    }

    // Append to audit history
    if (newOrderStatus) {
      let custDetails = existingOrder.customerDetails;
      if (typeof custDetails === 'string') {
        try { custDetails = JSON.parse(custDetails); } catch { custDetails = {}; }
      } else if (!custDetails || typeof custDetails !== 'object') {
        custDetails = {};
      } else {
        custDetails = { ...custDetails };
      }
      if (!Array.isArray(custDetails._history)) {
        custDetails._history = custDetails._history ? [custDetails._history] : [];
      } else {
        custDetails._history = [...custDetails._history];
      }

      const prevStatusName = existingOrder.orderStatus?.name || existingOrder.status || 'Pending';
      const prevStatusColor = existingOrder.orderStatus?.color || '#6366f1';

      custDetails._history.unshift({
        id: `hist_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'STATUS_CHANGE',
        badge: `${prevStatusName} ➔ ${newOrderStatus.name}`,
        title: `Status opdateret til "${newOrderStatus.name}"`,
        description: `Status blev ændret fra "${prevStatusName}" til "${newOrderStatus.name}". ${newOrderStatus.customerEmailTemplateId ? 'Kunde-email blev automatisk afsendt.' : ''}`,
        oldStatus: prevStatusName,
        newStatus: newOrderStatus.name,
        oldStatusColor: prevStatusColor,
        newStatusColor: newOrderStatus.color,
        performedBy: req.user?.name || req.user?.email || 'Admin',
      });

      data.customerDetails = typeof custDetails === 'string' ? custDetails : JSON.stringify(custDetails);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data,
      include: {
        orderStatus: true,
        customer: true,
        discountCode: true,
        installmentPlan: true,
      },
    });

    if (newOrderStatus && newOrderStatus.customerEmailTemplateId) {
      // Send email asynchronously without blocking the response
      sendCustomerStatusEmail(updatedOrder.id, newOrderStatus.customerEmailTemplateId).catch(err => {
        console.error('Failed to send customer status email in background:', err);
      });
    }

    if (newOrderStatus && newOrderStatus.isInstallmentTrigger && newOrderStatus.installmentTriggerIndex !== null && newOrderStatus.installmentTriggerIndex !== undefined) {
      const idx = newOrderStatus.installmentTriggerIndex;
      let instDetails = updatedOrder.installmentDetails;
      if (typeof instDetails === 'string') {
        try { instDetails = JSON.parse(instDetails); } catch { instDetails = null; }
      }
      if (instDetails && instDetails.installments && instDetails.installments[idx]) {
        const installment = instDetails.installments[idx];
        if (installment.status !== 'Paid') {
          // Use API_BASE_URL from env, or dynamically generate it from the incoming request headers
          const protocol = req.headers['x-forwarded-proto'] || req.protocol;
          const host = req.headers['x-forwarded-host'] || (req.get ? req.get('host') : 'localhost');
          const rawUrl = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || `${protocol}://${host}`;
          
          const apiRoot = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/api`;
          const paymentLink = `${apiRoot}/sendEmail/pay-installment?orderId=${updatedOrder.id}&installmentIndex=${idx}`;
          
          let custDetailsObj = updatedOrder.customerDetails;
          if (typeof custDetailsObj === 'string') {
            try { custDetailsObj = JSON.parse(custDetailsObj); } catch { custDetailsObj = {}; }
          }
          const subject = `Din næste rate for ordre ${updatedOrder.orderNumber} er klar til betaling`;
          const body = `
            <h2>Hej ${custDetailsObj?.firstName || ''},</h2>
            <p>Din næste rate (<strong>${installment.label}</strong>) på <strong>${installment.amount} DKK</strong> er nu klar til at blive betalt.</p>
            <p>Klik på linket nedenfor for at fuldføre betalingen sikkert via Stripe:</p>
            <p><a href="${paymentLink}" style="display:inline-block; padding:10px 20px; background-color:#16a34a; color:#fff; text-decoration:none; border-radius:5px; font-weight:bold;">Betal nu</a></p>
            <p>Tak fordi du handler hos os!</p>
          `;
          
          try {
            const { sendOrderEmail } = require('../services/core.service');
            sendOrderEmail(updatedOrder.customerEmail, subject, body).catch(err => {
              console.error('Failed to send installment payment email:', err);
            });
          } catch (mailErr) {
            console.error('Failed to load email service:', mailErr);
          }
        }
      }
    }

    const fixedOrder = await fixCorruptedInstallments(updatedOrder);
    res.status(200).json(fixedOrder || updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.order.delete({
      where: { id: parseInt(id) }
    });
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Error deleting order' });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerEmail, customerDetails, totalPrice, statusId, packageName, program } = req.body;

    const data = {};
    if (customerEmail !== undefined) data.customerEmail = customerEmail;
    if (customerDetails !== undefined) data.customerDetails = typeof customerDetails === 'string' ? customerDetails : JSON.stringify(customerDetails);
    if (totalPrice !== undefined) data.totalPrice = parseFloat(totalPrice);
    if (packageName !== undefined) data.packageName = packageName;
    if (program !== undefined) data.program = program;

    let newOrderStatus = null;
    if (statusId) {
      const orderStatus = await prisma.orderStatus.findUnique({
        where: { id: parseInt(statusId) }
      });
      if (orderStatus) {
        data.statusId = orderStatus.id;
        data.status = orderStatus.name.toUpperCase().replace(/\s+/g, '_');
        newOrderStatus = orderStatus;
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data,
      include: {
        orderStatus: true,
        customer: true,
      }
    });

    if (newOrderStatus && newOrderStatus.customerEmailTemplateId) {
      sendCustomerStatusEmail(updatedOrder.id, newOrderStatus.customerEmailTemplateId).catch(err => {
        console.error('Failed to send customer status email in background:', err);
      });
    }

    if (newOrderStatus && newOrderStatus.isInstallmentTrigger && newOrderStatus.installmentTriggerIndex !== null) {
      const idx = newOrderStatus.installmentTriggerIndex;
      if (updatedOrder.installmentDetails && updatedOrder.installmentDetails.installments && updatedOrder.installmentDetails.installments[idx]) {
        const installment = updatedOrder.installmentDetails.installments[idx];
        if (installment.status !== 'Paid') {
          const protocol = req.headers['x-forwarded-proto'] || req.protocol;
          const host = req.headers['x-forwarded-host'] || req.get('host');
          const rawUrl = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || `${protocol}://${host}`;
          
          const apiRoot = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/api`;
          const paymentLink = `${apiRoot}/sendEmail/pay-installment?orderId=${updatedOrder.id}&installmentIndex=${idx}`;
          
          const subject = `Din næste rate for ordre ${updatedOrder.orderNumber} er klar til betaling`;
          const body = `
            <h2>Hej ${updatedOrder.customerDetails?.firstName || ''},</h2>
            <p>Din næste rate (<strong>${installment.label}</strong>) på <strong>${installment.amount} DKK</strong> er nu klar til at blive betalt.</p>
            <p>Klik på linket nedenfor for at fuldføre betalingen sikkert via Stripe:</p>
            <p><a href="${paymentLink}" style="display:inline-block; padding:10px 20px; background-color:#16a34a; color:#fff; text-decoration:none; border-radius:5px; font-weight:bold;">Betal nu</a></p>
            <p>Tak fordi du handler hos os!</p>
          `;
          
          const { sendOrderEmail } = require('../services/core.service');
          sendOrderEmail(updatedOrder.customerEmail, subject, body).catch(err => {
            console.error('Failed to send installment payment email:', err);
          });
        }
      }
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Error updating order' });
  }
};

const resendOrderEmails = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      sendToCustomer = true,
      sendToAdmin = true,
      sendToFactory = true,
      customCustomerEmail,
      customAdminEmail,
      customFactoryEmail,
    } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: { orderStatus: true, customer: true }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const {
      createEmailTransporter,
      capOrderEmail,
      capOrderAdminEmail,
      factoryOrderEmail
    } = require('./sendEmail.controller');

    const safeParse = (data) => {
      if (!data) return {};
      if (typeof data === 'object') return data;
      try { return JSON.parse(data); } catch { return {}; }
    };

    const customerDetails = safeParse(order.customerDetails);
    const selectedOptions = safeParse(order.selectedOptions);
    const capImages = safeParse(order.capImages);

    // Prepare attachments for customer email if capImages exist
    let capAttachments = [];
    if (capImages && typeof capImages === 'object') {
      Object.entries(capImages).forEach(([key, val]) => {
        if (typeof val === 'string' && val.startsWith('data:image')) {
          const parts = val.split(';base64,');
          if (parts[1]) {
            capAttachments.push({
              filename: `cap-${key}.png`,
              content: Buffer.from(parts[1], 'base64'),
              cid: `cap_${key}_image`
            });
          }
        }
      });
    }

    const orderPayload = {
      customerDetails,
      selectedOptions,
      totalPrice: order.totalPrice,
      currency: order.currency || 'DKK',
      orderNumber: order.orderNumber,
      orderDate: order.orderDate ? new Date(order.orderDate) : new Date(),
      packageName: order.packageName,
      program: order.program,
      email: customCustomerEmail || order.customerEmail,
    };

    const transporter = createEmailTransporter();
    const sentResults = [];
    const errors = [];

    // 1. Send to Customer
    if (sendToCustomer) {
      const targetEmail = customCustomerEmail || order.customerEmail;
      if (targetEmail) {
        try {
          const emailContent = capOrderEmail(orderPayload);
          await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: targetEmail,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
            attachments: capAttachments,
          });
          sentResults.push(`Kunde (${targetEmail})`);
        } catch (err) {
          console.error('Failed to send customer email:', err);
          errors.push(`Kunde: ${err.message}`);
        }
      }
    }

    // 2. Send to Admin
    if (sendToAdmin) {
      const targetAdminEmail = customAdminEmail || 'salg@studentlife.dk';
      try {
        const emailContentAdmin = capOrderAdminEmail(orderPayload);
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: targetAdminEmail,
          subject: emailContentAdmin.subject,
          html: emailContentAdmin.html,
          text: emailContentAdmin.text,
        });
        sentResults.push(`Admin (${targetAdminEmail})`);
      } catch (err) {
        console.error('Failed to send admin email:', err);
        errors.push(`Admin: ${err.message}`);
      }
    }

    // 3. Send to Factory
    if (sendToFactory) {
      try {
        const manufacturerSetting = await prisma.systemSetting.findUnique({ where: { key: 'manufacturer_email' } });
        const targetFactoryEmail = customFactoryEmail || manufacturerSetting?.value?.email || 'salg@studentlife.dk';
        const emailContentFactory = factoryOrderEmail(orderPayload);
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: targetFactoryEmail,
          subject: emailContentFactory.subject,
          html: emailContentFactory.html,
          text: emailContentFactory.text,
        });
        sentResults.push(`Fabrik (${targetFactoryEmail})`);
      } catch (err) {
        console.error('Failed to send factory email:', err);
        errors.push(`Fabrik: ${err.message}`);
      }
    }

    if (sentResults.length === 0 && errors.length > 0) {
      return res.status(500).json({ message: 'Kunne ikke afsende valgte emails', errors });
    }

    // Log to order history
    if (sentResults.length > 0) {
      let custDetails = customerDetails;
      if (!Array.isArray(custDetails._history)) custDetails._history = [];
      custDetails._history.unshift({
        id: `hist_email_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'EMAIL_SENT',
        badge: 'Email Sendt',
        badgeColor: '#10b981',
        title: `Ordre-emails afsendt`,
        description: `Manuel afsendelse af ordredokumenter til: ${sentResults.join(', ')}`,
        performedBy: req.user?.name || req.user?.email || 'Admin',
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { customerDetails: typeof custDetails === 'string' ? custDetails : JSON.stringify(custDetails) }
      });
    }

    return res.status(200).json({
      message: `Emails succesfuldt sendt til: ${sentResults.join(', ')}`,
      sentTo: sentResults,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Error in resendOrderEmails:', error);
    res.status(500).json({ message: 'Error sending order emails', error: error.message });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
  resendOrderEmails,
};
