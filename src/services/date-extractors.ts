// 사이트별 DOM 구조 기반 안전한 날짜 추출 시스템

import * as cheerio from 'cheerio';
import { fetchHTML } from '@/utils/simple-http';
import { DateInfo } from '@/types/simple-crawler';

export abstract class BaseDateExtractor {
  protected currentYear = new Date().getFullYear();
  
  abstract extractFromListPage($: cheerio.CheerioAPI, $item: any): string | null;
  abstract extractFromDetailPage(detailUrl: string): Promise<DateInfo | null>;
  
  // 공통 유틸리티 메서드들
  protected parseMMDD(dateStr: string, currentYear: number = this.currentYear): Date | null {
    // 다양한 날짜 형식 지원: MM.DD, M.D, M/D, MM/DD
    const patterns = [
      /(\d{1,2})\.(\d{1,2})/,  // 8.26, 08.26
      /(\d{1,2})\/(\d{1,2})/,  // 8/26, 08/26  
      /(\d{1,2})-(\d{1,2})/,   // 8-26, 08-26
    ];
    
    let match: RegExpMatchArray | null = null;
    for (const pattern of patterns) {
      match = dateStr.match(pattern);
      if (match) break;
    }
    
    if (!match) return null;
    
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    
    return new Date(currentYear, month - 1, day);
  }
  
  protected calculateRemainingDays(targetDate: Date): number {
    const now = new Date();
    
    // 당일 23:59:59까지 유효한 것으로 간주
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    
    const diffTime = targetMidnight.getTime() - todayMidnight.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 디버깅용 로깅
    console.log(`📅 마감일 계산: 오늘(${now.toLocaleDateString('ko-KR')}) → 마감일(${targetDate.toLocaleDateString('ko-KR')})`);
    console.log(`⏰ 시간 차이: ${diffTime}ms = ${diffDays}일`);
    
    // 당일 마감인 경우 D-0, 내일 마감인 경우 D-1
    const remainingDays = Math.max(diffDays, 0);
    console.log(`✅ 최종 계산: D-${remainingDays}`);
    
    return remainingDays;
  }
  
  protected generateReasonableDeadline(): string {
    // 기본값: 7일 후
    return "D-7";
  }
}

export class ReviewPlaceExtractor extends BaseDateExtractor {
  extractFromListPage($: cheerio.CheerioAPI, $item: any): string | null {
    const text = $item.text();
    
    // 다양한 패턴으로 마감일 추출 시도
    const patterns = [
      /[_\s]*D[_\s]*-[_\s]*(\d+)/i,      // "_D_ - 6" 형태
      /(\d+)\s*일\s*남음/,               // "3일 남음"
      /남은\s*(\d+)\s*일/,               // "남은 5일"  
      /마감\s*(\d+)\s*일\s*전/,          // "마감 2일 전"
      /D-(\d+)/i,                        // 기본 "D-6" 형태
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const days = parseInt(match[1], 10);
        if (days > 0 && days <= 365) { // 합리적인 범위 체크
          return `D-${days}`;
        }
      }
    }
    
