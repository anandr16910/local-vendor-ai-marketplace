export interface Product {
  productId: string;
  vendorId: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  images: string[];
  specifications: ProductSpecification[];
  basePrice: number;
  availability: AvailabilityInfo;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductSpecification {
  attribute: string;
  value: string;
  unit?: string;
  isNegotiable: boolean;
}

export interface AvailabilityInfo {
  inStock: boolean;
  quantity?: number;
  unit?: string;
  restockDate?: Date;
  seasonalAvailability?: SeasonalAvailability;
  customOrderAvailable: boolean;
  leadTime?: number; // in days
}

export interface SeasonalAvailability {
  availableMonths: number[]; // 1-12
  peakMonths: number[];
  description?: string;
}

export interface ProductCategory {
  categoryId: string;
  name: string;
  parentCategoryId?: string;
  description: string;
  attributes: CategoryAttribute[];
  culturalSignificance?: string;
}

export interface CategoryAttribute {
  attributeName: string;
  attributeType: 'text' | 'number' | 'boolean' | 'select' | 'multiselect';
  isRequired: boolean;
  options?: string[];
  unit?: string;
  validation?: AttributeValidation;
}

export interface AttributeValidation {
  min?: number;
  max?: number;
  pattern?: string;
  customValidator?: string;
}

export interface LocationInfo {
  city?: string;
  state?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  radius?: number;
}

export interface ProductSearch {
  query?: string;
  category?: string;
  subcategory?: string;
  location?: LocationInfo;
  priceRange?: {
    min: number;
    max: number;
  };
  availability?: 'in_stock' | 'custom_order' | 'all';
  vendorRating?: number;
  tags?: string[];
  sortBy?: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'distance';
  limit?: number;
  offset?: number;
}

export interface ProductSearchResult {
  products: ProductSummary[];
  totalCount: number;
  facets: SearchFacets;
  suggestions?: string[];
}

export interface ProductSummary {
  productId: string;
  vendorId: string;
  vendorName: string;
  vendorRating: number;
  name: string;
  category: string;
  basePrice: number;
  images: string[];
  availability: boolean;
  distance?: number;
  culturalRelevance?: number;
}

export interface SearchFacets {
  categories: FacetCount[];
  priceRanges: FacetCount[];
  vendors: FacetCount[];
  availability: FacetCount[];
  ratings: FacetCount[];
}

export interface FacetCount {
  value: string;
  count: number;
  selected?: boolean;
}