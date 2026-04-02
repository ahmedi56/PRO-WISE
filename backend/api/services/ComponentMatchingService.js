/**
 * ComponentMatchingService
 *
 * Normalizes structured product components and provides deterministic
 * matching/scoring helpers for component-driven product discovery.
 */

const COMPONENT_FIELDS = ['name', 'type', 'manufacturer', 'modelNumber', 'specifications'];

const TYPE_ALIASES = {
  processor: 'cpu',
  'system on chip': 'soc',
  soc: 'soc',
  chipset: 'chipset',
  gpu: 'gpu',
  graphics: 'gpu',
  'graphics card': 'gpu',
  'video card': 'gpu',
  'graphics processor': 'gpu',
  ram: 'memory',
  dram: 'memory',
  memory: 'memory',
  ssd: 'storage',
  hdd: 'storage',
  'hard drive': 'storage',
  storage: 'storage',
  display: 'display',
  screen: 'display',
  oled: 'display',
  amoled: 'display',
  battery: 'battery',
  camera: 'camera',
  motherboard: 'motherboard',
  board: 'motherboard',
};

const BRAND_ALIASES = {
  'samsungelectronics': 'samsung',
  'qualcommtechnologies': 'qualcomm',
  'advancedmicrodevices': 'amd',
  'nvidiacorporation': 'nvidia',
  'geforcertx': 'nvidia',
  'geforcegtx': 'nvidia',
};

const MODEL_PREFIXES = [
  'intelcore',
  'intel',
  'core',
  'amdryzen',
  'amd',
  'ryzen',
  'nvidiageforce',
  'nvidia',
  'geforce',
  'qualcommsnapdragon',
  'qualcomm',
  'snapdragon',
  'mediatekdimensity',
  'mediatek',
  'dimensity',
  'apple',
  'samsung',
  'exynos',
  'processor',
  'graphicscard',
  'graphics',
  'videocard',
  'gpu',
  'cpu',
];

const trimString = (value) => String(value || '').trim();

const cleanCompact = (value) => trimString(value)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '');

const cleanSpaced = (value) => trimString(value)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const compactTokens = (value) => {
  const spaced = cleanSpaced(value);
  return spaced ? spaced.split(' ').filter(Boolean) : [];
};

const getTypeAlias = (type) => TYPE_ALIASES[type] || type;

const familyPatterns = [
  /(i[3579])/,
  /(r[3579])/,
  /((?:rtx|gtx)\d{2})/,
  /(a\d{1,2})/,
  /(m\d)/,
  /(\dgen\d)/,
  /((?:snapdragon|dimensity|exynos)\d{3,4})/,
];

const normalizeBrand = (value) => {
  const compact = cleanCompact(value);
  if (!compact) {
    return '';
  }
  return BRAND_ALIASES[compact] || compact;
};

const stripModelPrefixes = (value) => {
  let stripped = value;
  for (let i = 0; i < 2; i += 1) {
    for (const prefix of MODEL_PREFIXES) {
      if (stripped.startsWith(prefix)) {
        stripped = stripped.slice(prefix.length);
      }
    }
  }
  return stripped || value;
};

const normalizeModel = (component) => {
  const rawModel = component.modelNumber || component.name || '';
  const compact = cleanCompact(rawModel);
  if (!compact) {
    return '';
  }
  const stripped = stripModelPrefixes(compact);
  return stripped || compact;
};

const normalizeType = (component) => {
  const explicit = cleanSpaced(component.type);
  if (explicit) {
    return getTypeAlias(explicit);
  }

  const tokens = compactTokens(`${component.name || ''} ${component.specifications || ''}`);
  if (tokens.some((token) => ['cpu', 'processor', 'chipset', 'soc', 'snapdragon', 'exynos', 'dimensity'].includes(token))) {
    return tokens.includes('gpu') ? 'gpu' : (tokens.includes('soc') ? 'soc' : 'cpu');
  }
  if (tokens.some((token) => ['gpu', 'graphics', 'geforce', 'rtx', 'gtx', 'adreno', 'radeon'].includes(token))) {
    return 'gpu';
  }
  if (tokens.some((token) => ['ram', 'memory', 'lpddr5', 'ddr5', 'ddr4'].includes(token))) {
    return 'memory';
  }
  if (tokens.some((token) => ['display', 'screen', 'oled', 'amoled'].includes(token))) {
    return 'display';
  }
  if (tokens.some((token) => ['battery', 'mah'].includes(token))) {
    return 'battery';
  }
  if (tokens.some((token) => ['camera', 'lens', 'sensor'].includes(token))) {
    return 'camera';
  }
  return '';
};

const extractFamilyTokens = (normalizedModel, component) => {
  const families = new Set();
  const source = `${normalizedModel} ${cleanCompact(component.name)} ${cleanCompact(component.specifications)}`.trim();

  familyPatterns.forEach((pattern) => {
    const match = source.match(pattern);
    if (match && match[1]) {
      families.add(match[1]);
    }
  });

  if (!families.size && normalizedModel) {
    families.add(normalizedModel.slice(0, Math.min(4, normalizedModel.length)));
  }

  return Array.from(families);
};

