// 캠페인 데이터 품질 검증 서비스

export class DataValidator {
  
  /**
   * 캠페인 데이터가 잘못 파싱된 것인지 자동 검증
   */
  static isInvalidCampaign(title: string): boolean {
    if (!title || typeof title !== 'string') return true;
    
    const cleanTitle = title.trim();
    
    // 1. 제목 길이 검증
    if (cleanTitle.length < 3 || cleanTitle.length > 100) {
      return true;
    }
    
    // 2. 회사 정보/연락처 패턴
    const companyInfoPatterns = [
      /info@/i,
      /mailto:/i,
      /©.*\d{4}/,                    // 저작권 표시
      /주식회사/,
      /대표\s*:/,
      /사업자등록번호/,
      /통신판매업신고/,
      /개인정보처리방침/,
      /이용약관/,
      /고객센터/,
      /@.*\.(com|co\.kr|net|org)/i,  // 이메일 주소
      /\d{2,3}-\d{3,4}-\d{4}/,       // 전화번호
      /\d{5}\s*[가-힣]+시\s*[가-힣]+구/, // 주소 패턴
    ];
    
    for (const pattern of companyInfoPatterns) {
      if (pattern.test(cleanTitle)) {
        return true;
      }
    }
    
    // 3. UI 요소/네비게이션 패턴
    const uiPatterns = [
      /^(제품|캠페인|체험단|리뷰|신청|참여|이벤트)$/,  // 단일 네비게이션 단어
      /^[가-힣]{1,3}[다방카페점]$/,                   // 매장명 패턴
      /검색|필터|정렬|카테고리/,
      /로그인|회원가입|마이페이지/,
      /전체|선택|확인|취소|삭제/,
      /^[A-Za-z]{1,10}$/,                          // 짧은 영문자만
    ];
    
    for (const pattern of uiPatterns) {
      if (pattern.test(cleanTitle)) {
        return true;
      }
    }
    
    // 4. 무의미한 문자열 패턴
    const meaninglessPatterns = [
      /^[a-zA-Z0-9]{1,10}$/,                      // 짧은 영숫자 조합
      /[가-힣]{20,}/,                             // 너무 긴 한글 연속
      /(.)\1{5,}/,                                // 같은 문자 5번 이상 반복
      /^[^가-힣a-zA-Z]*$/,                        // 한글/영문이 전혀 없음
    ];
    
    for (const pattern of meaninglessPatterns) {
      if (pattern.test(cleanTitle)) {
        return true;
      }
    }
    
    // 5. 캠페인 관련 키워드가 전혀 없는 경우
    const campaignKeywords = [
      '체험', '캠페인', '리뷰', '모집', '신청', '참여', '이벤트', '혜택',
      '무료', '제공', '선착순', '당첨', '증정', '할인', '쿠폰', '포인트',
      '서비스', '상품', '제품', '브랜드', '매장', '방문'
    ];
    
    const hasKeyword = campaignKeywords.some(keyword => 
      cleanTitle.includes(keyword)
    );
    
    // 키워드가 없고 제목이 의심스럽게 짧거나 이상한 경우
    if (!hasKeyword && (cleanTitle.length < 8 || /^[가-힣]{2,6}$/.test(cleanTitle))) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 캠페인 제목의 품질 점수 계산 (0-100)
   */
  static calculateQualityScore(title: string): number {
    if (!title) return 0;
    
    let score = 50; // 기본 점수
    
    // 적절한 길이 (+20)
    if (title.length >= 10 && title.length <= 50) {
      score += 20;
    }
    
    // 캠페인 키워드 포함 (+15)
    const campaignKeywords = ['체험', '캠페인', '리뷰', '모집', '신청'];
    if (campaignKeywords.some(keyword => title.includes(keyword))) {
      score += 15;
    }
    
    // 브랜드/제품명 포함 (+10)
    if (/[가-힣]{2,}/.test(title)) {
      score += 10;
    }
    
    // 특수문자/숫자 적절히 포함 (+5)
    if (/[0-9]/.test(title) || /[!@#$%^&*(),.?":{}|<>]/.test(title)) {
      score += 5;
    }
    
    // 감점 요소들
    if (title.length < 5) score -= 30;
    if (title.length > 80) score -= 20;
    if (/(.)\1{3,}/.test(title)) score -= 25; // 반복 문자
    
    return Math.max(0, Math.min(100, score));
  }
}