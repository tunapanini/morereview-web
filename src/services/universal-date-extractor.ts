// 통합된 범용 날짜 추출기 (아키텍처 단순화)

import * as cheerio from 'cheerio';
import { fetchHTML } from '@/utils/simple-http';

export interface DateInfo {
  deadline: Date; // 실제 마감일
  method: 'listPage' | 'detailPage' | 'fallback';
  source: string;
}

export class UniversalDateExtractor {
  async extractDeadline(
    source: string,
    $: cheerio.CheerioAPI,
    $item: any,
    detailUrl?: string
  ): Promise<string> {
    try {
      // Level 1: 목록 페이지에서 추출
      const listPageResult = this.extractFromListPage(source, $item);
      if (listPageResult) {
        return listPageResult;
      }

      // Level 2: 상세 페이지에서 추출 (목록에서 실패한 경우만)
      if (detailUrl) {
        const detailPageResult = await this.extractFromDetailPage(source, detailUrl);
        if (detailPageResult) {
          const remainingDays = Math.ceil((detailPageResult.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return `D-${Math.max(0, remainingDays)}`;
        }
      }

      // Level 3: 소스별 합리적 기본값
      return this.getDefaultDeadline(source);
      
    } catch (error) {
      console.error(`날짜 추출 중 오류 (${source}):`, (error as Error).message);
      return this.getDefaultDeadline(source);
    }
  }

  // 새로운 메서드: 실제 마감일(Date)을 추출
  async extractDeadlineDate(
    source: string,
    $: cheerio.CheerioAPI,
    $item: any,
    detailUrl?: string
  ): Promise<Date> {
    try {
      // Level 1: 목록 페이지에서 날짜 추출
      const listPageResult = this.extractDateFromListPage(source, $item);
      if (listPageResult) {
        return listPageResult;
      }

      // Level 2: 상세 페이지에서 추출 (목록에서 실패한 경우만)
      if (detailUrl) {
        const detailPageResult = await this.extractFromDetailPage(source, detailUrl);
        if (detailPageResult?.deadline) {
          return detailPageResult.deadline;
        }
      }

      // Level 3: 소스별 합리적 기본값 (현재 시점 + 기본 일수)
      return this.getDefaultDeadlineDate(source);
      
    } catch (error) {
      console.error(`마감일 추출 중 오류 (${source}):`, (error as Error).message);
      return this.getDefaultDeadlineDate(source);
    }
  }

  private extractFromListPage(source: string, $item: any): string | null {
    const text = $item.text();
    
    // 통합된 날짜 패턴 (모든 소스 지원)
    const patterns = [
      /[_\s]*D[_\s]*-[_\s]*(\d+)/i,      // "_D_ - 6" 형태 (리뷰플레이스)
      /D-(\d+)/i,                        // 기본 "D-6" 형태
      /(\d+)\s*일\s*남음/,               // "3일 남음"
      /남은\s*(\d+)\s*일/,               // "남은 5일"  
      /마감\s*(\d+)\s*일\s*전/,          // "마감 2일 전"
      /(\d{1,2})\.(\d{1,2})\s*마감/,     // "8.26 마감" (리뷰노트)
      /(\d{1,2})\/(\d{1,2})\s*마감/,     // "8/26 마감"
      /(\d{1,2})-(\d{1,2})\s*마감/,      // "8-26 마감"
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[1] && !match[2]) {
          // D-X 또는 X일 남음 형태
          const days = parseInt(match[1], 10);
          if (days > 0 && days <= 365) {
            return `D-${days}`;
          }
        } else if (match[1] && match[2]) {
          // MM.DD 마감 형태
          const month = parseInt(match[1], 10);
          const day = parseInt(match[2], 10);
          const remainingDays = this.calculateDaysFromDate(month, day);
          if (remainingDays > 0) {
            return `D-${remainingDays}`;
          }
        }
      }
    }
    
    return null;
  }

