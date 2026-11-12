const cron = require('node-cron');
const { createProductionBatch, sendProductionBatch } = require('../services/core.service');
const { processPendingSms } = require('../services/sms.service');
const prisma = require('../utils/prisma');
const { runAllActiveJobs } = require('../services/installmentJob.service');
const { cleanupOldLogs } = require('../utils/audit');

const startScheduledJobs = () => {

  // Daily check for auto-export at 8 AM
  cron.schedule('0 8 * * *', async () => {
    try {
      const setting = await prisma.systemSetting.findUnique({ where: { key: 'auto_export_days' } });
      const days = setting?.value?.days || 0;
      
      if (days > 0) {
        const lastDispatch = await prisma.productionDispatchLog.findFirst({ orderBy: { sentAt: 'desc' } });
        let shouldRun = false;
        
        if (!lastDispatch) {
          shouldRun = true;
        } else {
          const diffTime = Math.abs(new Date() - lastDispatch.sentAt);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          if (diffDays >= days) shouldRun = true;
        }

        if (shouldRun) {
          console.log(`[CRON] Auto-export triggered (frequency: ${days} days). Generating batch...`);
          const batch = await createProductionBatch();
          if (batch) {
            console.log(`[CRON] Batch #${batch.id} created. Sending to manufacturer...`);
            await sendProductionBatch(batch.id, null); // sent by system
            console.log(`[CRON] Batch #${batch.id} sent successfully.`);
          } else {
            console.log('[CRON] No orders ready for production');
          }
        }
      }
    } catch (err) {
      console.error('[CRON] Auto-export error:', err.message);
    }
  });

  // SMS scheduler - every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      await processPendingSms();
    } catch (err) {
      console.error('[CRON] SMS processing error:', err.message);
    }
  });

  // Installment automation – checks every 5 minutes which orders are due for their next installment
  cron.schedule('*/5 * * * *', async () => {
    try {
      await runAllActiveJobs();
    } catch (err) {
      console.error('[CRON] Installment jobs error:', err.message);
    }
  }, { timezone: 'Europe/Copenhagen' });

  // Payment Receipts retry runner – automatically retries failed/pending admin receipts every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const { retryFailedReceipts } = require('../services/paymentReceipt.service');
      await retryFailedReceipts();
    } catch (err) {
      console.error('[CRON] Payment receipts retry error:', err.message);
    }
  });

  // Nightly cleanup of old log rows
  cron.schedule('30 3 * * *', async () => {
    await cleanupOldLogs();
  }, { timezone: 'Europe/Copenhagen' });

  console.log('Scheduled jobs started');
};

module.exports = { startScheduledJobs };
