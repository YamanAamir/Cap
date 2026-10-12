/**
 * Helper to calculate the internal supplier category based on the final cap design / configuration.
 * Categories agreed with factory:
 * 1. "Budget" (Basichue without embroidery)
 * 2. "Budget with Embroidery" (Basichue with embroidery)
 * 3. "Standard" (Standard package scope)
 * 4. "Luxury" (Luksus/Luxury package scope)
 * 5. "Premium" (Premium package scope)
 * 
 * Rules:
 * - Determine category based on the final design/configuration regardless of customer's purchased package.
 * - Standard package with default or standard options evaluates to "Standard" (NOT Luxury).
 * - Basichue with no embroidery evaluates to "Budget", with embroidery evaluates to "Budget with Embroidery".
 * - If customer configures Luxury or Premium features (e.g. Top embroidery, Laser engraving, Luxury/Premium box),
 *   it upgrades to "Luxury" or "Premium" accordingly.
 */

function isNonEmpty(val) {
  if (val === null || val === undefined) return false;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'object') {
    const name = val.name ?? val.value ?? val.label ?? '';
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
    str !== 'false' &&
    str !== 'fravalgt' &&
    str !== 'null' &&
    str !== 'undefined'
  );
}

function isYes(val) {
  if (val === null || val === undefined) return false;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'object') {
    val = val.name ?? val.value ?? val.label ?? '';
  }
  const str = String(val).trim().toLowerCase();
  return str === 'yes' || str === 'ja' || str === 'true' || str === '1';
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

  // Extract option sections
  const broderi = selectedOptions.BRODERI || selectedOptions.broderi || {};
  const band = selectedOptions.UDDANNELSESBÅND || selectedOptions.uddannelsesbaand || {};
  const skygge = selectedOptions.SKYGGE || selectedOptions.skygge || {};
  const foer = selectedOptions.FOER || selectedOptions.foer || {};
  const betraek = selectedOptions.BETRÆK || selectedOptions.betraek || {};
  const ekstra = selectedOptions.EKSTRABETRÆK || selectedOptions.ekstrabetraek || {};
  const tilbehoer = selectedOptions.TILBEHØR || selectedOptions.tilbehoer || {};

  // 1. Embroideries
  const hasBackEmbroidery = isNonEmpty(broderi['Navne broderi'] || broderi['navne broderi'] || selectedOptions['Navne broderi']);
  const hasFrontEmbroidery = isNonEmpty(band['Broderi foran'] || band['broderi foran'] || selectedOptions['Broderi foran']);
  const hasSchoolEmbroidery = isNonEmpty(broderi.Skolebroderi || broderi.skolebroderi || selectedOptions.Skolebroderi);
  const hasTopEmbroidery = isNonEmpty(broderi['Top broderi'] || broderi['top broderi'] || ekstra['Extra Top broderi']);

  // 2. Visor Laser Engraving
  const hasLaserEngraving = isNonEmpty(skygge.Laserengravering) ||
    isNonEmpty(skygge['Skyggegravering Line 1']) ||
    isNonEmpty(skygge['Skyggegravering Line 2']) ||
    isNonEmpty(skygge['Skyggegravering Line 3']);

  // 3. Extra Cover
  const hasExtraCover = isYes(ekstra.Tilvælg);

  // 4. Custom Lining Image
  const hasCustomLiningImage = isNonEmpty(foer['Indvendigt foer billede']) ||
    isNonEmpty(foer.liningPhoto) ||
    isNonEmpty(foer.customImage);

  // 5. Box Types
  const boxName = String(tilbehoer.Hueæske || '').trim().toLowerCase();
  const isPremiumBox = boxName.includes('premium') || isNonEmpty(tilbehoer['Premium æske']);
  const isLuxuryBox = boxName.includes('luksus') || boxName.includes('luxury');

  // 6. Cushion and Accessories
  const hasSilkCushion = isYes(tilbehoer.Silkepude);
  const hasLuxuryGlass = isYes(tilbehoer['Luksus champagneglas']);
  const hasSilkLining = String(foer.Foer || '').trim().toLowerCase() === 'silke';

  // Check original package hint if present
  const pkgLower = String(originalPackage || '').trim().toLowerCase();
  const isBudgetOriginal = pkgLower.includes('basic') || pkgLower.includes('budget');

  // ==========================================
  // LEVEL 5: PREMIUM
  // Factory scope: Laser engraving, Premium box, or explicit Premium package configuration
  // ==========================================
  if (isPremiumBox || hasLaserEngraving) {
    return 'Premium';
  }

  // ==========================================
  // LEVEL 4: LUXURY
  // Factory scope: Luxury box, Top embroidery, Silk cushion, Extra cover, Custom lining image, Silk lining, Luxury champagne glass
  // ==========================================
  if (
    isLuxuryBox ||
    hasTopEmbroidery ||
    hasSilkCushion ||
    hasExtraCover ||
    hasCustomLiningImage ||
    hasSilkLining ||
    hasLuxuryGlass
  ) {
    return 'Luxury';
  }

  // ==========================================
  // LEVEL 3: STANDARD vs LEVEL 1 & 2: BUDGET
  // Check if configuration has non-budget Standard cap features
  // ==========================================
  const svederemStr = String(foer.Svederem || '').trim().toLowerCase();
  const hasLeatherSweatband = svederemStr === 'læder' || svederemStr === 'ruskin' || svederemStr === 'alcantra';
  const hasLiningBow = isNonEmpty(foer.Sløjfe);
  const hasNonPolyLining = isNonEmpty(foer.Foer) && String(foer.Foer).trim().toLowerCase() !== 'polyester';
  const hasTopkant = isNonEmpty(betraek.Topkant);
  const hasKantband = isNonEmpty(betraek.Kantbånd);
  const hasStjerner = isNonEmpty(betraek.Stjerner);
  const hasFlagband = isYes(betraek.Flagbånd);
  const hasBrimEdge = String(skygge.Materiale || '').trim().toLowerCase() === 'med kant';
  const hasBrimTape = isNonEmpty(skygge.Skyggebånd);
  const hasMatBrim = String(skygge.Type || '').trim().toLowerCase() === 'mat';
  const hasFancyTapeMaterial = ['satin', 'velour'].includes(String(band.Materiale || '').trim().toLowerCase());

  const hasStandardFeatures =
    hasLeatherSweatband ||
    hasLiningBow ||
    hasNonPolyLining ||
    hasTopkant ||
    hasKantband ||
    hasStjerner ||
    hasFlagband ||
    hasBrimEdge ||
    hasBrimTape ||
    hasMatBrim ||
    hasFancyTapeMaterial;

  const isStandardScope = (!isBudgetOriginal && (pkgLower.includes('standard') || hasStandardFeatures || pkgLower === '')) || hasStandardFeatures;

  if (isStandardScope && !isBudgetOriginal) {
    return 'Standard';
  }

  // If originally Budget/Basichue and customer configured Standard features, upgrade to Standard:
  if (isBudgetOriginal && hasStandardFeatures) {
    return 'Standard';
  }

  // ==========================================
  // LEVEL 1 & 2: BUDGET & BUDGET WITH EMBROIDERY
  // ==========================================
  const hasAnyEmbroidery = hasBackEmbroidery || hasFrontEmbroidery || hasSchoolEmbroidery;

  if (hasAnyEmbroidery) {
    return 'Budget with Embroidery';
  }

  return 'Budget';
}

module.exports = {
  calculateSupplierCategory,
};
