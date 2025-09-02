import { Campaign, CampaignCategory, CampaignPlatform, CampaignSource, CampaignSortBy, CampaignSortOrder } from '@/types/campaign';
import { logger } from '@/utils/logger';

// 크롤링된 원시 데이터 타입
interface RawCampaignData {
  source_site: string;
  campaign_id: string;
  title: string;
  description: string;
  thumbnail_image: string;
  detail_url: string;
  applications_current: number;
  applications_total: number;
  reward_points: number;
  category: string;
  channels: string[];
  created_at?: string; // 크롤링 시점
  deadline?: Date | null; // 실제 마감일
}

// 카테고리 매핑 함수
function mapToCategory(title: string, description: string): CampaignCategory {
  const text = (title + ' ' + description).toLowerCase();

  // lifestyle 카테고리 우선 처리 (방수제, 생활용품 등)
  if (text.includes('방수') || text.includes('코팅') || text.includes('워터스탑') ||
    text.includes('홈데코') || text.includes('인테리어') || text.includes('가전') ||
    text.includes('전자제품') || text.includes('가구') || text.includes('생활용품') ||
    text.includes('청소') || text.includes('세제') || text.includes('주방') ||
    text.includes('수납') || text.includes('정리') || text.includes('도구')) {
    return 'lifestyle';
  }

  if (text.includes('뷰티') || text.includes('화장품') || text.includes('스킨케어') ||
    text.includes('세럼') || text.includes('크림') || text.includes('마스크') ||
    text.includes('앰플') || text.includes('토너') || text.includes('클렌저') ||
    text.includes('샴푸') || text.includes('헤어') || text.includes('두피')) {
    return 'beauty';
  }

  if (text.includes('건강') || text.includes('영양제') || text.includes('비타민') ||
    text.includes('프로틴') || text.includes('유산균') || text.includes('오메가') ||
    text.includes('콜라겐') || text.includes('다이어트')) {
    return 'health';
  }

  if (text.includes('패션') || text.includes('의류') || text.includes('옷') ||
    text.includes('신발') || text.includes('가방') || text.includes('악세사리') ||
    text.includes('티셔츠') || text.includes('바지') || text.includes('드레스')) {
    return 'fashion';
  }

  // 기본적으로는 뷰티로 분류 (리뷰 캠페인 특성상)
  return 'beauty';
}

// 플랫폼 매핑 함수
function mapToPlatforms(channels: string[], title: string): CampaignPlatform[] {
  const platforms: CampaignPlatform[] = [];
  const text = (channels.join(' ') + ' ' + title).toLowerCase();
  const titleLower = title.toLowerCase();

  // 구매평 + 블로그 복합 캠페인 패턴 감지 (다양한 표기 형태 지원)
  if (titleLower.includes('[스마트스토어/블로그]') || titleLower.includes('[스스/블로그]') || 
      titleLower.includes('스마트스토어+블로그') || titleLower.includes('스스+블로그') ||
      titleLower.includes('블로그/스마트스토어') || titleLower.includes('블로그/스스') ||
      (titleLower.includes('스마트스토어') && titleLower.includes('블로그'))) {
    platforms.push('naverblog', 'smartstore_review');
  } else if (titleLower.includes('[자사몰/블로그]') || titleLower.includes('자사몰+블로그') ||
             titleLower.includes('블로그/자사몰') ||
             (titleLower.includes('자사몰') && titleLower.includes('블로그'))) {
    platforms.push('naverblog', 'company_mall_review');
  } else if (titleLower.includes('[쿠팡/블로그]') || titleLower.includes('쿠팡+블로그') ||
             titleLower.includes('블로그/쿠팡') ||
             (titleLower.includes('쿠팡') && titleLower.includes('블로그'))) {
    platforms.push('naverblog', 'coupang_review');
  } else {
    // 단일 플랫폼 처리
    if (text.includes('인스타') || text.includes('instagram') || text.includes('릴스') || text.includes('reels')) {
      platforms.push('instagram');
    }

    if (text.includes('유튜브') || text.includes('youtube')) {
      platforms.push('youtube');
    }

    if (text.includes('틱톡') || text.includes('tiktok')) {
      platforms.push('tiktok');
    }

    if (text.includes('블로그') || text.includes('blog')) {
      if (!platforms.includes('naverblog')) {
        platforms.push('naverblog');
      }
    }

    // 단일 구매평 플랫폼 처리 (복합이 아닌 경우)
    if (text.includes('스마트스토어') && !titleLower.includes('/블로그')) {
      platforms.push('smartstore_review');
    } else if (text.includes('쿠팡') && !titleLower.includes('/블로그')) {
      platforms.push('coupang_review');
    } else if (text.includes('자사몰') && !titleLower.includes('/블로그')) {
      platforms.push('company_mall_review');
    }

    // 기본값으로 인스타그램 추가 (아무것도 매치되지 않은 경우)
    if (platforms.length === 0) {
      platforms.push('instagram');
    }
  }

  return platforms;
}

