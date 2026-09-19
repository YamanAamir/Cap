const prisma = require('../utils/prisma');
const Stripe = require('stripe');
const nodemailer = require('nodemailer');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.simply.com",
    port: parseInt(process.env.EMAIL_PORT || "465"),
    secure: process.env.EMAIL_SECURE !== "false",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Helper: Slugify string
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Helper: JSON serialization & deserialization helpers for DB LongText fields
const parseJsonSafely = (val, fallback = null) => {
  if (val === null || val === undefined) return fallback;
  if (typeof val !== 'string') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return val || fallback;
  }
};

const stringifyJsonSafely = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') return val;
  try {
    return JSON.stringify(val);
  } catch (e) {
    return null;
  }
};

const formatProduct = (product) => {
  if (!product) return product;
  return {
    ...product,
    images: parseJsonSafely(product.images, []),
  };
};

const formatCustomer = (customer) => {
  if (!customer) return customer;
  return {
    ...customer,
    address: parseJsonSafely(customer.address, customer.address),
    orders: Array.isArray(customer.orders) ? customer.orders.map(formatOrder) : customer.orders,
  };
};

const formatOrder = (order) => {
  if (!order) return order;
  return {
    ...order,
    customerDetails: parseJsonSafely(order.customerDetails, {}),
    shippingAddress: parseJsonSafely(order.shippingAddress, order.shippingAddress),
    items: parseJsonSafely(order.items, []),
    webshopCustomer: order.webshopCustomer ? formatCustomer(order.webshopCustomer) : order.webshopCustomer,
  };
};

// =========================================
// PUBLIC WEBSHOP CONTROLLER METHODS
// =========================================