  private async extractFromDetailPage(source: string, detailUrl: string): Promise<DateInfo | null> {
    try {
      const html = await fetchHTML(detailUrl);
      const $ = cheerio.load(html);
      
      // 소스별 특화 셀렉터들
      const selectors = this.getDetailPageSelectors(source);
      
      for (const selector of selectors) {
        const elements = $(selector);
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          const text = $(element).text();
          
          // 실제 마감일 추출 시도
          const actualDeadline = this.extractActualDateFromText(text);
          if (actualDeadline) {
            return {
              deadline: actualDeadline,
              method: 'detailPage',
              source
            };
          }
          
          // 기존 방식 (D-X 형태) 폴백
          const deadline = this.extractFromText(text);
          if (deadline) {
            const days = this.parseDeadlineToDays(deadline);
            if (days > 0) {
              const calculatedDeadline = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
              return {
                deadline: calculatedDeadline,
                method: 'detailPage',
                source
              };
            }
          }
        }
      }
      
      return null;
      
    } catch (error) {
      console.warn(`상세 페이지 추출 실패 (${source}):`, (error as Error).message);
      return null;
    }
  }

  private getDetailPageSelectors(source: string): string[] {
    const commonSelectors = [
      '.campaign-info', '.detail-info', '.info-section',
      '.date-info', '.deadline', '.period',
      'p', 'div', 'span', 'strong'
    ];

    switch (source) {
      case 'reviewplace.co.kr':
        return ['.campaign-detail', '.pr-info', ...commonSelectors];
      case 'reviewnote.co.kr':
        return ['.campaign-content', '.store-info', ...commonSelectors];
      case 'revu.net':
        return ['.product-info', '.campaign-meta', ...commonSelectors];
      default:
        return commonSelectors;
    }
  }

  private extractFromText(text: string): string | null {
    const patterns = [
      /D-(\d+)/i,
      /(\d+)\s*일\s*남음/,
      /마감\s*(\d+)\s*일/,
      /(\d{1,2})\.(\d{1,2})\s*마감/,
      /(\d{1,2})\/(\d{1,2})\s*마감/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  // 텍스트에서 실제 날짜를 추출 (YYYY-MM-DD, MM.DD, MM/DD 등)
  private extractActualDateFromText(text: string): Date | null {
    const patterns = [
      // YYYY-MM-DD 형태
      /(\d{4})[-.\/](\d{1,2})[-.\/](\d{1,2})/,
      // MM.DD 마감, MM/DD 마감 형태 
      /(\d{1,2})[.\/](\d{1,2})\s*마감/,
      // MM월 DD일 형태
      /(\d{1,2})월\s*(\d{1,2})일/,
      // DD일 마감 (현재 월 가정)
      /(\d{1,2})일\s*마감/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[3]) {
          // YYYY-MM-DD 형태
          const year = parseInt(match[1], 10);
          const month = parseInt(match[2], 10);
          const day = parseInt(match[3], 10);
          const date = new Date(year, month - 1, day, 23, 59, 59);
          if (this.isValidDate(date) && date > new Date()) {
            return date;
          }
        } else if (match[2]) {
          // MM.DD 또는 MM월 DD일 형태
          const month = parseInt(match[1], 10);
          const day = parseInt(match[2], 10);
          const date = this.parseToActualDate(month, day);
          if (date) {
            return date;
          }
        } else if (match[1]) {
          // DD일 마감 형태 (현재 월 가정)
          const day = parseInt(match[1], 10);
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          let date = new Date(currentYear, currentMonth, day, 23, 59, 59);
          
          // 날짜가 과거라면 다음 달로 설정
          if (date <= now) {
            date = new Date(currentYear, currentMonth + 1, day, 23, 59, 59);
            // 다음 달이 다음 해가 되는 경우
            if (date.getMonth() === 0 && currentMonth === 11) {
              date = new Date(currentYear + 1, 0, day, 23, 59, 59);
            }
          }
          
          if (this.isValidDate(date)) {
            return date;
          }
        }
      }
    }
    
    return null;
  }

  // Date 객체가 유효한지 확인
  private isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  private calculateDaysFromDate(month: number, day: number): number {
    const currentYear = new Date().getFullYear();
    const targetDate = new Date(currentYear, month - 1, day);
    
    // 날짜가 과거라면 다음 해로 가정
    if (targetDate < new Date()) {
      targetDate.setFullYear(currentYear + 1);
    }
    
    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(diffDays, 0);
  }

  private parseDeadlineToDays(deadline: string): number {
    const match = deadline.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  private getDefaultDeadline(source: string): string {
    // 소스별 합리적 기본값
    switch (source) {
      case 'reviewnote.co.kr':
        return 'D-14'; // 리뷰노트는 보통 더 긴 기간
      case 'revu.net':
        return 'D-10'; // Revu는 중간 정도
      case 'reviewplace.co.kr':
      default:
        return 'D-7';  // 기본값
    }
  }

  // Date 형태로 목록 페이지에서 추출
  private extractDateFromListPage(source: string, $item: any): Date | null {
    const text = $item.text();
    const now = new Date();
    
    // 통합된 날짜 패턴 (모든 소스 지원)
    const patterns = [
      /[_\s]*D[_\s]*-[_\s]*(\d+)/i,      // "_D_ - 6" 형태 (리뷰플레이스)
      /D-(\d+)/i,                        // 기본 "D-6" 형태
      /(\d+)\s*일\s*남음/,               // "3일 남음"
      /남은\s*(\d+)\s*일/,               // "남은 5일"  
      /마감\s*(\d+)\s*일\s*전/,          // "마감 2일 전"
      /(\d{1,2})\.(\d{1,2})\s*마감/,     // "8.26 마감" (리뷰노트)
      /(\d{1,2})\/(\d{1,2})\s*마감/,     // "8/26 마감"
      /(\d{1,2})-(\d{1,2})\s*마감/,      // "8-26 마감"
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[1] && !match[2]) {
          // D-X 또는 X일 남음 형태
          const days = parseInt(match[1], 10);
          if (days > 0 && days <= 365) {
            const deadline = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
            return deadline;
          }
        } else if (match[1] && match[2]) {
          // MM.DD 마감 형태 - 실제 날짜로 변환
          const month = parseInt(match[1], 10);
          const day = parseInt(match[2], 10);
          const deadline = this.parseToActualDate(month, day);
          if (deadline && deadline > now) {
            return deadline;
          }
        }
      }
    }
    
    return null;
  }

  // MM.DD를 실제 Date 객체로 변환
  private parseToActualDate(month: number, day: number): Date | null {
    const currentYear = new Date().getFullYear();
    let targetDate = new Date(currentYear, month - 1, day, 23, 59, 59); // 해당일 23:59:59로 설정
    
    // 날짜가 과거라면 다음 해로 가정
    if (targetDate < new Date()) {
      targetDate = new Date(currentYear + 1, month - 1, day, 23, 59, 59);
    }
    
    // 유효한 날짜인지 확인
    if (targetDate.getMonth() !== month - 1) {
      return null; // 유효하지 않은 날짜 (예: 2/30)
    }
    
    return targetDate;
  }

  // 소스별 기본 마감일(Date) 반환
  private getDefaultDeadlineDate(source: string): Date {
    const now = new Date();
    let days: number;
    
    switch (source) {
      case 'reviewnote.co.kr':
        days = 14; // 리뷰노트는 보통 더 긴 기간
        break;
      case 'revu.net':
        days = 10; // Revu는 중간 정도
        break;
      case 'reviewplace.co.kr':
      default:
        days = 7;  // 기본값
        break;
    }
    
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }
}