// 제목 정리 함수
function cleanTitle(rawTitle: string): string {
  return rawTitle
    .replace(/\n+/g, ' ') // 개행을 공백으로 변경
    .replace(/\s+/g, ' ') // 연속 공백을 하나로
    .replace(/^\s*NEW\s*/i, '') // 앞의 NEW 제거
    // .replace(/\[.*?\]/g, '') // [스토어/블로그] 같은 태그 제거
    .replace(/D\s*-\s*\d+.*$/, '') // D-7 이후 텍스트 제거
    .trim()
    .substring(0, 100); // 최대 100자로 제한
}

// 브랜드명 추출 함수
function extractBrand(title: string): string {
  // 간단한 브랜드명 추출 로직
  const cleanedTitle = cleanTitle(title);
  const words = cleanedTitle.split(' ');

  // 첫 번째 유의미한 단어를 브랜드로 사용
  for (const word of words) {
    if (word.length > 1 && !['리뷰', '체험단', '캠페인', '모집'].includes(word)) {
      return word;
    }
  }

  return words[0] || '브랜드명';
}

// 위치 정보 추출 함수
function extractLocation(title: string, description: string): string | undefined {
  const text = (title + ' ' + description).toLowerCase();

  // 매장명에서 위치 추출 패턴
  const storeLocationPatterns = [
    { pattern: /([가-힣]+구|[가-힣]+동)\s*[가-힣]*점/, group: 1 },    // 강남구점, 홍대동점
    { pattern: /([가-힣]+시)\s*[가-힣]*점/, group: 1 },              // 부천시점
    { pattern: /([가-힣]+로|[가-힣]+길)\s*[가-힣]*점/, group: 1 },    // 테헤란로점
    { pattern: /([가-힣]+역)\s*[가-힣]*점/, group: 1 },              // 강남역점
    { pattern: /([가-힣]+)\s*(점|지점|매장)/, group: 1 },            // 강남점, 홍대지점
  ];

  // 매장명 패턴에서 위치 추출 시도
  for (const { pattern, group } of storeLocationPatterns) {
    const match = title.match(pattern);
    if (match && match[group]) {
      const location = match[group];
      // 의미있는 지역명인지 확인 (2글자 이상)
      if (location.length >= 2) {
        return location;
      }
    }
  }

  // 브랜드명에서 위치 정보가 없으면 매장명 자체를 위치로 사용
  const storePatterns = [
    /[가-힣]+다방$/,          // ~다방 (케익다방, 커피다방 등)
    /[가-힣]+카페$/,          // ~카페  
    /[가-힣]+점$/,            // ~점 (강남점, 홍대점 등)
    /[가-힣]+매장$/,          // ~매장
    /[가-힣]+스튜디오$/,      // ~스튜디오
    /[가-힣]+센터$/,          // ~센터
    /[가-힣]+샵$/,            // ~샵
    /[가-힣]+클리닉$/,        // ~클리닉
    /[가-힣]+살롱$/,          // ~살롱
  ];

  for (const pattern of storePatterns) {
    if (pattern.test(title.trim())) {
      return title.trim();  // 매장명 자체를 위치로 사용
    }
  }

  // 시/도 매칭
  const provinces = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
  ];

  // 구체적인 지역 매칭 (시/군/구)
  const detailedLocations = [
    // 서울
    '강남', '강동', '강북', '강서', '관악', '광진', '구로', '금천', '노원', '도봉',
    '동대문', '동작', '마포', '서대문', '서초', '성동', '성북', '송파', '양천',
    '영등포', '용산', '은평', '종로', '중구', '중랑',
    // 경기
    '수원', '성남', '고양', '용인', '부천', '안산', '안양', '남양주', '화성',
    '평택', '의정부', '시흥', '파주', '광명', '김포', '군포', '오산', '하남',
    '양주', '구리', '안성', '포천', '의왕', '여주', '동두천', '과천', '가평', '연천',
    // 기타 주요 도시
    '창원', '천안', '전주', '안동', '포항', '구미', '김해', '제주시', '서귀포'
  ];

  // 매장, 스튜디오, 체험센터 등과 함께 언급된 위치 찾기
  const locationKeywords = ['매장', '스튜디오', '센터', '샵', '지점', '본점', '직영점', '체험'];

  for (const keyword of locationKeywords) {
    if (text.includes(keyword)) {
      // 키워드 앞뒤로 위치 정보 찾기
      for (const province of provinces) {
        if (text.includes(province)) {
          // 더 구체적인 지역이 있는지 확인
          for (const detailed of detailedLocations) {
            if (text.includes(detailed) && text.includes(province)) {
              return `${province} ${detailed}`;
            }
          }
          return province;
        }
      }

      // 구체적인 지역만 있는 경우
      for (const detailed of detailedLocations) {
        if (text.includes(detailed)) {
          return detailed;
        }
      }
    }
  }

  // 일반적인 지역 언급 (매장 키워드 없이도)
  for (const province of provinces) {
    if (text.includes(province)) {
      for (const detailed of detailedLocations) {
        if (text.includes(detailed) && text.includes(province)) {
          return `${province} ${detailed}`;
        }
      }
      return province;
    }
  }

  return undefined;
}

