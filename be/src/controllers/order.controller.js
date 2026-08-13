const prisma = require('../utils/prisma');
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
          const rawUrl = process.env.VITE_API_BASE_URL || 'http://localhost:5000';
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

module.exports = {
  getOrders,
  getOrderById,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
};
