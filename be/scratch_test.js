const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

async function testQuery(params) {
  const {
    search,
    status = 'all',
    statusId = 'all',
    installment = 'all',
    isVisibleToProduction = null,
    dateFilter = 'all',
    filter = 'all',
    startDate,
    endDate
  } = params;

  const where = {};
  const andConditions = [];

  if (search) {
    andConditions.push({
      OR: [
        { customerEmail: { contains: search } },
        { orderNumber: { contains: search } },
      ]
    });
  }

  if (status !== 'all') {
    where.status = status;
  }

  if (statusId !== 'all') {
    where.statusId = parseInt(statusId);
  }

  if (isVisibleToProduction === 'true') {
    andConditions.push({
      OR: [
        { orderStatus: { isVisibleToProduction: true } },
        { orderStatus: { triggersProduction: true } },
        { productionBatchId: { not: null } },
        { productionBatch: { status: 'SENT' } }
      ]
    });
  }

  if (installment === 'yes') {
    andConditions.push({
      OR: [
        { installmentPlanId: { not: null } },
        { NOT: { installmentDetails: { equals: Prisma.DbNull } } },
        { NOT: { installmentDetails: { equals: Prisma.JsonNull } } }
      ]
    });
  } else if (installment === 'no') {
    where.installmentPlanId = null;
    andConditions.push({
      OR: [
        { installmentDetails: { equals: Prisma.DbNull } },
        { installmentDetails: { equals: Prisma.JsonNull } }
      ]
    });
  }

  const activeDateFilter = dateFilter !== 'all' ? dateFilter : filter;

  if (activeDateFilter === 'today') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    where.createdAt = { gte: start, lte: end };
  } else if (activeDateFilter === 'month' || activeDateFilter === 'this_month') {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    where.createdAt = { gte: start, lte: end };
  } else if ((startDate || endDate) || activeDateFilter === 'custom') {
    const dateObj = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateObj.gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateObj.lte = end;
    }
    if (Object.keys(dateObj).length > 0) {
      where.createdAt = dateObj;
    }
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  console.log('\n--- TESTING PARAMS:', JSON.stringify(params), '---');
  console.log('Constructed where:', JSON.stringify(where, null, 2));

  const [orders, count] = await prisma.$transaction([
    prisma.order.findMany({ where, take: 5 }),
    prisma.order.count({ where })
  ]);

  console.log('Success! Count:', count, 'Fetched:', orders.length);
}

async function main() {
  await testQuery({ statusId: '19', installment: 'yes', dateFilter: 'all' });
  await testQuery({ search: 'CAP', installment: 'no', dateFilter: 'today' });
  await testQuery({ startDate: '2026-08-01', endDate: '2026-09-22', installment: 'yes' });
  await testQuery({ isVisibleToProduction: 'true', installment: 'yes' });
  await testQuery({ dateFilter: 'month', installment: 'no' });
}

main().finally(() => prisma.$disconnect());
