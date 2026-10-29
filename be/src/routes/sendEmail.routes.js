const express = require('express');
const router = express.Router();
const { 
  workflowStatusChange, 
  sendCapEmail, 
  stripePayment, 
  getSessionDetails, 
  stripeWebhook, 
  createInstallmentOrder, 
  payInstallment,
  getInstallmentStatus
} = require('../controllers/sendEmail.controller');

router.put('/workflow/:id', workflowStatusChange);
router.post('/capconfigurator', sendCapEmail);
router.post('/create-checkout-session', stripePayment);
router.post('/create-installment-order', createInstallmentOrder);
router.get('/pay-installment', payInstallment);
router.get('/checkout-session', getSessionDetails);
router.get('/installment-status', getInstallmentStatus);

module.exports = router;
