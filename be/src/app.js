require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const webhookController = require("./controllers/sendEmail.controller");
const sendEmailRoutes = require('./routes/sendEmail.routes');
const authRoutes = require('./routes/auth.routes');
const orderRoutes = require('./routes/order.routes');
const flagRoutes = require('./routes/flag.routes');
const cookieParser = require('cookie-parser');

const app = express();

// ✅ STRIPE WEBHOOK (MUST BE FIRST, NO JSON HERE)
app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  webhookController.stripeWebhook
);

// ❗ ab baaki middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true,
}));

// static
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// routes
app.use('/api/sendEmail', sendEmailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/flags', flagRoutes);

// root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;