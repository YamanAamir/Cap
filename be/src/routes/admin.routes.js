const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const userController = require('../controllers/user.controller');
const settingsController = require('../controllers/settings.controller');
const { verifyToken, isAdmin, isAdminOrProduction } = require('../middleware/auth.middleware');

const admin = [verifyToken, isAdmin];
const adminOrProduction = [verifyToken, isAdminOrProduction];

router.get('/dashboard/stats', admin, adminController.getStats);
router.post('/seed', admin, adminController.seedSystem);

router.get('/users', admin, userController.getUsers);
router.post('/users', admin, userController.createUser);
router.put('/users/:id', admin, userController.updateUser);
router.delete('/users/:id', admin, userController.deleteUser);

router.get('/customers', admin, adminController.getCustomers);
router.get('/customers/:id', admin, adminController.getCustomerById);
router.put('/customers/:id', admin, adminController.updateCustomer);
router.delete('/customers/:id', admin, adminController.deleteCustomer);

router.get('/order-statuses', adminOrProduction, adminController.getOrderStatuses);
router.post('/order-statuses', admin, adminController.createOrderStatus);
router.patch('/order-statuses/:id', admin, adminController.updateOrderStatus);
router.delete('/order-statuses/:id', admin, adminController.deleteOrderStatus);

router.get('/discount-codes', admin, adminController.getDiscountCodes);
router.post('/discount-codes', admin, adminController.createDiscountCode);

router.get('/production/batches', admin, adminController.getProductionBatches);
router.get('/production/batches/:id', admin, adminController.getProductionBatch);
router.post('/production/generate', admin, adminController.generateProductionBatch);
router.post('/production/batches/:id/send', admin, adminController.sendProductionBatch);
router.get('/production/logs', admin, adminController.getDispatchLogs);

router.get('/sms/campaigns', admin, adminController.getSmsCampaigns);
router.post('/sms/campaigns', admin, adminController.createSmsCampaign);
router.patch('/sms/campaigns/:id', admin, adminController.updateSmsCampaign);
router.get('/sms/messages', admin, adminController.getSmsMessages);

router.get('/excel/columns', admin, adminController.getExcelColumns);
router.post('/excel/columns', admin, adminController.createExcelColumn);
router.put('/excel/columns', admin, adminController.updateExcelColumns);

router.get('/email-templates', admin, adminController.getEmailTemplates);
router.post('/email-templates', admin, adminController.createEmailTemplate);
router.patch('/email-templates/:key', admin, adminController.updateEmailTemplate);
router.delete('/email-templates/:id', admin, adminController.deleteEmailTemplate);

router.get('/settings', admin, adminController.getSettings);
router.put('/settings', admin, adminController.updateSetting);
// Configurator Settings
router.get('/settings/configurator', admin, settingsController.getConfiguratorSettings);
router.put('/settings/configurator', admin, settingsController.updateConfiguratorSettings);

module.exports = router;
