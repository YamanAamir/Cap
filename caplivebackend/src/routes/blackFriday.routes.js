const express = require('express');
const router = express.Router();
const blackFridayController = require('../controllers/blackFriday.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

const admin = [verifyToken, isAdmin];

// Public endpoint for WordPress VIP signup
router.post('/register', blackFridayController.registerLead);

// Admin: Notification & Integration Settings
router.get('/settings', admin, blackFridayController.getSettings);
router.post('/settings', admin, blackFridayController.updateSettings);

// Admin: VIP Lead Management & Broadcasts
router.get('/leads', admin, blackFridayController.getLeads);
router.delete('/leads/:id', admin, blackFridayController.deleteLead);
router.post('/leads/bulk-delete', admin, blackFridayController.bulkDeleteLeads);
router.post('/broadcast-sms', admin, blackFridayController.broadcastSms);
router.post('/broadcast-email', admin, blackFridayController.broadcastEmail);
router.get('/export', admin, blackFridayController.exportLeadsCsv);

module.exports = router;
