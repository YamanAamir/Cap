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
    
    // If it's an object like { name: 'Rød', color: '#fff' } or similar, extract the meaningful string
    if (typeof current === 'object' && current !== null) {
      if (current.name) current = current.name;
      else if (current.value) current = current.value;
      else if (current.label) current = current.label;
      else current = JSON.stringify(current);
    }

    if (current === '' || current == null) return 'x';

    // Translate common Danish terms to English
    const valStr = String(current).trim();
    const translations = {
      'Sort': 'Black',
      'Hvid': 'White',
      'Guld': 'Gold',
      'Sølv': 'Silver',
      'Rød': 'Red',
      'Blå': 'Blue',
      'Grøn': 'Green',
      'Gul': 'Yellow',
      'Lilla': 'Purple',
      'Rosa': 'Pink',
      'Mat': 'Matte',
      'Hvid med glimmer': 'White with glitter',
      'Sort med glimmer': 'Black with glitter',
      'Ingen': 'None',
      'Ja': 'Yes',
      'Nej': 'No',
      'Uden kant': 'Without edge',
      'Med kant': 'With edge',
      'Glimmer': 'Glitter',
      'Kunstlæder': 'Faux Leather',
      'Læder': 'Leather',
      'Ruskin': 'Suede',
      'Alcantra': 'Alcantara',
      'Polyester': 'Polyester',
      'Silke': 'Silk',
      'BOMULD': 'Cotton',
      'SATIN': 'Satin',
      'VELOUR': 'Velvet',
      'Sort med sorteknuder': 'Black with black knots',
      'Guld hagerem med guld knuder': 'Gold chinstrap with gold knots',
      'Sort hagerem med guld knuder': 'Black chinstrap with gold knots',
      'Guld hagerem med sort knuder': 'Gold chinstrap with black knots',
      'Sølv hagerem med sølvknuder': 'Silver chinstrap with silver knots',
      'Sølv hagerem med sort knuder': 'Silver chinstrap with black knots',
      'Sort hagerem med sølv knuder': 'Black chinstrap with silver knots',
      'Sølv hagerem med sølv knuder': 'Silver chinstrap with silver knots',
    };

    // Case insensitive lookup
    const found = Object.keys(translations).find(k => k.toLowerCase() === valStr.toLowerCase());
    return found ? translations[found] : valStr;
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
