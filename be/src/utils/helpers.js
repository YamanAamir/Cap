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

  if (fieldKey === 'options.SKYGGE.Laserengravering' || fieldKey === 'Laserengravering') {
    const skygge = selectedOptions.SKYGGE || selectedOptions.skygge || {};
    const line1 = String(skygge['Skyggegravering Line 1'] || skygge['skyggegravering line 1'] || skygge.line1 || '').trim();
    const line2 = String(skygge['Skyggegravering Line 2'] || skygge['skyggegravering line 2'] || skygge.line2 || '').trim();
    const line3 = String(skygge['Skyggegravering Line 3'] || skygge['skyggegravering line 3'] || skygge.line3 || '').trim();
    if (line1 || line2 || line3) {
      return 'Yes';
    }
    return 'x';
  }

  if (fieldKey === 'options.FOER.Indvendigt foer billede' || fieldKey === 'Foer Billede') {
    const foer = selectedOptions.FOER || selectedOptions.foer || {};
    const img = foer['Indvendigt foer billede'] || foer['indvendigt foer billede'] || '';
    return img && img.length > 10 ? 'Yes' : 'x';
  }

  if (fieldKey === 'options.BETRÆK.Stjerner farve' || fieldKey === 'Stjerner farve') {
    const betraek = selectedOptions.BETRÆK || selectedOptions.betraek || {};
    let stjernerVal = betraek.Stjerner ?? betraek.stjerner ?? selectedOptions.Stjerner ?? selectedOptions.stjerner;
    if (typeof stjernerVal === 'object' && stjernerVal !== null) {
      stjernerVal = stjernerVal.name || stjernerVal.value || stjernerVal.label || '';
    }
    const starStr = String(stjernerVal || '').trim().toUpperCase();
    const noStars = !starStr || starStr === 'NONE' || starStr === 'INGEN' || starStr === '0' || starStr === 'X' || starStr === 'NO' || starStr === 'UDEN STJERNER';

    if (noStars) {
      return 'x';
    }

    const kokarde = selectedOptions.KOKARDE || selectedOptions.kokarde || {};
    let emblemVal = kokarde.Emblem ?? kokarde.emblem ?? selectedOptions.Emblem ?? selectedOptions.emblem;
    if (typeof emblemVal === 'object' && emblemVal !== null) {
      emblemVal = emblemVal.name || emblemVal.value || emblemVal.label || '';
    }
    if (!emblemVal || emblemVal === 'x' || emblemVal === 'NONE') {
      return 'x';
    }
    return translateFactoryValue(emblemVal);
  }

  if (fieldKey === 'options.EKSTRABETRÆK.Stjerner farve' || fieldKey === 'Ekstrabetræk Stjerner farve') {
    const ekstra = selectedOptions.EKSTRABETRÆK || selectedOptions.ekstrabetraek || {};
    const tilvaelg = String(ekstra.Tilvælg ?? ekstra.tilvaelg ?? '').trim().toLowerCase();
    if (tilvaelg !== 'yes' && tilvaelg !== 'ja') {
      return 'x';
    }
    let stjernerVal = ekstra.Stjerner ?? ekstra.stjerner;
    if (typeof stjernerVal === 'object' && stjernerVal !== null) {
      stjernerVal = stjernerVal.name || stjernerVal.value || stjernerVal.label || '';
    }
    const starStr = String(stjernerVal || '').trim().toUpperCase();
    const noStars = !starStr || starStr === 'NONE' || starStr === 'INGEN' || starStr === '0' || starStr === 'X' || starStr === 'NO' || starStr === 'UDEN STJERNER';

    if (noStars) {
      return 'x';
    }

    let emblemVal = ekstra.Emblem ?? ekstra.emblem;
    if (!emblemVal) {
      const kokarde = selectedOptions.KOKARDE || selectedOptions.kokarde || {};
      emblemVal = kokarde.Emblem ?? kokarde.emblem ?? selectedOptions.Emblem ?? selectedOptions.emblem;
    }
    if (typeof emblemVal === 'object' && emblemVal !== null) {
      emblemVal = emblemVal.name || emblemVal.value || emblemVal.label || '';
    }
    if (!emblemVal || emblemVal === 'x' || emblemVal === 'NONE') {
      return 'x';
    }
    return translateFactoryValue(emblemVal);
  }

  if (fieldKey === 'options.BRODERI.Skolebroderi farve' || fieldKey === 'Skolebroderi farve') {
    const broderi = selectedOptions.BRODERI || selectedOptions.broderi || {};
    const text = String(broderi.Skolebroderi ?? broderi.skolebroderi ?? selectedOptions.Skolebroderi ?? '').trim();
    if (!text || text === 'x' || text === 'Ingen') {
      return 'x';
    }
    let colorVal = broderi['Skolebroderi farve'] ?? broderi.skolebroderifarve ?? selectedOptions['Skolebroderi farve'] ?? '';
    if (typeof colorVal === 'object' && colorVal !== null) {
      colorVal = colorVal.name || colorVal.value || colorVal.label || '';
    }
    colorVal = String(colorVal || '').trim();
    if (!colorVal || colorVal === 'x' || colorVal === 'NONE') {
      return 'x';
    }
    return translateFactoryValue(colorVal);
  }

  if (fieldKey === 'options.EKSTRABETRÆK.Skolebroderi' || fieldKey === 'Ekstrabetræk Skolebroderi') {
    const ekstra = selectedOptions.EKSTRABETRÆK || selectedOptions.ekstrabetraek || {};
    const tilvaelg = String(ekstra.Tilvælg ?? ekstra.tilvaelg ?? '').trim().toLowerCase();
    if (tilvaelg !== 'yes' && tilvaelg !== 'ja') {
      return 'x';
    }
    const broderi = selectedOptions.BRODERI || selectedOptions.broderi || {};
    const text = String(ekstra.Skolebroderi ?? ekstra.skolebroderi ?? broderi.Skolebroderi ?? broderi.skolebroderi ?? selectedOptions.Skolebroderi ?? '').trim();
    if (!text || text === 'x' || text === 'Ingen') {
      return 'x';
    }
    return text;
  }

  if (fieldKey === 'options.EKSTRABETRÆK.Skolebroderi farve' || fieldKey === 'Ekstrabetræk Skolebroderi farve') {
    const ekstra = selectedOptions.EKSTRABETRÆK || selectedOptions.ekstrabetraek || {};
    const tilvaelg = String(ekstra.Tilvælg ?? ekstra.tilvaelg ?? '').trim().toLowerCase();
    if (tilvaelg !== 'yes' && tilvaelg !== 'ja') {
      return 'x';
    }
    const broderi = selectedOptions.BRODERI || selectedOptions.broderi || {};
    const text = String(ekstra.Skolebroderi ?? ekstra.skolebroderi ?? broderi.Skolebroderi ?? broderi.skolebroderi ?? selectedOptions.Skolebroderi ?? '').trim();
    if (!text || text === 'x' || text === 'Ingen') {
      return 'x';
    }
    let colorVal = ekstra['Skolebroderi farve'] ?? ekstra.skolebroderifarve ?? broderi['Skolebroderi farve'] ?? broderi.skolebroderifarve ?? selectedOptions['Skolebroderi farve'] ?? '';
    if (typeof colorVal === 'object' && colorVal !== null) {
      colorVal = colorVal.name || colorVal.value || colorVal.label || '';
    }
    colorVal = String(colorVal || '').trim();
    if (!colorVal || colorVal === 'x' || colorVal === 'NONE') {
      return 'x';
    }
    return translateFactoryValue(colorVal);
  }

  if (fieldKey.startsWith('options.')) {
    if (fieldKey.startsWith('options.EKSTRABETRÆK.') && fieldKey !== 'options.EKSTRABETRÆK.Tilvælg') {
      const ekstra = selectedOptions.EKSTRABETRÆK || selectedOptions.ekstrabetraek || {};
      const tilvaelg = String(ekstra.Tilvælg ?? ekstra.tilvaelg ?? '').trim().toLowerCase();
      if (tilvaelg !== 'yes' && tilvaelg !== 'ja') {
        return 'x';
      }
    }
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

    const RAW_CUSTOM_TEXT_FIELDS = new Set([
      'options.BRODERI.Navne broderi', 'Navne broderi',
      'options.UDDANNELSESBÅND.Broderi foran', 'Broderi foran',
      'options.BRODERI.Skolebroderi', 'Skolebroderi',
      'options.SKYGGE.Skyggegravering Line 1', 'Skyggegravering Line 1', 'Line 1',
      'options.SKYGGE.Skyggegravering Line 2', 'Skyggegravering Line 2', 'Line 2',
      'options.SKYGGE.Skyggegravering Line 3', 'Skyggegravering Line 3', 'Line 3'
    ]);

    if (RAW_CUSTOM_TEXT_FIELDS.has(fieldKey)) {
      return current;
    }

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

  return 'x';
};

module.exports = {
  slugify,
  generateDiscountCode,
  interpolateTemplate,
  extractOrderField,
};
