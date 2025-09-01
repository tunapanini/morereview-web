import { 
  CoupangProduct, 
  CoupangSearchParams, 
  CoupangSearchResponse, 
  CoupangAffiliateLink,
  ProductMatchResult,
  PriceComparisonResult
} from '@/types/coupang';

/**
 * 쿠팡 파트너스 API 서비스
 * 상품 검색, 어필리에이트 링크 생성, 가격 비교 등의 기능 제공
 */
export class CoupangPartnersService {
  private readonly baseUrl = 'https://api-gateway.coupang.com';
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly trackingCode = 'AF9686108'; // 기존 코드 활용
  private readonly subId = 'morereview';

  constructor() {
    this.accessKey = process.env.COUPANG_ACCESS_KEY || '';
    this.secretKey = process.env.COUPANG_SECRET_KEY || '';
    
    if (!this.accessKey || !this.secretKey) {
      console.warn('[CoupangPartnersService] API 키가 설정되지 않았습니다.');
    }
  }

  /**
   * 상품 검색 API 호출
   */
  async searchProducts(params: CoupangSearchParams): Promise<CoupangSearchResponse> {
    try {
      if (!this.accessKey || !this.secretKey) {
        // API 키가 없을 때 목업 데이터 반환 (개발용)
        return this.getMockSearchResponse(params.keyword);
      }

      // TODO: 실제 쿠팡 API 호출 구현
      // 현재는 목업 데이터로 구현
      return this.getMockSearchResponse(params.keyword);
      
    } catch (error) {
      console.error('[CoupangPartnersService] 상품 검색 실패:', error);
      return {
        totalCount: 0,
        products: [],
        isSuccess: false,
        message: '상품 검색에 실패했습니다.'
      };
    }
  }

  /**
   * 체험단 제품명에서 쿠팡 상품 매칭
   */
  async findMatchingProducts(campaignTitle: string): Promise<ProductMatchResult> {
    // 키워드 추출
    const keywords = this.extractKeywords(campaignTitle);
    
    if (keywords.length === 0) {
      return {
        campaignTitle,
        extractedKeywords: [],
        matchedProducts: [],
        confidence: 0
      };
    }

    // 가장 중요한 키워드로 검색
    const searchResult = await this.searchProducts({
      keyword: keywords[0],
      limit: 10,
      sort: 'SCORE'
    });

    if (!searchResult.isSuccess || searchResult.products.length === 0) {
      return {
        campaignTitle,
        extractedKeywords: keywords,
        matchedProducts: [],
        confidence: 0
      };
    }

    // 매칭 신뢰도 계산
    const bestMatch = this.findBestMatch(campaignTitle, searchResult.products);
    const confidence = this.calculateMatchConfidence(campaignTitle, keywords, bestMatch);

    return {
      campaignTitle,
      extractedKeywords: keywords,
      matchedProducts: searchResult.products.slice(0, 5), // 상위 5개만
      bestMatch,
      confidence
    };
  }

  /**
   * 가격 비교 분석
   */
  async comparePrices(campaignTitle: string, estimatedPrice?: number): Promise<PriceComparisonResult> {
    const matchResult = await this.findMatchingProducts(campaignTitle);
    
    if (!matchResult.bestMatch) {
      return {
        campaignProduct: campaignTitle,
        estimatedPrice,
        coupangPrice: 0,
        discountRate: 0,
        savings: 0,
        isGoodDeal: false
      };
    }

    const coupangPrice = matchResult.bestMatch.productPrice;
    const originalPrice = matchResult.bestMatch.originalPrice || coupangPrice;
    const discountRate = matchResult.bestMatch.discountRate || 0;
    
    let isGoodDeal = false;
    let savings = 0;

    if (estimatedPrice && estimatedPrice > 0) {
      savings = estimatedPrice - coupangPrice;
      isGoodDeal = savings > 0;
    } else {
      // 추정 가격이 없으면 할인율로 판단
      isGoodDeal = discountRate > 20; // 20% 이상 할인이면 좋은 거래
      savings = originalPrice - coupangPrice;
    }

    return {
      campaignProduct: campaignTitle,
      estimatedPrice,
      coupangPrice,
      discountRate,
      savings,
      isGoodDeal
    };
  }

  /**
   * 어필리에이트 링크 생성
   */
  generateAffiliateLink(productUrl: string, customSubId?: string): CoupangAffiliateLink {
    const subId = customSubId || this.subId;
    const trackingParams = new URLSearchParams({
      'trackingCode': this.trackingCode,
      'subId': subId
    });

    // 쿠팡 링크 형태에 따라 어필리에이트 파라미터 추가
    let affiliateUrl = productUrl;
    
    if (productUrl.includes('coupang.com')) {
      const separator = productUrl.includes('?') ? '&' : '?';
      affiliateUrl = `${productUrl}${separator}${trackingParams.toString()}`;
    }

    return {
      originalUrl: productUrl,
      affiliateUrl,
      trackingCode: this.trackingCode,
      subId
    };
  }

