require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const webhookController = require("./controllers/sendEmail.controller");
const sendEmailRoutes = require('./routes/sendEmail.routes');
const authRoutes = require('./routes/auth.routes');
const orderRoutes = require('./routes/order.routes');
const adminRoutes = require('./routes/admin.routes');
const marketingRoutes = require('./routes/marketing.routes');
const cookieParser = require('cookie-parser');

const app = express();

// ✅ STRIPE WEBHOOK (MUST BE FIRST, NO JSON HERE)
app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  webhookController.stripeWebhook
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(cookieParser());

app.use(cors({
  origin: true,
  credentials: true,
}));

// static
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/exports', express.static(path.join(__dirname, '../public/exports')));

// routes
app.use('/api/sendEmail', sendEmailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/marketing', marketingRoutes);

// root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;