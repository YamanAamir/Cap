const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const settingsController = require('../controllers/settings.controller');
const installmentController = require('../controllers/installment.controller');

router.get('/sms-campaigns/:slug', adminController.getSmsCampaignBySlug);
router.post('/sms-signup', adminController.smsSignup);
router.post('/validate-discount', adminController.validateDiscountCode);
router.post('/sms-webhook', adminController.smsWebhook);

// Public Configurator Settings
router.get('/configurator-settings', settingsController.getConfiguratorSettings);

// Public Installment Plans
router.get('/installment-plans', installmentController.getPublicInstallmentPlans);

module.exports = router;