  /**
   * 키워드 추출 로직
   */
  private extractKeywords(title: string): string[] {
    // 브랜드명, 제품명 추출 로직
    const keywords: string[] = [];
    
    // 일반적인 불용어 제거
    const stopWords = ['체험단', '모집', '리뷰', '무료', '제공', '이벤트', '참여', '신청'];
    
    // 괄호 안의 내용 추출 (보통 제품명)
    const bracketMatch = title.match(/\[([^\]]+)\]|\(([^)]+)\)/);
    if (bracketMatch) {
      const extracted = bracketMatch[1] || bracketMatch[2];
      keywords.push(extracted.trim());
    }

    // 브랜드명 추출 (첫 번째 단어가 브랜드인 경우가 많음)
    const words = title.split(/\s+/).filter(word => 
      word.length > 1 && !stopWords.some(stop => word.includes(stop))
    );

    if (words.length > 0) {
      keywords.push(words[0]); // 첫 번째 단어 (보통 브랜드)
    }

    // 제품 카테고리 추출
    const categories = ['크림', '세럼', '토너', '클렌저', '마스크', '립스틱', '파운데이션', '아이섀도'];
    for (const category of categories) {
      if (title.includes(category)) {
        keywords.push(category);
        break;
      }
    }

    return keywords.filter((keyword, index, self) => self.indexOf(keyword) === index);
  }

  /**
   * 최적 매칭 상품 찾기
   */
  private findBestMatch(campaignTitle: string, products: CoupangProduct[]): CoupangProduct | undefined {
    if (products.length === 0) return undefined;

    // 간단한 매칭 로직: 제목 유사도 + 평점 + 리뷰수 고려
    return products.reduce((best, current) => {
      const bestScore = this.calculateProductScore(campaignTitle, best);
      const currentScore = this.calculateProductScore(campaignTitle, current);
      return currentScore > bestScore ? current : best;
    });
  }

  /**
   * 상품 점수 계산
   */
  private calculateProductScore(campaignTitle: string, product: CoupangProduct): number {
    let score = 0;

    // 제목 유사도 (간단한 키워드 매칭)
    const campaignKeywords = campaignTitle.toLowerCase().split(/\s+/);
    const productKeywords = product.productName.toLowerCase().split(/\s+/);
    
    const commonKeywords = campaignKeywords.filter(keyword => 
      productKeywords.some(pk => pk.includes(keyword) || keyword.includes(pk))
    );
    score += (commonKeywords.length / campaignKeywords.length) * 100;

    // 평점 점수
    if (product.rating) {
      score += (product.rating / 5) * 20;
    }

    // 리뷰 수 점수 (로그 스케일)
    if (product.reviewCount && product.reviewCount > 0) {
      score += Math.min(Math.log10(product.reviewCount) * 10, 30);
    }

    // 할인율 점수
    if (product.discountRate && product.discountRate > 0) {
      score += Math.min(product.discountRate / 2, 25);
    }

    return score;
  }

  /**
   * 매칭 신뢰도 계산
   */
  private calculateMatchConfidence(
    campaignTitle: string, 
    keywords: string[], 
    bestMatch?: CoupangProduct
  ): number {
    if (!bestMatch) return 0;

    const productScore = this.calculateProductScore(campaignTitle, bestMatch);
    return Math.min(productScore / 100, 1); // 0-1 사이로 정규화
  }

  /**
   * 개발용 목업 데이터
   */
  private getMockSearchResponse(keyword: string): CoupangSearchResponse {
    const mockProducts: CoupangProduct[] = [
      {
        productId: 'mock-001',
        productName: `${keyword} 관련 상품 1`,
        productPrice: 29900,
        originalPrice: 39900,
        productImage: 'https://via.placeholder.com/300x300',
        productUrl: 'https://www.coupang.com/vp/products/mock-001',
        discountRate: 25,
        isRocket: true,
        rating: 4.5,
        reviewCount: 1234,
        categoryName: '뷰티',
        vendorName: '모크브랜드'
      },
      {
        productId: 'mock-002',
        productName: `${keyword} 베스트 상품`,
        productPrice: 19900,
        originalPrice: 24900,
        productImage: 'https://via.placeholder.com/300x300',
        productUrl: 'https://www.coupang.com/vp/products/mock-002',
        discountRate: 20,
        isRocket: false,
        rating: 4.2,
        reviewCount: 567,
        categoryName: '뷰티',
        vendorName: '테스트브랜드'
      }
    ];

    return {
      totalCount: mockProducts.length,
      products: mockProducts,
      isSuccess: true,
      message: '검색 성공'
    };
  }
}

// 싱글톤 인스턴스
export const coupangService = new CoupangPartnersService();