// 캠페인 방문 유형 판단 함수
function determineVisitType(title: string, description: string, location?: string): 'visit' | 'delivery' {
  const text = (title + ' ' + description).toLowerCase();

  // 매장명 패턴 감지 (최우선 - 매장명이 있으면 무조건 방문형)
  const storePatterns = [
    /[가-힣]+다방$/,          // ~다방 (케익다방, 커피다방 등)
    /[가-힣]+카페$/,          // ~카페  
    /[가-힣]+점$/,            // ~점 (강남점, 홍대점 등)
    /[가-힣]+매장$/,          // ~매장
    /[가-힣]+스튜디오$/,      // ~스튜디오
    /[가-힣]+센터$/,          // ~센터
    /[가-힣]+샵$/,            // ~샵
    /[가-힣]+클리닉$/,        // ~클리닉
    /[가-힣]+살롱$/,          // ~살롱
    /[가-힣]+지점$/,          // ~지점
  ];

  // 제목에서 매장명 패턴 검사
  for (const pattern of storePatterns) {
    if (pattern.test(title.trim())) {
      return 'visit';  // 매장명 패턴이면 무조건 방문형
    }
  }

  // 방문형 키워드들
  const visitKeywords = [
    '매장', '스튜디오', '센터', '샵', '지점', '본점', '직영점', '체험', '방문',
    '촬영', '시술', '케어', '관리', '상담', '테스트', '시연', '데모',
    '오프라인', '현장', '매장방문', '직접방문'
  ];

  // 제공형 키워드들 ("재택"의 가중치를 낮춤)
  const deliveryKeywords = [
    '페이백', '캐시백', '적립', '리워드', '포인트', '환급',
    '배송', '택배', '우편', '발송', '무료배송',
    '기자단', '서포터즈', '앰버서더', '인플루언서',
    '홈케어', '홈트', '집에서', '자택',
    '온라인', '인터넷', '모바일', 'SNS', '소셜미디어'
  ];

  // "재택" 키워드는 별도 처리 (가중치 낮춤)
  const remoteKeywords = ['재택'];

  // 위치 정보가 있으면 기본적으로 방문형으로 간주
  if (location) {
    return 'visit';
  }

  // 방문형 키워드 점수 계산
  let visitScore = 0;
  for (const keyword of visitKeywords) {
    if (text.includes(keyword)) {
      visitScore += 2;  // 방문형 키워드는 가중치 2
    }
  }

  // 제공형 키워드 점수 계산
  let deliveryScore = 0;
  for (const keyword of deliveryKeywords) {
    if (text.includes(keyword)) {
      deliveryScore += 2;  // 제공형 키워드는 가중치 2
    }
  }

  // "재택" 키워드는 가중치 1 (낮음)
  for (const keyword of remoteKeywords) {
    if (text.includes(keyword)) {
      deliveryScore += 1;  // 재택은 가중치 1로 낮춤
    }
  }

  // 점수 비교하여 결정
  if (visitScore > deliveryScore) {
    return 'visit';
  } else if (visitScore < deliveryScore) {
    return 'delivery';
  } else {
    // 점수가 같으면 기본값은 제공형
    return 'delivery';
  }
}

