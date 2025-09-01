// 쿠팡 파트너스 API 관련 타입 정의

export interface CoupangProduct {
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string;
  productUrl: string;
  discountRate?: number;
  originalPrice?: number;
  isRocket?: boolean;
  rating?: number;
  reviewCount?: number;
  categoryName?: string;
  vendorName?: string;
}

export interface CoupangSearchParams {
  keyword: string;
  limit?: number;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'SCORE' | 'PRICE_ASC' | 'PRICE_DESC' | 'SALE' | 'REVIEW';
}

export interface CoupangSearchResponse {
  totalCount: number;
  products: CoupangProduct[];
  isSuccess: boolean;
  message?: string;
}

export interface CoupangAffiliateLink {
  originalUrl: string;
  affiliateUrl: string;
  trackingCode: string;
  subId?: string;
}

export interface ProductMatchResult {
  campaignTitle: string;
  extractedKeywords: string[];
  matchedProducts: CoupangProduct[];
  bestMatch?: CoupangProduct;
  confidence: number; // 0-1 사이의 매칭 신뢰도
}

export interface PriceComparisonResult {
  campaignProduct: string;
  estimatedPrice?: number;
  coupangPrice: number;
  discountRate: number;
  savings: number;
  isGoodDeal: boolean; // 쿠팡이 더 저렴한지
}