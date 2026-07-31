const prisma = require('../utils/prisma');

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
    if (statusId) {
      const orderStatus = await prisma.orderStatus.findUnique({ where: { id: parseInt(statusId) } });
      if (orderStatus) {
        data.statusId = orderStatus.id;
        data.status = orderStatus.name.toUpperCase().replace(/\s+/g, '_');
      }
    } else if (status) {
      data.status = status;
      const orderStatus = await prisma.orderStatus.findFirst({
        where: { name: { equals: status.replace(/_/g, ' ') } },
      });
      if (orderStatus) data.statusId = orderStatus.id;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data,
      include: { orderStatus: true },
    });

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
