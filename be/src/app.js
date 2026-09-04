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

function safeParseJson(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // Guard against corrupted "[object Object]" / "[object Array]" etc. from .toString()
    if (trimmed === '[object Object]' || trimmed === '[object Array]') return null;
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(value);
        return safeParseJson(parsed);
      } catch (e) {
        return value;
      }
    }
  }
  if (Array.isArray(value)) {
    return value.map(safeParseJson);
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const parsedObj = {};
    for (const key of Object.keys(value)) {
      parsedObj[key] = safeParseJson(value[key]);
    }
    return parsedObj;
  }
  return value;
}

app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    return originalJson.call(this, safeParseJson(body));
  };
  next();
});

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