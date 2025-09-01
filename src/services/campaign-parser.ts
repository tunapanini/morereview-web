// 통합 캠페인 파싱 유틸리티 (중복 로직 제거)

import * as cheerio from 'cheerio';
import { SimpleCampaign } from '@/types/simple-crawler';
import { UniversalDateExtractor } from './universal-date-extractor';

export interface ParsingConfig {
  source: string;
  itemSelectors: string[];
  titleSelectors: string[];
  rewardPattern: RegExp;
  urlPattern: RegExp;
  baseUrl: string;
  minReward?: number;
  allowZeroReward?: boolean;
}

export class CampaignParser {
  private dateExtractor = new UniversalDateExtractor();

  // 통합 파싱 메서드
  async parseWithConfig(
    $: cheerio.CheerioAPI,
    config: ParsingConfig
  ): Promise<SimpleCampaign[]> {
    const campaigns: SimpleCampaign[] = [];
    
    // 설정에 따라 아이템 찾기
    let items: any = null;
    for (const selector of config.itemSelectors) {
      const found = $(selector);
      if (found.length > 0) {
        items = found;
        break;
      }
    }

    if (!items || items.length === 0) {
      console.warn(`⚠️ ${config.source}: 아이템을 찾을 수 없음`);
      return campaigns;
    }

    console.warn(`📄 ${config.source} ${items.length}개 아이템 발견`);

    for (let i = 0; i < items.length; i++) {
      try {
        const element = items[i];
        const $item = $(element);
        
        // 제목 추출
        const title = this.extractTitle($item, config.titleSelectors);
        if (!title || title.length < 3) {
          continue;
        }

        // URL 추출 및 검증
        const fullDetailUrl = this.extractUrl($item, config);
        if (!fullDetailUrl || !config.urlPattern.test(fullDetailUrl)) {
          continue;
        }

        // 일반 페이지 필터링
        if (this.shouldSkipPage(fullDetailUrl, title, $item.text())) {
          continue;
        }

        // 리워드 및 제공내역 텍스트 추출
        const rewardInfo = this.extractRewardAndDescription($item.text(), config);

        // 날짜 추출 (기존 방식 - 호환성)
        const deadline = await this.dateExtractor.extractDeadline(
          config.source,
          $,
          $item,
          fullDetailUrl
        );

        // 실제 마감일 추출 (새로운 방식)
        const deadlineDate = await this.dateExtractor.extractDeadlineDate(
          config.source,
          $,
          $item,
          fullDetailUrl
        );

        // 최종 검증
        if (this.isValidCampaign(title, rewardInfo.reward, deadline, config)) {
          campaigns.push({
            title,
            reward: rewardInfo.reward,
            deadline,
            deadlineDate,
            detailUrl: fullDetailUrl,
            source: config.source,
            description: rewardInfo.description
          });

          if (i < 3) {
            console.warn(`✅ ${config.source} 캠페인 ${i + 1}: ${title.substring(0, 30)}..., 마감: ${deadline}, 보상: ${rewardInfo.reward}`);
          }
        }

      } catch (error) {
        console.warn(`${config.source} 파싱 에러 (아이템 ${i + 1}):`, (error as Error).message);
      }
    }

    return campaigns;
  }

  private extractTitle($item: any, titleSelectors: string[]): string {
    for (const selector of titleSelectors) {
      const title = $item.find(selector).first().text().trim();
      if (title && title.length > 0) {
        return title;
      }
    }
    return '';
  }

  private extractUrl($item: any, config: ParsingConfig): string {
    const detailUrl = $item.attr('href');
    if (!detailUrl) return '';

    return detailUrl.startsWith('/') 
      ? `${config.baseUrl}${detailUrl}` 
      : detailUrl;
  }

  private extractReward(text: string, config: ParsingConfig): number {
    const rewardMatch = text.match(config.rewardPattern);
    return rewardMatch ? parseInt(rewardMatch[1].replace(/,/g, ''), 10) : 0;
  }

