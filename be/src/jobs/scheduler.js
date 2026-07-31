const cron = require('node-cron');
const { createProductionBatch } = require('../services/core.service');
const { processPendingSms } = require('../services/sms.service');
const { seedDefaults } = require('../services/core.service');

const startScheduledJobs = () => {
  seedDefaults().catch((err) => console.error('Seed error:', err.message));

  // Weekly production batch generation - Monday 8 AM
  cron.schedule('0 8 * * 1', async () => {
    try {
      console.log('[CRON] Generating weekly production batch...');
      const batch = await createProductionBatch();
      if (batch) {
        console.log(`[CRON] Production batch #${batch.id} created with ${batch.orderCount} orders`);
      } else {
        console.log('[CRON] No orders ready for production');
      }
    } catch (err) {
      console.error('[CRON] Production batch error:', err.message);
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

  console.log('Scheduled jobs started');
};

module.exports = { startScheduledJobs };
