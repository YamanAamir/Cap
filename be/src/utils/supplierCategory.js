/**
 * Helper to calculate the internal supplier category based on the final cap design / configuration.
 * Categories agreed with factory:
 * 1. "Budget" (Basichue without embroidery)
 * 2. "Budget with Embroidery" (Basichue with embroidery)
 * 3. "Standard" (Standard package scope)
 * 4. "Luxury" (Luksus/Luxury package scope)
 * 5. "Premium" (Premium package scope)
 */

function isNonEmpty(val) {
  if (!val) return false;
  if (typeof val === 'object') {
    const name = val.name || val.value || val.label || '';
    val = name;
  }
  const str = String(val).trim().toLowerCase();
  return (
    str !== '' &&
    str !== 'x' &&
    str !== 'none' &&
    str !== 'ingen' &&
    str !== 'nej' &&
    str !== 'no' &&
    str !== 'not chosen' &&
    str !== 'not selected' &&
    str !== 'uden' &&
    str !== 'false'
  );
}

function calculateSupplierCategory(orderOrSelectedOptions) {
  let selectedOptions = {};
  let originalPackage = '';

  if (orderOrSelectedOptions) {
    if (orderOrSelectedOptions.selectedOptions !== undefined) {
      originalPackage = orderOrSelectedOptions.packageName || '';
      selectedOptions = typeof orderOrSelectedOptions.selectedOptions === 'string'
        ? JSON.parse(orderOrSelectedOptions.selectedOptions)
        : (orderOrSelectedOptions.selectedOptions || {});
    } else {
      selectedOptions = typeof orderOrSelectedOptions === 'string'
        ? JSON.parse(orderOrSelectedOptions)
        : (orderOrSelectedOptions || {});
    }
  }

  selectedOptions = selectedOptions || {};

  // Extract relevant features from configuration
  const broderi = selectedOptions.BRODERI || selectedOptions.broderi || {};
  const band = selectedOptions.UDDANNELSESBÅND || selectedOptions.uddannelsesbaand || {};
  const skygge = selectedOptions.SKYGGE || selectedOptions.skygge || {};
  const foer = selectedOptions.FOER || selectedOptions.foer || {};
  const ekstra = selectedOptions.EKSTRABETRÆK || selectedOptions.ekstrabetraek || {};
  const tilbehoer = selectedOptions.TILBEHØR || selectedOptions.tilbehoer || {};

  const hasBackEmbroidery = isNonEmpty(broderi['Navne broderi'] || broderi['navne broderi'] || selectedOptions['Navne broderi']);
  const hasFrontEmbroidery = isNonEmpty(band['Broderi foran'] || band['broderi foran'] || selectedOptions['Broderi foran']);
  const hasSchoolEmbroidery = isNonEmpty(broderi.Skolebroderi || broderi.skolebroderi || selectedOptions.Skolebroderi);
  const hasTopEmbroidery = isNonEmpty(broderi['Top broderi'] || broderi['top broderi']);
  const hasLaserEngraving = isNonEmpty(skygge.Laserengravering) || isNonEmpty(skygge['Skyggegravering Line 1']);
  const hasExtraCover = isNonEmpty(ekstra.Tilvælg) && (String(ekstra.Tilvælg).toLowerCase() === 'yes' || String(ekstra.Tilvælg).toLowerCase() === 'ja');
  const hasCustomLiningImage = isNonEmpty(foer['Indvendigt foer billede']);
  const hasSilkCushion = isNonEmpty(tilbehoer.Silkepude);

  const totalEmbroideries = [hasBackEmbroidery, hasFrontEmbroidery, hasSchoolEmbroidery, hasTopEmbroidery].filter(Boolean).length;
  const pkgLower = String(originalPackage).toLowerCase();

  // 1. Premium scope
  if (pkgLower.includes('premium') || hasExtraCover || (hasLaserEngraving && totalEmbroideries >= 2)) {
    return 'Premium';
  }

  // 2. Luxury / Luksus scope
  if (pkgLower.includes('luksus') || pkgLower.includes('luxury') || hasLaserEngraving || hasCustomLiningImage || hasSilkCushion || totalEmbroideries >= 3) {
    return 'Luxury';
  }

  // 3. Standard scope
  if (pkgLower.includes('standard') || (totalEmbroideries >= 2 && !pkgLower.includes('basic') && !pkgLower.includes('basichue') && !pkgLower.includes('budget'))) {
    return 'Standard';
  }

  // 4 & 5. Basichue / Budget scope (Split into 2 categories based on embroidery)
  const isBasicHue = pkgLower.includes('basic') || pkgLower.includes('budget') || pkgLower.includes('basichue') || pkgLower.includes('budgethue') || pkgLower === '';

  if (totalEmbroideries > 0) {
    return 'Budget with Embroidery';
  }

  if (isBasicHue) {
    return 'Budget';
  }

  return 'Budget';
}

module.exports = {
  calculateSupplierCategory,
};