    return null;
  }
  
  async extractFromDetailPage(detailUrl: string): Promise<DateInfo | null> {
    try {
      console.log(`🔍 상세 페이지에서 날짜 추출 시도: ${detailUrl}`);
      const html = await fetchHTML(detailUrl);
      const $ = cheerio.load(html);
      
      // 캠페인 정보가 있을 법한 섹션들 탐색
      const campaignSections = [
        '.campaign-info',
        '.detail-info', 
        '.pr-detail',
        '[class*="campaign"]',
        '[class*="detail"]',
        'main',
        '.content'
      ];
      
      let campaignText = '';
      for (const selector of campaignSections) {
        const section = $(selector);
        if (section.length > 0) {
          campaignText += section.text() + ' ';
        }
      }
      
      // 전체 페이지 텍스트도 포함
      if (!campaignText.trim()) {
        campaignText = $('body').text();
      }
      
      return this.parseDetailPageText(campaignText);
      
    } catch (error) {
      console.warn('상세 페이지 추출 실패:', (error as Error).message);
      return null;
    }
  }
  
  private parseDetailPageText(text: string): DateInfo | null {
    // 다양한 날짜 형식 패턴 지원
    const dateFormats = [
      // 점(.) 구분자
      /모집기간[:\s]*(\d{1,2})\.(\d{1,2})\s*~\s*(\d{1,2})\.(\d{1,2})/,
      /리뷰\s*등록기간[:\s]*(\d{1,2})\.(\d{1,2})\s*~\s*(\d{1,2})\.(\d{1,2})/,
      
      // 슬래시(/) 구분자  
      /모집기간[:\s]*(\d{1,2})\/(\d{1,2})\s*~\s*(\d{1,2})\/(\d{1,2})/,
      /리뷰\s*등록기간[:\s]*(\d{1,2})\/(\d{1,2})\s*~\s*(\d{1,2})\/(\d{1,2})/,
      
      // 신청기간, 체험단 등의 키워드도 지원
      /신청기간[:\s]*(\d{1,2})[.\/-](\d{1,2})\s*~\s*(\d{1,2})[.\/-](\d{1,2})/,
      /체험단\s*신청기간[:\s]*(\d{1,2})[.\/-](\d{1,2})\s*~\s*(\d{1,2})[.\/-](\d{1,2})/,
      
      // 괄호 안의 날짜도 지원
      /\((\d{1,2})[.\/-](\d{1,2})\s*~\s*(\d{1,2})[.\/-](\d{1,2})\)/,
    ];
    
    let recruitmentMatch: RegExpMatchArray | null = null;
    let reviewMatch: RegExpMatchArray | null = null;
    
    // 모집/신청 기간 찾기
    for (const pattern of dateFormats.slice(0, 6)) { // 처음 6개 패턴은 모집/신청 관련
      recruitmentMatch = text.match(pattern);
      if (recruitmentMatch) break;
    }
    
    // 리뷰 기간 찾기
    for (const pattern of dateFormats.slice(1, 2).concat(dateFormats.slice(3, 4))) { // 리뷰 관련 패턴만
      reviewMatch = text.match(pattern);
      if (reviewMatch) break;
    }
    
    let recruitmentEnd: Date | null = null;
    let remainingDays = 7; // 기본값
    
    // 🚨 모집기간을 최우선으로 처리 (실제 캠페인 마감일)
    if (recruitmentMatch) {
      const endMonth = parseInt(recruitmentMatch[3], 10);
      const endDay = parseInt(recruitmentMatch[4], 10);
      recruitmentEnd = new Date(this.currentYear, endMonth - 1, endDay);
      remainingDays = this.calculateRemainingDays(recruitmentEnd);
      
      console.log(`✅ 모집기간 추출 성공 (우선 적용): ${recruitmentMatch[0]}, 남은 일수: ${remainingDays}`);
      
      return {
        recruitmentEnd,
        remainingDays
      };
    }
    
    // 모집기간이 없는 경우에만 리뷰 등록기간 사용 (하위 우선순위)
    if (reviewMatch) {
      const startMonth = parseInt(reviewMatch[1], 10);
      const startDay = parseInt(reviewMatch[2], 10);
      const reviewStart = new Date(this.currentYear, startMonth - 1, startDay);
      remainingDays = this.calculateRemainingDays(reviewStart);
      
      console.log(`⚠️ 모집기간 없음, 리뷰기간으로 대체: ${reviewMatch[0]}, 남은 일수: ${remainingDays}`);
      
      return {
        recruitmentEnd: reviewStart,
        remainingDays
      };
    }
    
    return null;
  }
}

