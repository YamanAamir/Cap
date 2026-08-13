const prisma = require('../utils/prisma');

// ─── Admin: list all plans ────────────────────────────────────────────────────
exports.getInstallmentPlans = async (req, res) => {
  try {
    const plans = await prisma.installmentPlan.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { orders: true } } },
    });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Public: list only active plans (for FE) ─────────────────────────────────
exports.getPublicInstallmentPlans = async (req, res) => {
  try {
    const plans = await prisma.installmentPlan.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        program: true,
        packageTier: true,
        downPaymentPercent: true,
        installments: true,
        notes: true,
      },
    });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Admin: create plan ───────────────────────────────────────────────────────
exports.createInstallmentPlan = async (req, res) => {
  try {
    const { name, program, packageTier, isActive, downPaymentPercent, installments, notes } = req.body;

    if (!name || !program || !packageTier || downPaymentPercent === undefined) {
      return res.status(400).json({ message: 'name, program, packageTier, and downPaymentPercent are required.' });
    }

    // Validate total percent = 100
    const rows = Array.isArray(installments) ? installments : [];
    const totalPercent = parseFloat(downPaymentPercent) + rows.reduce((s, r) => s + (parseFloat(r.percent) || 0), 0);
    if (Math.abs(totalPercent - 100) > 0.01) {
      return res.status(400).json({ message: `Total percentages must equal 100%. Currently: ${totalPercent.toFixed(1)}%` });
    }

    const plan = await prisma.installmentPlan.create({
      data: {
        name,
        program,
        packageTier,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        downPaymentPercent: parseFloat(downPaymentPercent),
        installments: rows,
        notes: notes || null,
      },
    });
    res.status(201).json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── Admin: update plan ───────────────────────────────────────────────────────
exports.updateInstallmentPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, program, packageTier, isActive, downPaymentPercent, installments, notes } = req.body;

    // Validate total percent if both fields provided
    if (downPaymentPercent !== undefined && installments !== undefined) {
      const rows = Array.isArray(installments) ? installments : [];
      const totalPercent = parseFloat(downPaymentPercent) + rows.reduce((s, r) => s + (parseFloat(r.percent) || 0), 0);
      if (Math.abs(totalPercent - 100) > 0.01) {
        return res.status(400).json({ message: `Total percentages must equal 100%. Currently: ${totalPercent.toFixed(1)}%` });
      }
    }

    const plan = await prisma.installmentPlan.update({
      where: { id: parseInt(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(program !== undefined && { program }),
        ...(packageTier !== undefined && { packageTier }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(downPaymentPercent !== undefined && { downPaymentPercent: parseFloat(downPaymentPercent) }),
        ...(installments !== undefined && { installments }),
        ...(notes !== undefined && { notes }),
      },
    });
    res.json(plan);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Plan not found' });
    res.status(500).json({ message: err.message });
  }
};

// ─── Admin: delete plan ───────────────────────────────────────────────────────
exports.deleteInstallmentPlan = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.installmentPlan.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Installment plan deleted successfully' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Plan not found' });
    res.status(500).json({ message: err.message });
  }
};