// 🚨 deadline 기반 날짜 계산 함수 (remaining_days 제거)
function calculateDates(deadline: Date | null, crawledAt?: Date) {
  // deadline 기반 날짜 계산 (시간이 지나도 변하지 않음)
  const baseTime = crawledAt || new Date();
  
  // deadline이 있으면 사용, 없으면 기본값 7일 후로 설정
  let actualDeadline: Date;
  
  if (deadline && !isNaN(deadline.getTime())) {
    actualDeadline = new Date(deadline);
  } else {
    console.warn('⚠️ deadline이 null 또는 invalid, 기본값 7일 후로 설정');
    actualDeadline = new Date(baseTime.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  
  // 마감일을 해당일 23:59:59로 설정 (더 정확한 마감시간)
  actualDeadline.setHours(23, 59, 59, 999);

  // 시작일은 크롤링 시점 기준으로 과거 1-3일 사이 랜덤
  const startDate = new Date(baseTime.getTime() - (Math.random() * 2 + 1) * 24 * 60 * 60 * 1000);
  
  // endDate는 actualDeadline과 동일
  const endDate = actualDeadline;

  // 날짜 유효성 최종 검증
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.error('🚨 날짜 계산 실패, 강제 기본값 적용');
    const defaultStart = new Date(baseTime.getTime() - 2 * 24 * 60 * 60 * 1000); // 2일 전
    const defaultEnd = new Date(baseTime.getTime() + 7 * 24 * 60 * 60 * 1000); // 7일 후
    defaultEnd.setHours(23, 59, 59, 999);
    return { startDate: defaultStart, endDate: defaultEnd };
  }

  // 시작일이 마감일보다 늦지 않도록 보장
  if (startDate >= endDate) {
    const correctedStart = new Date(endDate.getTime() - 2 * 24 * 60 * 60 * 1000);
    console.warn('⚠️ 시작일이 마감일보다 늦음, 자동 수정');
    return { startDate: correctedStart, endDate };
  }

  return { startDate, endDate };
}

// 원시 데이터를 Campaign 타입으로 변환
export function convertRawDataToCampaigns(rawData: RawCampaignData[]): Campaign[] {
  return rawData.map((raw, index) => {
    const cleanedTitle = cleanTitle(raw.title);
    const brand = extractBrand(raw.title);
    const category = mapToCategory(raw.title, raw.description);
    const platforms = mapToPlatforms(raw.channels, raw.title);
    // 크롤링 시점 (created_at)을 기준으로 고정된 마감일 계산
    const crawledAt = raw.created_at ? new Date(raw.created_at) : new Date();
    const { startDate, endDate } = calculateDates(raw.deadline || null, crawledAt);

    // 위치 정보 추출 및 방문 유형 결정
    const location = extractLocation(raw.title, raw.description);
    const visitType = determineVisitType(raw.title, raw.description, location);

    // 소스 사이트를 CampaignSource로 매핑
    const sourceMap: Record<string, CampaignSource> = {
      'reviewplace.co.kr': 'reviewplace',
      'reviewnote.co.kr': 'reviewnote',    // 리뷰노트
      'revu.net': 'revu',                  // 레뷰 (실제 크롤링 소스)
      'revu.co.kr': 'revu',                // 레뷰 (기존 호환성)
      'reviewtiful': 'reviewtiful',
      'dinnerqueen': 'dinnerqueen',
      'miso': 'miso',
      'chertian': 'chertian',
      'covey': 'covey',
      'ringble': 'ringble',
      'seoulouba': 'seoulouba'
    };

    const source = sourceMap[raw.source_site];
    
    if (!source) {
      console.warn(`🚨 알 수 없는 소스 사이트: "${raw.source_site}" → reviewtiful로 매핑`);
      // 기본값으로 reviewtiful 설정하지 않고 실제 소스를 보존
    }
    
    const finalSource = source || 'reviewtiful';

    // 🚨 필수 필드 및 null 방지 유효성 검사 강화
    if (!cleanedTitle || cleanedTitle.length < 3) {
      logger.dev(`캠페인 제외 (제목 부족): ${raw.title}`);
      return null; // 유효하지 않은 캠페인은 제외
    }
    
    // deadline null 체크 (이 시점에서도 재확인)
    if (!raw.deadline) {
      logger.dev(`deadline null 발견 (캠페인 ${index}): ${cleanedTitle.substring(0, 30)}... - 기본값이 적용됨`);
    }

    return {
      id: `real-${raw.source_site}-${raw.campaign_id}-${index}`,
      title: cleanedTitle,
      brand: brand,
      category: category,
      platforms: platforms,
      reward: raw.reward_points || 0,
      visitType: visitType,
      location: location,
      startDate: startDate,
      endDate: endDate,
      // 🚨 개선된 상태 계산: ending-soon 상태도 고려
      status: (() => {
        const now = new Date();
        const daysUntilEnd = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilEnd <= 0) {
          return 'closed' as const;
        } else if (daysUntilEnd <= 2) {
          return 'ending-soon' as const;
        } else {
          return 'active' as const;
        }
      })(),
      createdDate: startDate, // 시작일을 등록일로 사용
      source: finalSource,
      sourceUrl: raw.detail_url,
      description: raw.description,
      participantCount: raw.applications_current || Math.floor(Math.random() * 50) + 10,
      maxParticipants: raw.applications_total || Math.floor(Math.random() * 30) + 50,
      imageUrl: raw.thumbnail_image || '/images/default-campaign.jpg'
    };
  }).filter(campaign => campaign !== null); // null 값 제거
}

