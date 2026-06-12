const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getFlags = async (req, res) => {
  try {
    const flags = await prisma.flag.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json(flags);
  } catch (error) {
    console.error('Error fetching flags:', error);
    res.status(500).json({ message: 'Error fetching flags' });
  }
};

const createFlag = async (req, res) => {
  try {
    const { name, price } = req.body;
    const newFlag = await prisma.flag.create({
      data: { name, price: parseFloat(price) },
    });
    res.status(201).json(newFlag);
  } catch (error) {
    console.error('Error creating flag:', error);
    res.status(500).json({ message: 'Error creating flag' });
  }
};

const updateFlag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price } = req.body;
    const updatedFlag = await prisma.flag.update({
      where: { id: parseInt(id) },
      data: { name, price: parseFloat(price) },
    });
    res.status(200).json(updatedFlag);
  } catch (error) {
    console.error('Error updating flag:', error);
    res.status(500).json({ message: 'Error updating flag' });
  }
};

const deleteFlag = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.flag.delete({
      where: { id: parseInt(id) },
    });
    res.status(200).json({ message: 'Flag deleted successfully' });
  } catch (error) {
    console.error('Error deleting flag:', error);
    res.status(500).json({ message: 'Error deleting flag' });
  }
};

module.exports = {
  getFlags,
  createFlag,
  updateFlag,
  deleteFlag,
};
