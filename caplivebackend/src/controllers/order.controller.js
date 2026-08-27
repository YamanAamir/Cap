const prisma = require('../utils/prisma');
const { Prisma } = require('@prisma/client');
const { sendCustomerStatusEmail } = require('../services/core.service');

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
      where.orderStatus = { isVisibleToProduction: true };
    }
    if (installment === 'yes') {
      where.installmentDetails = { not: Prisma.AnyNull };
    } else if (installment === 'no') {
      where.installmentDetails = { equals: Prisma.AnyNull };
    }

    const orderBy = {};
    orderBy[sortBy] = order;

    const [orders, totalCount] = await prisma.$transaction([
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
    const order = await prisma.order.findUnique({
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

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, statusId } = req.body;

    const data = {};
    let newOrderStatus = null;
    
    if (statusId) {
      const orderStatus = await prisma.orderStatus.findUnique({ where: { id: parseInt(statusId) } });
      if (orderStatus) {
        data.statusId = orderStatus.id;
        data.status = orderStatus.name.toUpperCase().replace(/\s+/g, '_');
        newOrderStatus = orderStatus;
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

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data,
      include: { orderStatus: true },
    });

    if (newOrderStatus && newOrderStatus.customerEmailTemplateId) {
      // Send email asynchronously without blocking the response
      sendCustomerStatusEmail(updatedOrder.id, newOrderStatus.customerEmailTemplateId).catch(err => {
        console.error('Failed to send customer status email in background:', err);
      });
    }

    if (newOrderStatus && newOrderStatus.isInstallmentTrigger && newOrderStatus.installmentTriggerIndex !== null) {
      const idx = newOrderStatus.installmentTriggerIndex;
      if (updatedOrder.installmentDetails && updatedOrder.installmentDetails.installments && updatedOrder.installmentDetails.installments[idx]) {
        const installment = updatedOrder.installmentDetails.installments[idx];
        if (installment.status !== 'Paid') {
          // Use API_BASE_URL from env, or dynamically generate it from the incoming request headers
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
    res.status(500).json({ message: 'Error updating order status' });
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

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        customerEmail,
        customerDetails,
        totalPrice: parseFloat(totalPrice),
        statusId: statusId ? parseInt(statusId) : undefined,
        packageName,
        program
      },
      include: {
        orderStatus: true,
        customer: true,
      }
    });

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Error updating order' });
  }
};

const resendOrderEmails = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log(`♻️ Dashboard Action: Resending confirmation emails for Order: ${order.orderNumber} to Customer: ${order.customerEmail}...`);

    // Dynamically require to avoid circular dependencies
    const { sendCapEmail } = require('./sendEmail.controller');

    // Simulate response payload capture
    let responseStatus = 200;
    let responseData = null;

    const mockRes = {
      status: (code) => {
        responseStatus = code;
        return {
          json: (data) => {
            responseData = data;
          }
        };
      },
      json: (data) => {
        responseData = data;
      }
    };

    const mockReq = {
      body: {
        customerDetails: order.customerDetails,
        selectedOptions: order.selectedOptions,
        totalPrice: order.totalPrice,
        currency: order.currency,
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        email: order.customerEmail,
        packageName: order.packageName,
        program: order.program,
        capImages: order.capImages,
        installmentDetails: order.installmentDetails,
      }
    };

    await sendCapEmail(mockReq, mockRes);

    if (responseStatus === 200) {
      console.log(`✅ Dashboard Action: Successfully force-resent confirmation emails for Order: ${order.orderNumber}`);
      return res.status(200).json({ message: 'Emails sent successfully', details: responseData });
    } else {
      console.error(`❌ Dashboard Action: Failed to force-send emails for Order: ${order.orderNumber}:`, responseData);
      return res.status(responseStatus).json({ message: 'Failed to send emails', error: responseData });
    }

  } catch (error) {
    console.error('Error resending order emails:', error);
    res.status(500).json({ message: 'Error resending emails', error: error.message });
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
