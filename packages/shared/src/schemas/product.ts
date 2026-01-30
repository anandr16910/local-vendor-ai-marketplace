import Joi from 'joi';
import { PRODUCT_CATEGORIES } from '../utils/constants';

// Product Specification Schema
export const productSpecificationSchema = Joi.object({
  attribute: Joi.string().min(1).max(100).required(),
  value: Joi.string().min(1).max(500).required(),
  unit: Joi.string().max(20).optional(),
  isNegotiable: Joi.boolean().required()
});

// Seasonal Availability Schema
export const seasonalAvailabilitySchema = Joi.object({
  availableMonths: Joi.array().items(Joi.number().min(1).max(12)).min(1).max(12).required(),
  peakMonths: Joi.array().items(Joi.number().min(1).max(12)).max(12).required(),
  description: Joi.string().max(200).optional()
});

// Availability Info Schema
export const availabilityInfoSchema = Joi.object({
  inStock: Joi.boolean().required(),
  quantity: Joi.number().min(0).when('inStock', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  unit: Joi.string().max(20).optional(),
  restockDate: Joi.date().min('now').optional(),
  seasonalAvailability: seasonalAvailabilitySchema.optional(),
  customOrderAvailable: Joi.boolean().required(),
  leadTime: Joi.number().min(0).max(365).when('customOrderAvailable', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

// Product Creation Schema
export const productCreationSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  description: Joi.string().max(2000).optional(),
  category: Joi.string().valid(...Object.values(PRODUCT_CATEGORIES)).required(),
  subcategory: Joi.string().min(2).max(100).optional(),
  images: Joi.array().items(Joi.string().uri()).max(10).default([]),
  specifications: Joi.array().items(productSpecificationSchema).max(20).default([]),
  basePrice: Joi.number().min(0.01).required(),
  availability: availabilityInfoSchema.required(),
  tags: Joi.array().items(Joi.string().min(1).max(50)).max(20).default([])
});

// Product Update Schema
export const productUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  description: Joi.string().max(2000).optional(),
  category: Joi.string().valid(...Object.values(PRODUCT_CATEGORIES)).optional(),
  subcategory: Joi.string().min(2).max(100).optional(),
  images: Joi.array().items(Joi.string().uri()).max(10).optional(),
  specifications: Joi.array().items(productSpecificationSchema).max(20).optional(),
  basePrice: Joi.number().min(0.01).optional(),
  availability: availabilityInfoSchema.optional(),
  tags: Joi.array().items(Joi.string().min(1).max(50)).max(20).optional()
}).min(1);

// Product Search Schema
export const productSearchSchema = Joi.object({
  query: Joi.string().min(1).max(100).optional(),
  category: Joi.string().valid(...Object.values(PRODUCT_CATEGORIES)).optional(),
  subcategory: Joi.string().min(2).max(100).optional(),
  location: Joi.object({
    city: Joi.string().min(2).max(100).optional(),
    state: Joi.string().min(2).max(100).optional(),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required()
    }).optional(),
    radius: Joi.number().min(1).max(1000).default(10)
  }).optional(),
  priceRange: Joi.object({
    min: Joi.number().min(0).required(),
    max: Joi.number().min(Joi.ref('min')).required()
  }).optional(),
  availability: Joi.string().valid('in_stock', 'custom_order', 'all').default('all'),
  vendorRating: Joi.number().min(0).max(5).optional(),
  tags: Joi.array().items(Joi.string().min(1).max(50)).max(10).optional(),
  sortBy: Joi.string().valid('relevance', 'price_low', 'price_high', 'rating', 'distance').default('relevance'),
  limit: Joi.number().min(1).max(100).default(20),
  offset: Joi.number().min(0).default(0)
});

// Category Attribute Schema
export const categoryAttributeSchema = Joi.object({
  attributeName: Joi.string().min(1).max(100).required(),
  attributeType: Joi.string().valid('text', 'number', 'boolean', 'select', 'multiselect').required(),
  isRequired: Joi.boolean().required(),
  options: Joi.array().items(Joi.string()).when('attributeType', {
    is: Joi.valid('select', 'multiselect'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  unit: Joi.string().max(20).optional(),
  validation: Joi.object({
    min: Joi.number().optional(),
    max: Joi.number().min(Joi.ref('min')).optional(),
    pattern: Joi.string().optional(),
    customValidator: Joi.string().optional()
  }).optional()
});

// Product Category Schema
export const productCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  parentCategoryId: Joi.string().uuid().optional(),
  description: Joi.string().max(500).required(),
  attributes: Joi.array().items(categoryAttributeSchema).max(50).required(),
  culturalSignificance: Joi.string().max(500).optional()
});

// Bulk Product Upload Schema
export const bulkProductUploadSchema = Joi.object({
  products: Joi.array().items(productCreationSchema).min(1).max(100).required(),
  validateOnly: Joi.boolean().default(false)
});

// Product Import Schema (CSV/Excel)
export const productImportSchema = Joi.object({
  fileData: Joi.string().base64().required(),
  fileName: Joi.string().min(1).max(255).required(),
  fileType: Joi.string().valid('csv', 'xlsx').required(),
  mapping: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    category: Joi.string().required(),
    subcategory: Joi.string().optional(),
    basePrice: Joi.string().required(),
    quantity: Joi.string().optional(),
    tags: Joi.string().optional()
  }).required(),
  skipFirstRow: Joi.boolean().default(true)
});