const getDisplayLabel = (component) => {
  const primary = trimString(component.name)
    || trimString(component.modelNumber)
    || trimString(component.type)
    || 'Component';
  const brand = trimString(component.manufacturer);
  return brand && !primary.toLowerCase().startsWith(brand.toLowerCase())
    ? `${brand} ${primary}`.trim()
    : primary;
};

const intersect = (left, right) => {
  if (!left.length || !right.length) {
    return [];
  }

  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item));
};

module.exports = {
  validateComponents: function (components) {
    const invalidIndexes = [];
    const sanitizedComponents = [];

    (Array.isArray(components) ? components : []).forEach((component, index) => {
      const candidate = {};
      COMPONENT_FIELDS.forEach((field) => {
        candidate[field] = trimString(component && component[field]);
      });

      const isEmpty = COMPONENT_FIELDS.every((field) => !candidate[field]);
      if (isEmpty) {
        return;
      }

      const hasPrimaryLabel = !!candidate.name;
      const hasMatchingSignal = !!(candidate.type || candidate.manufacturer || candidate.modelNumber || candidate.specifications);

      if (!hasPrimaryLabel || !hasMatchingSignal) {
        invalidIndexes.push(index);
        return;
      }

      sanitizedComponents.push(candidate);
    });

    return { sanitizedComponents, invalidIndexes };
  },

  sanitizeComponents: function (components) {
    return this.validateComponents(components).sanitizedComponents;
  },

  normalizeComponent: function (component) {
    const sanitized = {
      name: trimString(component.name),
      type: trimString(component.type),
      manufacturer: trimString(component.manufacturer),
      modelNumber: trimString(component.modelNumber),
      specifications: trimString(component.specifications),
    };

    const normalizedType = normalizeType(sanitized);
    const normalizedBrand = normalizeBrand(sanitized.manufacturer);
    const normalizedModel = normalizeModel(sanitized);
    const normalizedName = cleanSpaced(sanitized.name);
    const familyTokens = extractFamilyTokens(normalizedModel, sanitized);

    return {
      ...sanitized,
      normalizedType,
      normalizedBrand,
      normalizedModel,
      normalizedName,
      familyTokens,
      signature: [normalizedType || 'component', normalizedBrand || 'brandless', normalizedModel || normalizedName || 'generic'].join('|'),
      label: getDisplayLabel(sanitized),
    };
  },

  getNormalizedProductComponents: function (product) {
    return this.sanitizeComponents(product && product.components).map((component) => this.normalizeComponent(component));
  },

  buildComponentQueryText: function (components, product = null) {
    const normalized = this.sanitizeComponents(components).map((component) => this.normalizeComponent(component));

    const lines = normalized.map((component) => {
      const familyText = component.familyTokens.length ? ` family ${component.familyTokens.join(' ')}` : '';
      return [
        component.normalizedType || 'component',
        component.manufacturer,
        component.modelNumber,
        component.name,
        component.specifications,
        component.signature,
        familyText,
      ]
        .filter(Boolean)
        .join(' ');
    });

    if (product) {
      lines.unshift([
        product.name || '',
        product.manufacturer || '',
        product.modelNumber || '',
        product.category && product.category.name ? product.category.name : '',
      ].filter(Boolean).join(' '));
    }

    return lines.join('\n').trim();
  },

  scoreProductAgainstComponents: function ({ components, candidateProduct, semanticSimilarity = 0, categoryId = null, sourceManufacturer = '' }) {
    const selectedComponents = this.sanitizeComponents(components).map((component) => this.normalizeComponent(component));
    const candidateComponents = this.getNormalizedProductComponents(candidateProduct);

    const matchedComponents = [];
    const matchDetails = [];
    let rawScore = 0;
    let exactMatches = 0;
    let familyMatches = 0;

    const scoreSingleMatch = (selectedComponent, candidateComponent) => {
      const sameType = !!(selectedComponent.normalizedType && candidateComponent.normalizedType && selectedComponent.normalizedType === candidateComponent.normalizedType);
      const sameBrand = !!(selectedComponent.normalizedBrand && candidateComponent.normalizedBrand && selectedComponent.normalizedBrand === candidateComponent.normalizedBrand);
      const exactModel = !!(selectedComponent.normalizedModel && candidateComponent.normalizedModel && selectedComponent.normalizedModel === candidateComponent.normalizedModel);
      const sharedFamilies = intersect(selectedComponent.familyTokens, candidateComponent.familyTokens);
      const partialModel = !!(
        selectedComponent.normalizedModel
        && candidateComponent.normalizedModel
        && (
          selectedComponent.normalizedModel.includes(candidateComponent.normalizedModel)
          || candidateComponent.normalizedModel.includes(selectedComponent.normalizedModel)
        )
      );
      const nameOverlap = intersect(compactTokens(selectedComponent.name), compactTokens(candidateComponent.name));

      if (selectedComponent.signature === candidateComponent.signature) {
        return {
          score: 250,
          kind: 'exact_signature',
          reason: `Same ${selectedComponent.normalizedType || 'component'}`,
        };
      }

      if (sameType && exactModel) {
        return {
          score: 200,
          kind: 'exact_type_model',
          reason: `Same ${selectedComponent.normalizedType || 'component'}`,
        };
      }

      if (exactModel) {
        return {
          score: 180,
          kind: 'exact_model',
          reason: `Same model: ${candidateComponent.label}`,
        };
      }

      if (sameType && sharedFamilies.length) {
        return {
          score: 82,
          kind: 'type_family',
          reason: `Same ${selectedComponent.normalizedType || 'component'} family`,
        };
      }

      if (sharedFamilies.length) {
        return {
          score: 68,
          kind: 'family',
          reason: `Same family: ${sharedFamilies.join(', ')}`,
        };
      }

      if (sameType && partialModel) {
        return {
          score: 56,
          kind: 'partial_model',
          reason: `Close ${selectedComponent.normalizedType || 'component'} model match`,
        };
      }

      if (sameType && sameBrand) {
        return {
          score: 46,
          kind: 'type_brand',
          reason: `Same ${selectedComponent.normalizedType || 'component'} brand`,
        };
      }

      if (sameBrand && partialModel) {
        return {
          score: 40,
          kind: 'brand_model',
          reason: `Same brand and close model`,
        };
      }

      if (sameType && nameOverlap.length) {
        return {
          score: 28,
          kind: 'type_name',
          reason: `Similar ${selectedComponent.normalizedType || 'component'}`,
        };
      }

      if (sameBrand) {
        return {
          score: 18,
          kind: 'brand',
          reason: `Same component brand`,
        };
      }

      return null;
    };

    selectedComponents.forEach((selectedComponent) => {
      let bestMatch = null;

      candidateComponents.forEach((candidateComponent) => {
        const scored = scoreSingleMatch(selectedComponent, candidateComponent);
        if (!scored) {
          return;
        }

        if (!bestMatch || scored.score > bestMatch.score) {
          bestMatch = {
            ...scored,
            selectedComponent,
            candidateComponent,
          };
        }
      });

      if (bestMatch) {
        matchedComponents.push({
          source: bestMatch.selectedComponent.label,
          matched: bestMatch.candidateComponent.label,
          type: bestMatch.selectedComponent.normalizedType || bestMatch.candidateComponent.normalizedType || 'component',
          matchType: bestMatch.kind,
          score: bestMatch.score,
        });
        matchDetails.push(`${bestMatch.reason}: ${bestMatch.selectedComponent.label} -> ${bestMatch.candidateComponent.label}`);
        rawScore += bestMatch.score;

        if (bestMatch.score >= 110) {
          exactMatches += 1;
        } else if (bestMatch.score >= 68) {
          familyMatches += 1;
        }
      }
    });

    if (matchedComponents.length > 0) {
      rawScore += matchedComponents.length * 20;
    }
    if (matchedComponents.length > 1) {
      rawScore += matchedComponents.length * 25;
    }
    if (exactMatches > 1) {
      rawScore += exactMatches * 18;
    }
    if (familyMatches > 0) {
      rawScore += familyMatches * 8;
    }

    if (semanticSimilarity > 0) {
      rawScore += semanticSimilarity * 35;
      if (semanticSimilarity >= 0.7) {
        matchDetails.push('Strong semantic match');
      }
    }

    const candidateCategoryId = candidateProduct && candidateProduct.category && candidateProduct.category.id
      ? candidateProduct.category.id
      : candidateProduct && candidateProduct.category;
    if (categoryId && candidateCategoryId && String(categoryId) === String(candidateCategoryId)) {
      rawScore += 8;
      matchDetails.push('Same category');
    }

    if (sourceManufacturer && candidateProduct && candidateProduct.manufacturer) {
      if (cleanCompact(sourceManufacturer) === cleanCompact(candidateProduct.manufacturer)) {
        rawScore += 8;
        matchDetails.push(`Same manufacturer: ${candidateProduct.manufacturer}`);
      }
    }

    let recommendationReason = 'Strong semantic match';
    if (exactMatches > 1 || matchedComponents.length > 2) {
      recommendationReason = `${matchedComponents.length} shared components`;
    } else if (matchedComponents.length > 0) {
      recommendationReason = matchDetails[0] || 'Component match';
    } else if (semanticSimilarity <= 0.5) {
      recommendationReason = 'Closest catalog match';
    }

    const maxScore = Math.max(180, selectedComponents.length * 180);
    const matchScore = Math.min(1, rawScore / maxScore);

    return {
      rawScore,
      matchScore,
      matchedComponents,
      matchDetails,
      recommendationReason,
    };
  },
};
