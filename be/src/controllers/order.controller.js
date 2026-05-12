const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
      status = 'all',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build filter
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

    // Sorting
    const orderBy = {};
    orderBy[sortBy] = order;

    // Fetch data and total count
    const [orders, totalCount] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / take);

    res.status(200).json({
      orders,
      pagination: {
        totalCount,
        totalPages,
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
    const { status } = req.body;

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status' });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  updateOrderStatus,
};