// Product Analytics Schema
export const productAnalyticsSchema = Joi.object({
  productId: Joi.string().uuid().optional(),
  vendorId: Joi.string().uuid().optional(),
  category: Joi.string().valid(...Object.values(PRODUCT_CATEGORIES)).optional(),
  timeRange: Joi.object({
    start: Joi.date().required(),
    end: Joi.date().min(Joi.ref('start')).required()
  }).required(),
  metrics: Joi.array().items(Joi.string().valid('views', 'inquiries', 'negotiations', 'sales', 'revenue')).default(['views', 'inquiries', 'sales']),
  groupBy: Joi.string().valid('day', 'week', 'month').default('day')
});

// Validation Functions
export function validateProductCreation(data: any) {
  return productCreationSchema.validate(data, { abortEarly: false });
}

export function validateProductUpdate(data: any) {
  return productUpdateSchema.validate(data, { abortEarly: false });
}

export function validateProductSearch(data: any) {
  return productSearchSchema.validate(data, { abortEarly: false });
}

export function validateProductCategory(data: any) {
  return productCategorySchema.validate(data, { abortEarly: false });
}

export function validateBulkProductUpload(data: any) {
  return bulkProductUploadSchema.validate(data, { abortEarly: false });
}

export function validateProductImport(data: any) {
  return productImportSchema.validate(data, { abortEarly: false });
}

export function validateProductAnalytics(data: any) {
  return productAnalyticsSchema.validate(data, { abortEarly: false });
}

// Product Validation Helpers
export function validateProductSpecifications(specifications: any[], categoryAttributes: any[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const requiredAttributes = categoryAttributes.filter(attr => attr.isRequired);
  
  // Check if all required attributes are provided
  for (const requiredAttr of requiredAttributes) {
    const spec = specifications.find(s => s.attribute === requiredAttr.attributeName);
    if (!spec) {
      errors.push(`Required attribute '${requiredAttr.attributeName}' is missing`);
    }
  }
  
  // Validate each specification
  for (const spec of specifications) {
    const categoryAttr = categoryAttributes.find(attr => attr.attributeName === spec.attribute);
    if (!categoryAttr) {
      errors.push(`Attribute '${spec.attribute}' is not valid for this category`);
      continue;
    }
    
    // Type-specific validation
    switch (categoryAttr.attributeType) {
      case 'number':
        const numValue = Number(spec.value);
        if (isNaN(numValue)) {
          errors.push(`Attribute '${spec.attribute}' must be a number`);
        } else {
          if (categoryAttr.validation?.min !== undefined && numValue < categoryAttr.validation.min) {
            errors.push(`Attribute '${spec.attribute}' must be at least ${categoryAttr.validation.min}`);
          }
          if (categoryAttr.validation?.max !== undefined && numValue > categoryAttr.validation.max) {
            errors.push(`Attribute '${spec.attribute}' must be at most ${categoryAttr.validation.max}`);
          }
        }
        break;
        
      case 'boolean':
        if (!['true', 'false', '1', '0', 'yes', 'no'].includes(spec.value.toLowerCase())) {
          errors.push(`Attribute '${spec.attribute}' must be a boolean value`);
        }
        break;
        
      case 'select':
        if (!categoryAttr.options?.includes(spec.value)) {
          errors.push(`Attribute '${spec.attribute}' must be one of: ${categoryAttr.options?.join(', ')}`);
        }
        break;
        
      case 'multiselect':
        const values = spec.value.split(',').map((v: string) => v.trim());
        const invalidValues = values.filter((v: string) => !categoryAttr.options?.includes(v));
        if (invalidValues.length > 0) {
          errors.push(`Attribute '${spec.attribute}' contains invalid values: ${invalidValues.join(', ')}`);
        }
        break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validatePriceRange(basePrice: number, category: string): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  // Category-specific price validation
  const categoryLimits: Record<string, { min: number; max: number; typical: { min: number; max: number } }> = {
    [PRODUCT_CATEGORIES.FOOD_BEVERAGES]: { min: 1, max: 10000, typical: { min: 10, max: 1000 } },
    [PRODUCT_CATEGORIES.ELECTRONICS]: { min: 100, max: 1000000, typical: { min: 500, max: 50000 } },
    [PRODUCT_CATEGORIES.CLOTHING_TEXTILES]: { min: 50, max: 50000, typical: { min: 200, max: 5000 } },
    [PRODUCT_CATEGORIES.JEWELRY_ACCESSORIES]: { min: 100, max: 5000000, typical: { min: 500, max: 100000 } }
  };
  
  const limits = categoryLimits[category];
  if (limits) {
    if (basePrice < limits.typical.min) {
      warnings.push(`Price seems low for ${category}. Typical range: ₹${limits.typical.min} - ₹${limits.typical.max}`);
    } else if (basePrice > limits.typical.max) {
      warnings.push(`Price seems high for ${category}. Typical range: ₹${limits.typical.min} - ₹${limits.typical.max}`);
    }
  }
  
  return {
    isValid: true,
    warnings
  };
}