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
    orderNumber: order.orderNumber,
    orderDate: new Date(order.orderDate || order.createdAt).toISOString().split('T')[0],
    customerName: `${customerDetails.firstName || ''} ${customerDetails.lastName || ''}`.trim() || customerDetails.name || '',
    customerEmail: order.customerEmail || customerDetails.email || '',
    customerPhone: customerDetails.phone || '',
    customerAddress: customerDetails.address || '',
    customerCity: customerDetails.city || '',
    customerPostalCode: customerDetails.postalCode || '',
    schoolName: customerDetails.Skolenavn || '',
    deliveryType: customerDetails.deliveryType || '',
    totalPrice: order.totalPrice,
    currency: order.currency,
    packageName: order.packageName || '',
    program: order.program || '',
    status: order.status,
    discountCode: order.discountCode?.code || '',
    discountAmount: order.discountAmount || 0,
  };

  if (map[fieldKey] !== undefined) return map[fieldKey];

  if (fieldKey.startsWith('options.')) {
    const path = fieldKey.replace('options.', '').split('.');
    let current = selectedOptions;
    for (const part of path) {
      if (current == null) return 'x';
      current = current[part];
    }
    if (typeof current === 'object') return JSON.stringify(current);
    if (current === '' || current == null) return 'x';
    return current;
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