export class ReviewNoteExtractor extends BaseDateExtractor {
  extractFromListPage($: cheerio.CheerioAPI, $item: any): string | null {
    const text = $item.text();
    
    // 1. 먼저 구체적인 날짜 패턴 시도 (8/26 ~ 9/5 형식)
    const dateRangePatterns = [
      /(\d{1,2})[.\/-](\d{1,2})\s*[~\-]\s*(\d{1,2})[.\/-](\d{1,2})/,  // 8/26 ~ 9/5, 8.26 ~ 9.5
      /신청기간[:\s]*(\d{1,2})[.\/-](\d{1,2})\s*[~\-]\s*(\d{1,2})[.\/-](\d{1,2})/,
      /모집기간[:\s]*(\d{1,2})[.\/-](\d{1,2})\s*[~\-]\s*(\d{1,2})[.\/-](\d{1,2})/,
      /체험단\s*신청기간[:\s]*(\d{1,2})[.\/-](\d{1,2})\s*[~\-]\s*(\d{1,2})[.\/-](\d{1,2})/,
      /\((\d{1,2})[.\/-](\d{1,2})\s*[~\-]\s*(\d{1,2})[.\/-](\d{1,2})\)/,  // (8/26 ~ 9/5)
    ];
    
    for (const pattern of dateRangePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          // 종료일로 마감일 계산 (3번째, 4번째 그룹)
          const endMonth = parseInt(match[3], 10);
          const endDay = parseInt(match[4], 10);
          
          if (endMonth >= 1 && endMonth <= 12 && endDay >= 1 && endDay <= 31) {
            const currentYear = new Date().getFullYear();
            const endDate = new Date(currentYear, endMonth - 1, endDay);
            
            // 만약 날짜가 이미 지났다면 내년으로 설정
            if (endDate < new Date()) {
              endDate.setFullYear(currentYear + 1);
            }
            
            const remainingDays = this.calculateRemainingDays(endDate);
            return `D-${remainingDays}`;
          }
        } catch (error) {
          console.warn('날짜 파싱 에러:', error);
        }
      }
    }
    
    // 2. 기존 상대적 날짜 패턴들
    const relativeDatePatterns = [
      /(\d+)\s*일\s*후\s*마감/,          // "3일 후 마감"
      /마감\s*(\d+)\s*일\s*남음/,        // "마감 5일 남음"
      /D-(\d+)/i,                        // "D-7"
      /(\d+)\s*일\s*남음/,               // "3일 남음"
    ];
    
    for (const pattern of relativeDatePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const days = parseInt(match[1], 10);
        if (days > 0 && days <= 90) { // 리뷰노트는 보통 더 짧은 기간
          return `D-${days}`;
        }
      }
    }
    
    return null;
  }
  
  async extractFromDetailPage(detailUrl: string): Promise<DateInfo | null> {
    try {
      const html = await fetchHTML(detailUrl);
      const $ = cheerio.load(html);
      
      const text = $('body').text();
      
      // 리뷰노트는 매장 방문 캠페인이 많아서 예약 가능 기간 등을 찾아볼 수 있음
      const datePatterns = [
        /(\d{1,2})\s*월\s*(\d{1,2})\s*일.*마감/,  // "8월 27일 마감"
        /(\d{1,2})\/(\d{1,2}).*마감/,              // "8/27 마감"
        /마감\s*(\d{1,2})\.(\d{1,2})/,             // "마감 08.27"
      ];
      
      for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
          const month = parseInt(match[1], 10);
          const day = parseInt(match[2], 10);
          const targetDate = new Date(this.currentYear, month - 1, day);
          const remainingDays = this.calculateRemainingDays(targetDate);
          
          return {
            recruitmentEnd: targetDate,
            remainingDays
          };
        }
      }
      
    } catch (error) {
      console.warn('리뷰노트 상세 페이지 추출 실패:', (error as Error).message);
    }
    
    return null;
  }
}

export class RevuExtractor extends BaseDateExtractor {
  extractFromListPage($: cheerio.CheerioAPI, $item: any): string | null {
    // Revu는 SPA라서 목록 페이지에서 추출이 어려울 수 있음
    const text = $item.text();
    
    const patterns = [
      /D-(\d+)/i,
      /(\d+)\s*일\s*남음/,
      /남은.*?(\d+)\s*일/,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const days = parseInt(match[1], 10);
        if (days > 0 && days <= 60) {
          return `D-${days}`;
        }
      }
    }
    
    return null;
  }
  
  async extractFromDetailPage(): Promise<DateInfo | null> {
    // Revu는 SPA 구조라서 일반 HTML fetch로는 제한적
    // 추후 Selenium/Playwright 연동 필요
    console.warn('Revu 상세 페이지 추출은 SPA 구조로 인해 제한적입니다.');
    return null;
  }
}

// 다층 날짜 추출 시스템
export class SafeDateExtractor {
  private extractors: Map<string, BaseDateExtractor> = new Map();
  
  constructor() {
    this.extractors.set('reviewplace.co.kr', new ReviewPlaceExtractor());
    this.extractors.set('reviewnote.co.kr', new ReviewNoteExtractor());
    this.extractors.set('revu.net', new RevuExtractor());
  }
  
  async extractDeadline(
    source: string, 
    $: cheerio.CheerioAPI, 
    $item: any,
    detailUrl?: string
  ): Promise<string> {
    const extractor = this.extractors.get(source);
    
    if (!extractor) {
      console.warn(`⚠️ ${source}에 대한 추출기가 없습니다. 기본값 적용`);
      return 'D-7';
    }
    
    try {
      // Level 1: 목록 페이지에서 추출
      let deadline = extractor.extractFromListPage($, $item);
      console.log(`Level 1 추출 결과 (${source}):`, deadline);
      
      // Level 2: 상세 페이지에서 추출 (목록에서 실패한 경우만)
      if (!deadline && detailUrl) {
        console.log(`Level 2 시도: ${detailUrl}`);
        const dateInfo = await extractor.extractFromDetailPage(detailUrl);
        if (dateInfo) {
          deadline = `D-${dateInfo.remainingDays}`;
          console.log(`Level 2 추출 성공:`, deadline);
        }
      }
      
      // Level 3: 기본값 적용 (절대 null 반환하지 않음)
      if (!deadline) {
        deadline = 'D-7';
        console.log(`Level 3 기본값 적용: ${deadline}`);
      }
      
      return deadline;
      
    } catch (error) {
      console.error(`날짜 추출 중 오류 (${source}):`, (error as Error).message);
      return 'D-7'; // 오류 발생 시에도 기본값 반환
    }
  }
}