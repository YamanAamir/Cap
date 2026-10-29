const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/sendEmail.controller");

// Stripe requires raw body for webhook verification (also falls back to Frisbii if no stripe signature)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  webhookController.stripeWebhook
);

router.post(
  "/webhook/frisbii",
  express.json({ limit: "10mb" }),
  webhookController.frisbiiWebhook
);

router.post(
  "/webhook/flatpay",
  express.json({ limit: "10mb" }),
  webhookController.frisbiiWebhook
);

module.exports = router;