// Get all active products for webshop
exports.getPublicProducts = async (req, res) => {
  try {
    const products = await prisma.webshopProduct.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return res.status(200).json({ success: true, data: products.map(formatProduct) });
  } catch (error) {
    console.error('Error fetching webshop products:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
};

// Get single product by slug or id
exports.getPublicProductBySlugOrId = async (req, res) => {
  try {
    const { identifier } = req.params;
    let product;

    if (!isNaN(identifier)) {
      product = await prisma.webshopProduct.findUnique({
        where: { id: parseInt(identifier) },
      });
    }

    if (!product) {
      product = await prisma.webshopProduct.findUnique({
        where: { slug: identifier },
      });
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({ success: true, data: formatProduct(product) });
  } catch (error) {
    console.error('Error fetching product detail:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch product detail', error: error.message });
  }
};

// Create Stripe Checkout Session for Webshop
exports.createCheckoutSession = async (req, res) => {
  try {
    const { customerDetails, items, origin } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are empty' });
    }

    if (!customerDetails || !customerDetails.email) {
      return res.status(400).json({ success: false, message: 'Customer email is required' });
    }

    const line_items = items.map((item) => {
      const unitAmount = Math.round((parseFloat(item.price) || 0) * 100);
      const imgArray = parseJsonSafely(item.images, []);
      return {
        price_data: {
          currency: 'dkk',
          product_data: {
            name: item.title || 'Webshop Product',
            description: item.shortDescription || undefined,
            images: Array.isArray(imgArray) && imgArray.length > 0 ? [imgArray[0]] : [],
          },
          unit_amount: unitAmount,
        },
        quantity: parseInt(item.quantity) || 1,
      };
    });

    const clientOrigin = origin || req.headers.origin || 'http://localhost:5173';
    
    // Store cart & customer details in session metadata
    const metadata = {
      isWebshop: 'true',
      customerName: `${customerDetails.firstName || ''} ${customerDetails.lastName || ''}`.trim(),
      customerEmail: customerDetails.email,
      customerPhone: customerDetails.phone || '',
      customerAddress: JSON.stringify({
        address: customerDetails.address || '',
        city: customerDetails.city || '',
        zip: customerDetails.zip || '',
        country: customerDetails.country || 'Denmark',
      }),
      cartItems: JSON.stringify(items.map(i => {
        const itemImgs = parseJsonSafely(i.images, []);
        return {
          id: i.id,
          title: i.title,
          price: i.price,
          quantity: i.quantity,
          image: Array.isArray(itemImgs) && itemImgs.length > 0 ? itemImgs[0] : null
        };
      })),
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      customer_email: customerDetails.email,
      metadata,
      success_url: `${clientOrigin}/webshop.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientOrigin}/checkout.html?payment=cancelled`,
    });

    return res.status(200).json({ success: true, url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Error creating webshop checkout session:', error);
    return res.status(500).json({ success: false, message: 'Failed to initiate checkout', error: error.message });
  }
};


// =========================================
// STRIPE WEBHOOK HANDLER FOR WEBSHOP
// =========================================

exports.handleWebshopCheckoutSuccess = async (session) => {
  try {
    if (!session || session.metadata?.isWebshop !== 'true') {
      return;
    }

    const sessionId = session.id;

    // Check if order already exists for this session
    const existingOrder = await prisma.webshopOrder.findUnique({
      where: { stripeSessionId: sessionId },
    });

    if (existingOrder) {
      console.log(`Webshop order already processed for session ${sessionId}`);
      return;
    }

    const email = session.customer_details?.email || session.metadata?.customerEmail;
    const name = session.metadata?.customerName || session.customer_details?.name || 'Webshop Customer';
    const phone = session.metadata?.customerPhone || session.customer_details?.phone || '';
    
    let address = null;
    try {
      if (session.metadata?.customerAddress) {
        address = JSON.parse(session.metadata.customerAddress);
      }
    } catch (e) {
      address = session.customer_details?.address || null;
    }

    let items = [];
    try {
      if (session.metadata?.cartItems) {
        items = JSON.parse(session.metadata.cartItems);
      }
    } catch (e) {
      items = [];
    }

    const stringifiedAddress = stringifyJsonSafely(address);
    const stringifiedCustomerDetails = stringifyJsonSafely({ name, email, phone });
    const stringifiedItems = stringifyJsonSafely(items);

    // 1. Create or Update Webshop Customer record
    let customer = await prisma.webshopCustomer.findUnique({
      where: { email },
    });

    if (!customer) {
      customer = await prisma.webshopCustomer.create({
        data: {
          name,
          email,
          phone,
          address: stringifiedAddress,
        },
      });
    } else {
      customer = await prisma.webshopCustomer.update({
        where: { id: customer.id },
        data: {
          name: name || customer.name,
          phone: phone || customer.phone,
          address: stringifiedAddress || customer.address,
        },
      });
    }

    // 2. Generate unique order number
    const orderNumber = `WS-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const totalAmount = (session.amount_total || 0) / 100;

    // 3. Create Webshop Order record
    const order = await prisma.webshopOrder.create({
      data: {
        orderNumber,
        stripeSessionId: sessionId,
        customerEmail: email,
        customerDetails: stringifiedCustomerDetails,
        shippingAddress: stringifiedAddress,
        items: stringifiedItems,
        totalAmount,
        currency: (session.currency || 'dkk').toUpperCase(),
        paymentStatus: 'PAID',
        orderStatus: 'PENDING',
        webshopCustomerId: customer.id,
      },
    });

    console.log(`Successfully created Webshop Order ${order.orderNumber} for customer ${email}`);

    // 4. Update Product Stock Counts
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.id) {
          try {
            const product = await prisma.webshopProduct.findUnique({ where: { id: parseInt(item.id) } });
            if (product) {
              const newStock = Math.max(0, product.stockCount - (parseInt(item.quantity) || 1));
              await prisma.webshopProduct.update({
                where: { id: product.id },
                data: {
                  stockCount: newStock,
                  isOutOfStock: newStock <= 0,
                },
              });
            }
          } catch (stockErr) {
            console.error(`Error updating stock for product ${item.id}:`, stockErr);
          }
        }
      }
    }

    // 5. Trigger Webshop Order Confirmation Email
    try {
      await exports.sendWebshopOrderConfirmationEmail(order, customer);
    } catch (emailErr) {
      console.error('Error sending webshop order confirmation email:', emailErr);
    }

  } catch (error) {
    console.error('Error handling webshop checkout webhook success:', error);
  }
};

// Send Webshop Confirmation Email
exports.sendWebshopOrderConfirmationEmail = async (order, customer) => {
  try {
    let template = await prisma.webshopEmailTemplate.findUnique({
      where: { key: 'ORDER_CONFIRMATION' },
    });

    let subject = template?.subject || `Order Confirmation - ${order.orderNumber}`;
    let bodyHtml = template?.body;

    const items = parseJsonSafely(order.items, []);
    const customerObj = formatCustomer(customer) || {};

    if (!bodyHtml) {
      const itemsListHtml = (Array.isArray(items) ? items : []).map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title || 'Product'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity || 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price} DKK</td>
        </tr>
      `).join('');

      bodyHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #1e3a8a;">Thank you for your order!</h2>
          <p>Hi ${customerObj.name || 'Customer'},</p>
          <p>We have received your order <strong>${order.orderNumber}</strong> and it is being processed.</p>
          
          <h3 style="margin-top: 20px;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; text-align: left;">Item</th>
                <th style="padding: 10px; text-align: center;">Qty</th>
                <th style="padding: 10px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsListHtml}
            </tbody>
          </table>

          <div style="margin-top: 20px; text-align: right; font-size: 16px;">
            <strong>Total Paid: ${order.totalAmount} ${order.currency}</strong>
          </div>

          <p style="margin-top: 30px; font-size: 12px; color: #777;">If you have any questions, please contact our support.</p>
        </div>
      `;
    } else {
      bodyHtml = bodyHtml
        .replace(/{customer_name}/g, customerObj.name || '')
        .replace(/{order_number}/g, order.orderNumber || '')
        .replace(/{order_total}/g, `${order.totalAmount} ${order.currency}`);
    }

    const transporter = createEmailTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@studentlife.dk',
      to: customerObj.email || order.customerEmail,
      subject: subject,
      html: bodyHtml,
    });

    console.log(`Webshop confirmation email sent to ${customerObj.email || order.customerEmail} for order ${order.orderNumber}`);
  } catch (error) {
    console.error('Failed to send webshop order confirmation email:', error);
  }
};


// =========================================
// ADMIN WEB DASHBOARD CONTROLLER METHODS
// =========================================

// Admin: Get all products
exports.adminGetProducts = async (req, res) => {
  try {
    const products = await prisma.webshopProduct.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: products.map(formatProduct) });
  } catch (error) {
    console.error('Admin get products error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
};

// Admin: Create product
exports.adminCreateProduct = async (req, res) => {
  try {
    const {
      title,
      slug,
      shortDescription,
      longDescription,
      price,
      stockCount,
      isActive,
      isOutOfStock,
      images,
    } = req.body;

    if (!title || price === undefined) {
      return res.status(400).json({ success: false, message: 'Product title and price are required' });
    }

    const finalSlug = slug ? slugify(slug) : slugify(title);

    const existingSlug = await prisma.webshopProduct.findUnique({ where: { slug: finalSlug } });
    const uniqueSlug = existingSlug ? `${finalSlug}-${Date.now()}` : finalSlug;

    const newProduct = await prisma.webshopProduct.create({
      data: {
        title,
        slug: uniqueSlug,
        shortDescription: shortDescription || '',
        longDescription: longDescription || '',
        price: parseFloat(price) || 0,
        stockCount: parseInt(stockCount) || 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        isOutOfStock: isOutOfStock !== undefined ? Boolean(isOutOfStock) : (parseInt(stockCount) <= 0),
        images: stringifyJsonSafely(images || []),
      },
    });

    return res.status(201).json({ success: true, data: formatProduct(newProduct), message: 'Product created successfully' });
  } catch (error) {
    console.error('Admin create product error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create product', error: error.message });
  }
};

// Admin: Update product
exports.adminUpdateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      shortDescription,
      longDescription,
      price,
      stockCount,
      isActive,
      isOutOfStock,
      images,
    } = req.body;

    const existingProduct = await prisma.webshopProduct.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let finalSlug = existingProduct.slug;
    if (slug && slug !== existingProduct.slug) {
      finalSlug = slugify(slug);
      const slugCheck = await prisma.webshopProduct.findFirst({
        where: { slug: finalSlug, NOT: { id: parseInt(id) } },
      });
      if (slugCheck) {
        finalSlug = `${finalSlug}-${Date.now()}`;
      }
    }

    const updatedProduct = await prisma.webshopProduct.update({
      where: { id: parseInt(id) },
      data: {
        title: title !== undefined ? title : existingProduct.title,
        slug: finalSlug,
        shortDescription: shortDescription !== undefined ? shortDescription : existingProduct.shortDescription,
        longDescription: longDescription !== undefined ? longDescription : existingProduct.longDescription,
        price: price !== undefined ? parseFloat(price) : existingProduct.price,
        stockCount: stockCount !== undefined ? parseInt(stockCount) : existingProduct.stockCount,
        isActive: isActive !== undefined ? Boolean(isActive) : existingProduct.isActive,
        isOutOfStock: isOutOfStock !== undefined ? Boolean(isOutOfStock) : existingProduct.isOutOfStock,
        images: images !== undefined ? stringifyJsonSafely(images) : existingProduct.images,
      },
    });

    return res.status(200).json({ success: true, data: formatProduct(updatedProduct), message: 'Product updated successfully' });
  } catch (error) {
    console.error('Admin update product error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
  }
};

// Admin: Delete product
exports.adminDeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.webshopProduct.delete({
      where: { id: parseInt(id) },
    });
    return res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Admin delete product error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
  }
};

// Admin: Get all Webshop Orders
exports.adminGetOrders = async (req, res) => {
  try {
    const orders = await prisma.webshopOrder.findMany({
      include: {
        webshopCustomer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: orders.map(formatOrder) });
  } catch (error) {
    console.error('Admin get webshop orders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch webshop orders', error: error.message });
  }
};

// Send Webshop Status Email attached to an Order Status
exports.sendWebshopStatusEmailByStatusName = async (order, statusName, customerEmail) => {
  try {
    if (!customerEmail) return;

    const statusDef = await prisma.webshopOrderStatus.findFirst({
      where: {
        OR: [
          { name: statusName },
          { slug: statusName },
        ],
      },
      include: {
        emailTemplate: true,
      },
    });

    if (!statusDef || !statusDef.emailTemplate || statusDef.emailTemplate.isActive === false) {
      return;
    }

    const template = statusDef.emailTemplate;
    const custDetails = parseJsonSafely(order.customerDetails, {});
    const custName = (typeof custDetails === 'object' && custDetails?.name) ? custDetails.name : 'Customer';

    let subject = template.subject || `Order Status Update - ${order.orderNumber}`;
    let bodyHtml = template.body || `<p>Hi ${custName}, your order status is now ${statusName}.</p>`;

    subject = subject
      .replace(/{customer_name}/g, custName)
      .replace(/{order_number}/g, order.orderNumber || '')
      .replace(/{order_status}/g, statusName || '')
      .replace(/{order_total}/g, `${order.totalAmount} ${order.currency || 'DKK'}`);

    bodyHtml = bodyHtml
      .replace(/{customer_name}/g, custName)
      .replace(/{order_number}/g, order.orderNumber || '')
      .replace(/{order_status}/g, statusName || '')
      .replace(/{order_total}/g, `${order.totalAmount} ${order.currency || 'DKK'}`);

    const transporter = createEmailTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@studentlife.dk',
      to: customerEmail,
      subject,
      html: bodyHtml,
    });

    console.log(`Webshop status email (${template.name}) sent to ${customerEmail} for order ${order.orderNumber}`);
  } catch (err) {
    console.error('Error sending webshop status email:', err);
  }
};

// Admin: Update Webshop Order status
exports.adminUpdateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const updatedOrder = await prisma.webshopOrder.update({
      where: { id: parseInt(id) },
      data: {
        ...(orderStatus && { orderStatus }),
        ...(paymentStatus && { paymentStatus }),
      },
      include: {
        webshopCustomer: true,
      },
    });

    if (orderStatus) {
      const formatted = formatOrder(updatedOrder);
      const custEmail = formatted.customerEmail || formatted.webshopCustomer?.email;
      if (custEmail) {
        exports.sendWebshopStatusEmailByStatusName(updatedOrder, orderStatus, custEmail).catch(e => console.error(e));
      }
    }

    return res.status(200).json({ success: true, data: formatOrder(updatedOrder), message: 'Order status updated' });
  } catch (error) {
    console.error('Admin update webshop order status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update order status', error: error.message });
  }
};

// Admin: Get Webshop Customers
exports.adminGetCustomers = async (req, res) => {
  try {
    const customers = await prisma.webshopCustomer.findMany({
      include: {
        orders: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: customers.map(formatCustomer) });
  } catch (error) {
    console.error('Admin get webshop customers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch webshop customers', error: error.message });
  }
};

// Admin: Backward compatibility for single template endpoint
exports.adminGetEmailTemplate = async (req, res) => {
  return exports.adminGetEmailTemplates(req, res);
};
exports.adminUpdateEmailTemplate = async (req, res) => {
  return exports.adminCreateEmailTemplate(req, res);
};

// =========================================
// WEBSHOP EMAIL TEMPLATES CRUD CONTROLLERS
// =========================================

exports.adminGetEmailTemplates = async (req, res) => {
  try {
    let templates = await prisma.webshopEmailTemplate.findMany({
      include: { webshopStatuses: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (templates.length === 0) {
      await prisma.webshopEmailTemplate.createMany({
        data: [
          {
            key: 'ORDER_CONFIRMATION',
            name: 'Order Confirmation Email',
            subject: 'Order Confirmation - {order_number}',
            body: '<h2>Thank you for your order!</h2><p>Hi {customer_name},</p><p>We have received your order <strong>{order_number}</strong> for total {order_total}.</p>',
            isActive: true,
            sortOrder: 1,
          },
          {
            key: 'ORDER_SHIPPED',
            name: 'Order Shipped Email',
            subject: 'Your order {order_number} has been shipped!',
            body: '<h2>Your Order is on the way!</h2><p>Hi {customer_name},</p><p>Your order <strong>{order_number}</strong> has been shipped and is on its way to you.</p>',
            isActive: true,
            sortOrder: 2,
          },
        ],
      });
      templates = await prisma.webshopEmailTemplate.findMany({
        include: { webshopStatuses: true },
        orderBy: { sortOrder: 'asc' },
      });
    }

    return res.status(200).json({ success: true, data: templates });
  } catch (error) {
    console.error('Admin get email templates error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch email templates', error: error.message });
  }
};

exports.adminCreateEmailTemplate = async (req, res) => {
  try {
    const { name, subject, body, isActive = true, sortOrder = 0 } = req.body;
    if (!name || !subject) {
      return res.status(400).json({ success: false, message: 'Template name and subject are required' });
    }

    const key = slugify(name) + '-' + Date.now();
    const template = await prisma.webshopEmailTemplate.create({
      data: {
        key,
        name,
        subject,
        body: body || '',
        isActive: Boolean(isActive),
        sortOrder: parseInt(sortOrder) || 0,
      },
    });

    return res.status(201).json({ success: true, data: template, message: 'Email template created successfully' });
  } catch (error) {
    console.error('Admin create email template error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create template', error: error.message });
  }
};

exports.adminUpdateEmailTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, body, isActive, sortOrder } = req.body;

    const template = await prisma.webshopEmailTemplate.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(subject && { subject }),
        ...(body !== undefined && { body }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) || 0 }),
      },
    });

    return res.status(200).json({ success: true, data: template, message: 'Email template updated' });
  } catch (error) {
    console.error('Admin update email template by id error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update email template', error: error.message });
  }
};

exports.adminDeleteEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.webshopEmailTemplate.delete({
      where: { id: parseInt(id) },
    });
    return res.status(200).json({ success: true, message: 'Email template deleted' });
  } catch (error) {
    console.error('Admin delete email template error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete template', error: error.message });
  }
};

exports.adminReorderEmailTemplates = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Invalid items array' });
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.id) {
        await prisma.webshopEmailTemplate.update({
          where: { id: parseInt(item.id) },
          data: { sortOrder: i + 1 },
        });
      }
    }

    return res.status(200).json({ success: true, message: 'Email templates reordered successfully' });
  } catch (error) {
    console.error('Admin reorder email templates error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reorder email templates', error: error.message });
  }
};

// =========================================
// WEBSHOP ORDER STATUSES CRUD CONTROLLERS
// =========================================

exports.adminGetStatuses = async (req, res) => {
  try {
    let statuses = await prisma.webshopOrderStatus.findMany({
      include: { emailTemplate: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (statuses.length === 0) {
      const confirmationTpl = await prisma.webshopEmailTemplate.findFirst({ where: { key: 'ORDER_CONFIRMATION' } });
      const shippedTpl = await prisma.webshopEmailTemplate.findFirst({ where: { key: 'ORDER_SHIPPED' } });

      const defaultStatuses = [
        { name: 'Pending', slug: 'PENDING', color: '#f59e0b', sortOrder: 1, webshopEmailTemplateId: confirmationTpl ? confirmationTpl.id : null },
        { name: 'Processing', slug: 'PROCESSING', color: '#3b82f6', sortOrder: 2 },
        { name: 'Shipped', slug: 'SHIPPED', color: '#6366f1', sortOrder: 3, webshopEmailTemplateId: shippedTpl ? shippedTpl.id : null },
        { name: 'Delivered', slug: 'DELIVERED', color: '#10b981', sortOrder: 4 },
        { name: 'Cancelled', slug: 'CANCELLED', color: '#ef4444', sortOrder: 5 },
      ];

      for (const st of defaultStatuses) {
        await prisma.webshopOrderStatus.create({ data: st });
      }

      statuses = await prisma.webshopOrderStatus.findMany({
        include: { emailTemplate: true },
        orderBy: { sortOrder: 'asc' },
      });
    }

    return res.status(200).json({ success: true, data: statuses });
  } catch (error) {
    console.error('Admin get webshop statuses error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch statuses', error: error.message });
  }
};

exports.adminCreateStatus = async (req, res) => {
  try {
    const { name, color = '#6366f1', sortOrder = 0, webshopEmailTemplateId } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Status name is required' });
    }

    const slug = slugify(name).toUpperCase();
    const newStatus = await prisma.webshopOrderStatus.create({
      data: {
        name,
        slug,
        color,
        sortOrder: parseInt(sortOrder) || 0,
        webshopEmailTemplateId: webshopEmailTemplateId ? parseInt(webshopEmailTemplateId) : null,
      },
      include: { emailTemplate: true },
    });

    return res.status(201).json({ success: true, data: newStatus, message: 'Status created successfully' });
  } catch (error) {
    console.error('Admin create webshop status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create status', error: error.message });
  }
};

exports.adminUpdateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, sortOrder, isActive, webshopEmailTemplateId } = req.body;

    const data = {};
    if (name) {
      data.name = name;
      data.slug = slugify(name).toUpperCase();
    }
    if (color) data.color = color;
    if (sortOrder !== undefined) data.sortOrder = parseInt(sortOrder) || 0;
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    if (webshopEmailTemplateId !== undefined) {
      data.webshopEmailTemplateId = webshopEmailTemplateId ? parseInt(webshopEmailTemplateId) : null;
    }

    const updated = await prisma.webshopOrderStatus.update({
      where: { id: parseInt(id) },
      data,
      include: { emailTemplate: true },
    });

    return res.status(200).json({ success: true, data: updated, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Admin update webshop status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

exports.adminDeleteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.webshopOrderStatus.delete({
      where: { id: parseInt(id) },
    });
    return res.status(200).json({ success: true, message: 'Status deleted' });
  } catch (error) {
    console.error('Admin delete webshop status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete status', error: error.message });
  }
};

exports.adminReorderStatuses = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Invalid items array' });
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.id) {
        await prisma.webshopOrderStatus.update({
          where: { id: parseInt(item.id) },
          data: { sortOrder: i + 1 },
        });
      }
    }

    return res.status(200).json({ success: true, message: 'Statuses reordered successfully' });
  } catch (error) {
    console.error('Admin reorder webshop statuses error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reorder statuses', error: error.message });
  }
};

// =========================================
// WEBSHOP DASHBOARD ANALYTICS CONTROLLER
// =========================================

exports.adminGetWebshopStats = async (req, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      paidOrdersAggregate,
      totalProducts,
      activeProducts,
      outOfStockProducts,
      totalCustomers,
      recentOrders,
    ] = await Promise.all([
      prisma.webshopOrder.count(),
      prisma.webshopOrder.count({ where: { orderStatus: 'PENDING' } }),
      prisma.webshopOrder.count({ where: { orderStatus: 'PROCESSING' } }),
      prisma.webshopOrder.count({ where: { orderStatus: 'SHIPPED' } }),
      prisma.webshopOrder.count({ where: { orderStatus: 'DELIVERED' } }),
      prisma.webshopOrder.count({ where: { orderStatus: 'CANCELLED' } }),
      prisma.webshopOrder.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'PAID' },
      }),
      prisma.webshopProduct.count(),
      prisma.webshopProduct.count({ where: { isActive: true } }),
      prisma.webshopProduct.count({
        where: {
          OR: [{ isOutOfStock: true }, { stockCount: { lte: 0 } }],
        },
      }),
      prisma.webshopCustomer.count(),
      prisma.webshopOrder.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: { webshopCustomer: true },
      }),
    ]);

    const totalRevenue = paidOrdersAggregate._sum.totalAmount || 0;

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalProducts,
        activeProducts,
        outOfStockProducts,
        totalCustomers,
        recentOrders: recentOrders.map(formatOrder),
      },
    });
  } catch (error) {
    console.error('Admin get webshop stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch webshop stats', error: error.message });
  }
};
