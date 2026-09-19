const express = require('express');
const router = express.Router();
const webshopController = require('../controllers/webshop.controller');

// Public Webshop Endpoints
router.get('/products', webshopController.getPublicProducts);
router.get('/products/:identifier', webshopController.getPublicProductBySlugOrId);
router.post('/checkout/create-session', webshopController.createCheckoutSession);

// Admin Web Dashboard Endpoints
router.post('/admin/upload', webshopController.uploadMiddleware, webshopController.adminUploadProductImage);
router.get('/admin/stats', webshopController.adminGetWebshopStats);
router.get('/admin/products', webshopController.adminGetProducts);
router.post('/admin/products', webshopController.adminCreateProduct);
router.put('/admin/products/:id', webshopController.adminUpdateProduct);
router.delete('/admin/products/:id', webshopController.adminDeleteProduct);

router.get('/admin/orders', webshopController.adminGetOrders);
router.put('/admin/orders/:id/status', webshopController.adminUpdateOrderStatus);
router.delete('/admin/orders/:id', webshopController.adminDeleteOrder);

router.get('/admin/customers', webshopController.adminGetCustomers);
router.put('/admin/customers/:id', webshopController.adminUpdateCustomer);
router.delete('/admin/customers/:id', webshopController.adminDeleteCustomer);

router.get('/admin/email-template', webshopController.adminGetEmailTemplate);
router.put('/admin/email-template', webshopController.adminUpdateEmailTemplate);

// Full CRUD for Email Templates & Order Statuses
router.get('/admin/email-templates', webshopController.adminGetEmailTemplates);
router.put('/admin/email-templates/reorder', webshopController.adminReorderEmailTemplates);
router.post('/admin/email-templates', webshopController.adminCreateEmailTemplate);
router.put('/admin/email-templates/:id', webshopController.adminUpdateEmailTemplateById);
router.delete('/admin/email-templates/:id', webshopController.adminDeleteEmailTemplate);

router.get('/admin/statuses', webshopController.adminGetStatuses);
router.put('/admin/statuses/reorder', webshopController.adminReorderStatuses);
router.post('/admin/statuses', webshopController.adminCreateStatus);
router.put('/admin/statuses/:id', webshopController.adminUpdateStatus);
router.delete('/admin/statuses/:id', webshopController.adminDeleteStatus);

module.exports = router;