  private extractRewardAndDescription(text: string, config: ParsingConfig): { reward: number; description?: string } {
    // 리뷰플레이스의 제공내역 패턴 추출
    if (config.source === 'reviewplace.co.kr') {
      // "제공내역" 섹션 찾기
      const rewardSectionMatch = text.match(/제공내역[:\s]*([^\n]+)/);
      let description = rewardSectionMatch ? rewardSectionMatch[1].trim() : undefined;
      
      // 포인트 추출 (P만 허용, "포" 제외)
      const rewardMatch = text.match(config.rewardPattern);
      const reward = rewardMatch ? parseInt(rewardMatch[1].replace(/,/g, ''), 10) : 0;
      
      // 포인트가 포함된 description에서 포인트 부분 제거
      if (description && reward > 0) {
        description = description.replace(/\d{1,3}(?:,\d{3})*\s*P/g, '').trim();
        if (description.length === 0) {
          description = undefined;
        }
      }
      
      return { reward, description };
    }
    
    // 다른 소스는 기존 로직 유지
    const reward = this.extractReward(text, config);
    return { reward, description: undefined };
  }

  private shouldSkipPage(url: string, title: string, text: string): boolean {
    // 일반 페이지 URL 패턴
    const excludedUrlPatterns = [
      '/brandzone/', '/brands/', '/company/', '/about/', '/faq',
      '/guide', '/policy', '/terms', '/mypage', '/login', 
      '/signup', '/search', '/notice'
    ];

    if (excludedUrlPatterns.some(pattern => url.includes(pattern))) {
      console.warn(`⏭️ 일반 페이지 URL 제외: ${url}`);
      return true;
    }

    // 단순 매장명만 있고 캠페인 키워드가 없는 경우
    const invalidTitlePatterns = [
      /^[가-힣]+다방$/, /^[가-힣]+카페$/, /^[가-힣]+점$/, /^[가-힣]{2,6}$/
    ];

    const hasCampaignKeywords = text.includes('체험') || text.includes('캠페인') || 
                                text.includes('리뷰') || text.includes('모집') ||
                                text.includes('신청') || text.includes('참여') ||
                                text.includes('이벤트') || text.includes('혜택');

    for (const pattern of invalidTitlePatterns) {
      if (pattern.test(title) && !hasCampaignKeywords) {
        console.warn(`⏭️ 일반 페이지 제외: ${title} (캠페인 키워드 없음)`);
        return true;
      }
    }

    return false;
  }

  private isValidCampaign(title: string, reward: number, deadline: string, config: ParsingConfig): boolean {
    if (!title || title.length < 3) return false;
    if (!deadline) return false;

    const minReward = config.minReward ?? 0;
    const allowZero = config.allowZeroReward ?? false;

    if (!allowZero && reward <= minReward) return false;

    return true;
  }

  // 소스별 설정 제공
  static getReviewPlaceConfig(): ParsingConfig {
    return {
      source: 'reviewplace.co.kr',
      itemSelectors: ['a[href*="/pr/?id="]'],
      titleSelectors: ['h3', '.title', 'p'],
      rewardPattern: /(\d{1,3}(?:,\d{3})*)\s*P/,
      urlPattern: /\/pr\/\?id=/,
      baseUrl: 'https://www.reviewplace.co.kr',
      minReward: 1
    };
  }

  static getReviewNoteConfig(): ParsingConfig {
    return {
      source: 'reviewnote.co.kr',
      itemSelectors: ['a[href*="/campaigns/"]', 'a[href*="/campaign/"]', '.campaign-item', '.list-item'],
      titleSelectors: ['h3', '.title', '.campaign-title', 'p'],
      rewardPattern: /(\d{1,3}(?:,\d{3})*)\s*[P포원]/,
      urlPattern: /\/campaign/,
      baseUrl: 'https://www.reviewnote.co.kr',
      allowZeroReward: true
    };
  }

  static getRevuConfig(): ParsingConfig {
    return {
      source: 'revu.net',
      itemSelectors: ['a[href*="/campaign/"]', '.campaign-card', '.product-item', '[data-campaign]'],
      titleSelectors: ['h3', '.title', '.product-name', '.campaign-title'],
      rewardPattern: /(\d{1,3}(?:,\d{3})*)\s*[P포원]/,
      urlPattern: /\/campaign/,
      baseUrl: 'https://www.revu.net',
      minReward: 1
    };
  }
}