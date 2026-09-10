const { translateFactoryValue } = require('./factoryTranslations');

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const generateDiscountCode = (prefix = 'WELCOME') => {
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${suffix}`;
};

const interpolateTemplate = (template, vars = {}) => {
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value ?? ''),
    template
  );
};

const safeDateIso = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return isNaN(date.getTime()) ? String(d) : date.toISOString().split('T')[0];
};

const safeDateLocale = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return isNaN(date.getTime()) ? String(d) : date.toLocaleString('da-DK');
};

const extractOrderField = (order, fieldKey) => {
  const customerDetails =
    typeof order.customerDetails === 'string'
      ? JSON.parse(order.customerDetails)
      : order.customerDetails || {};
  const selectedOptions =
    typeof order.selectedOptions === 'string'
      ? JSON.parse(order.selectedOptions)
      : order.selectedOptions || {};

  const map = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderDate: safeDateIso(order.orderDate || order.createdAt),
    createdAt: safeDateLocale(order.createdAt),
    updatedAt: safeDateLocale(order.updatedAt),
    customerId: order.customerId || '',
    customerName: `${customerDetails.firstName || ''} ${customerDetails.lastName || ''}`.trim() || customerDetails.name || '',
    customerEmail: order.customerEmail || customerDetails.email || '',
    customerPhone: customerDetails.phone || '',
    customerAddress: customerDetails.address || '',
    customerCity: customerDetails.city || '',
    customerPostalCode: customerDetails.postalCode || '',
    customerDeliveryCountry: customerDetails.deliveryCountry || customerDetails.country || '',
    schoolName: customerDetails.Skolenavn || '',
    deliveryType: customerDetails.deliveryType || '',
    totalPrice: order.totalPrice,
    currency: order.currency,
    packageName: order.packageName || '',
    program: order.program || '',
    status: order.status,
    paymentStatus: order.paymentStatus || '',
    paymentIntentId: order.paymentIntentId || '',
    discountCode: order.discountCode?.code || '',
    discountAmount: order.discountAmount || 0,
  };

  if (map[fieldKey] !== undefined) return map[fieldKey];

  if (fieldKey.startsWith('options.')) {
    const path = fieldKey.replace('options.', '').split('.');
    let current = selectedOptions;
    for (const part of path) {
      if (current == null || typeof current !== 'object') return 'x';
      if (current[part] !== undefined) {
        current = current[part];
      } else {
        const lowerPart = part.toLowerCase();
        const foundKey = Object.keys(current).find(k => k.toLowerCase() === lowerPart);
        if (foundKey) {
          current = current[foundKey];
        } else {
          return 'x';
        }
      }
    }
    
    // If it's an array (e.g. selectedFlags)
    if (Array.isArray(current)) {
      if (current.length === 0) return 'x';
      current = current.map(item => (typeof item === 'object' && item !== null ? (item.name || item.value || JSON.stringify(item)) : item)).join(', ');
    }

    // If it's an object like { name: 'Rød', color: '#fff' } or similar, extract the meaningful string
    if (typeof current === 'object' && current !== null) {
      if (current.name) current = current.name;
      else if (current.value) current = current.value;
      else if (current.label) current = current.label;
      else current = JSON.stringify(current);
    }

    if (current === '' || current == null) return 'x';

    // Translate Danish terms to English for factory export
    return translateFactoryValue(current);
  }

  if (fieldKey.startsWith('static:')) {
    const val = fieldKey.substring(7);
    const suffixIndex = val.lastIndexOf('::');
    if (suffixIndex !== -1) {
      return val.substring(0, suffixIndex);
    }
    return val;
  }

  return '';
};

module.exports = {
  slugify,
  generateDiscountCode,
  interpolateTemplate,
  extractOrderField,
};