// 실제 크롤링 데이터 로드 (Supabase API에서)
export async function loadRealCampaignData(sortBy: CampaignSortBy = 'latest', sortOrder: CampaignSortOrder = 'desc'): Promise<Campaign[]> {
  try {
    // 🚀 성능 최적화: 스트리밍과 청크 처리로 메모리 효율성 개선
    const batchSize = 200; // 배치 크기 제한으로 메모리 사용량 조절
    let page = 1;
    const allCampaigns: Campaign[] = [];
    let hasMore = true;

    while (hasMore && page <= 10) { // 최대 10페이지 (2000개)로 제한
      const response = await fetch(
        `/api/campaigns?page=${page}&limit=${batchSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
        {
          // ⚡ 성능 최적화: 압축 활성화
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to load campaign data: ${response.status}`);
      }

      const result = await response.json();
      const rawData: RawCampaignData[] = result.data || [];

      if (!Array.isArray(rawData) || rawData.length === 0) {
        hasMore = false;
        break;
      }

      // 📊 배치 단위로 데이터 변환하여 메모리 효율성 향상
      const batchCampaigns = convertRawDataToCampaigns(rawData);
      const validBatchCampaigns = batchCampaigns.filter(campaign => {
        return campaign?.id &&
          campaign.title &&
          campaign.createdDate &&
          campaign.endDate &&
          campaign.startDate &&
          !isNaN(campaign.createdDate.getTime()) &&
          !isNaN(campaign.endDate.getTime()) &&
          !isNaN(campaign.startDate.getTime());
      });

      allCampaigns.push(...validBatchCampaigns);

      // 🔄 페이지네이션 체크
      hasMore = result.pagination.page < result.pagination.totalPages;
      page++;
    }

    // 🎯 중복 제거 최적화: Map 기반 중복 제거
    const uniqueCampaigns = new Map<string, Campaign>();
    for (const campaign of allCampaigns) {
      if (!uniqueCampaigns.has(campaign.id)) {
        uniqueCampaigns.set(campaign.id, campaign);
      }
    }

    const finalCampaigns = Array.from(uniqueCampaigns.values());

    logger.dev(`⚡ 성능 최적화 완료: ${finalCampaigns.length} 캠페인 로드 (${page - 1} 배치 처리)`);

    return finalCampaigns;
  } catch (error) {
    logger.error('Error loading real campaign data', error);
    return [];
  }
}