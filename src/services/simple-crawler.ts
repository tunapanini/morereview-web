// 최소 리소스 리뷰플레이스 크롤러

import * as cheerio from 'cheerio';
import { fetchHTML, delay } from '@/utils/simple-http';
import { SimpleCampaign, CrawlResult, ValidationResult } from '@/types/simple-crawler';
import { SimpleDBSaver } from './simple-db-saver';
import { DataQualityMonitor } from './data-quality-monitor';
import { DynamicCrawler } from './dynamic-crawler';
import { CampaignParser } from './campaign-parser';

export class SimpleCrawler {
  private dbSaver = new SimpleDBSaver();
  private qualityMonitor = new DataQualityMonitor();
  private dynamicCrawler = new DynamicCrawler();
  private parser = new CampaignParser();

  async crawlReviewplace(category = '제품'): Promise<CrawlResult> {
    const startTime = Date.now();
    
    try {
      const url = `https://www.reviewplace.co.kr/pr/?ct1=${encodeURIComponent(category)}`;
      // console.log(`🕷️ 크롤링 시작: ${url}`);
      
      // HTML 가져오기
      const html = await fetchHTML(url);
      
      // 파싱 (null 방지 로직 포함)
      const campaigns = await this.parseHTML(html, 'reviewplace.co.kr');
      
      // 중복 제거
      const uniqueCampaigns = this.removeDuplicates(campaigns);
      
      // 🚨 품질 모니터링 및 검증 (통합)
      const validation = this.qualityMonitor.analyzeCampaigns(uniqueCampaigns);
      
      // 중요 알림만 체크
      const criticalAlerts = this.qualityMonitor.getCriticalAlerts();
      if (criticalAlerts.length > 0) {
        console.error('🚨 중요 품질 알림:');
        criticalAlerts.forEach(alert => {
          console.error(`[${alert.severity.toUpperCase()}] ${alert.message}`);
        });
      }
      
      // DB 저장 (실패해도 크롤링 결과는 반환)
      let savedCount = 0;
      try {
        savedCount = await this.dbSaver.saveCampaigns(uniqueCampaigns);
      } catch (dbError) {
        console.warn('⚠️ DB 저장 실패 (크롤링은 성공):', (dbError as Error).message);
      }
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        data: uniqueCampaigns,
        duration,
        saved: savedCount,
        validation
      };
      
    } catch (error) {
      console.error('❌ 크롤링 실패:', (error as Error).message);
      return {
        success: false,
        data: [],
        duration: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  // 🆕 ReviewNote 크롤러 (매장/방문형 캠페인 특화) - SPA 동적 크롤링
  async crawlReviewnote(): Promise<CrawlResult> {
    const startTime = Date.now();
    
    try {
      let campaigns: SimpleCampaign[] = [];
      
      // 1차 시도: Puppeteer 동적 크롤링 (SPA 지원)
      try {
        campaigns = await this.dynamicCrawler.crawlReviewNoteSPA();
        
      } catch (dynamicError) {
        console.warn(`⚠️ ReviewNote 동적 크롤링 실패, 정적 폴백 시도:`, (dynamicError as Error).message);
        
        // 2차 시도: 기존 정적 크롤링 폴백
        const url = `https://www.reviewnote.co.kr/campaigns`;
        const html = await fetchHTML(url);
        campaigns = await this.parseHTML(html, 'reviewnote.co.kr');
      }
      
      // 중복 제거
      const uniqueCampaigns = this.removeDuplicates(campaigns);
      
      // 🚨 품질 모니터링 및 검증 (통합)
      const validation = this.qualityMonitor.analyzeCampaigns(uniqueCampaigns);
      
      // 중요 알림만 체크
      const criticalAlerts = this.qualityMonitor.getCriticalAlerts();
      if (criticalAlerts.length > 0) {
        console.error('🚨 리뷰노트 중요 품질 알림:');
        criticalAlerts.forEach(alert => {
          console.error(`[${alert.severity.toUpperCase()}] ${alert.message}`);
        });
      }
      
      // DB 저장 (실패해도 크롤링 결과는 반환)
      let savedCount = 0;
      try {
        savedCount = await this.dbSaver.saveCampaigns(uniqueCampaigns);
      } catch (dbError) {
        console.warn('⚠️ 리뷰노트 DB 저장 실패 (크롤링은 성공):', (dbError as Error).message);
      }
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        data: uniqueCampaigns,
        duration,
        saved: savedCount,
        validation
      };
      
    } catch (error) {
      console.error('❌ 리뷰노트 크롤링 실패:', (error as Error).message);
      return {
        success: false,
        data: [],
        duration: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  // 🆕 Revu.net 크롤러 (SPA 구조 대응)
  async crawlRevu(category = '오늘오픈'): Promise<CrawlResult> {
    const startTime = Date.now();
    
    try {
      
      let campaigns: SimpleCampaign[] = [];
      
      // 1차 시도: Puppeteer 동적 크롤링
      try {
        
        campaigns = await this.dynamicCrawler.crawlRevuSPA();
        
        if (campaigns.length > 0) {
        } else {
          throw new Error('동적 크롤링 결과 없음');
        }
      } catch (dynamicError) {
        console.warn('⚠️ Revu 동적 크롤링 실패, 정적 크롤링으로 폴백:', (dynamicError as Error).message);
        
        // 2차 시도: 기존 정적 크롤링 폴백
        try {
          const url = `https://www.revu.net/category/${encodeURIComponent(category)}`;
          const html = await fetchHTML(url);
          campaigns = await this.parseHTML(html, 'revu.net');
        } catch (staticError) {
          console.error('❌ Revu 정적 폴백도 실패:', (staticError as Error).message);
          throw new Error(`동적/정적 크롤링 모두 실패: ${(dynamicError as Error).message}`);
        }
      }
      
      // 중복 제거
      const uniqueCampaigns = this.removeDuplicates(campaigns);
      
      // 🚨 품질 모니터링 및 검증 (통합)
      const validation = this.qualityMonitor.analyzeCampaigns(uniqueCampaigns);
      
      // 중요 알림 체크
      const criticalAlerts = this.qualityMonitor.getCriticalAlerts();
      if (criticalAlerts.length > 0) {
        console.error('🚨 Revu 중요 품질 알림:');
        criticalAlerts.forEach(alert => {
          console.error(`[${alert.severity.toUpperCase()}] ${alert.message}`);
        });
      }
      
      // DB 저장 (실패해도 크롤링 결과는 반환)
      let savedCount = 0;
      try {
        savedCount = await this.dbSaver.saveCampaigns(uniqueCampaigns);
      } catch (dbError) {
        console.warn('⚠️ Revu DB 저장 실패 (크롤링은 성공):', (dbError as Error).message);
      }
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        data: uniqueCampaigns,
        duration,
        saved: savedCount,
        validation
      };
      
    } catch (error) {
      console.error('❌ Revu 크롤링 실패:', (error as Error).message);
      return {
        success: false,
        data: [],
        duration: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  // 🆕 통합 크롤링 시스템 (모든 소스 크롤링)
  async crawlAllSources(): Promise<CrawlResult> {
    const startTime = Date.now();
    const allResults: CrawlResult[] = [];
    const totalCampaigns: SimpleCampaign[] = [];
    
    
    try {
      // 1. ReviewPlace 크롤링 (기존)
      const reviewplaceResult = await this.crawlReviewplace('제품');
      allResults.push(reviewplaceResult);
      if (reviewplaceResult.success) {
        totalCampaigns.push(...reviewplaceResult.data);
      }
      await delay(2000); // 2초 딜레이

      // 2. ReviewNote 크롤링 (신규)
      const reviewnoteResult = await this.crawlReviewnote();
      allResults.push(reviewnoteResult);
      if (reviewnoteResult.success) {
        totalCampaigns.push(...reviewnoteResult.data);
      }
      await delay(3000); // 3초 딜레이 (더 신중하게)

      // 3. Revu 크롤링 (신규)
      const revuResult = await this.crawlRevu('제품');
      allResults.push(revuResult);
      if (revuResult.success) {
        totalCampaigns.push(...revuResult.data);
      }

      // 전체 결과 통합
      const totalDuration = Date.now() - startTime;
      const successCount = allResults.filter(r => r.success).length;
      const totalSaved = allResults.reduce((sum, r) => sum + (r.saved || 0), 0);


      return {
        success: successCount > 0,
        data: totalCampaigns,
        duration: totalDuration,
        saved: totalSaved,
        validation: {
          valid: true,
          issues: [],
          warnings: [],
          totalProcessed: totalCampaigns.length,
          validCount: totalCampaigns.length
        }
      };

    } catch (error) {
      console.error('❌ 통합 크롤링 실패:', (error as Error).message);
      return {
        success: false,
        data: totalCampaigns, // 부분 성공한 데이터라도 반환
        duration: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }
  
  private async parseHTML(html: string, source: string): Promise<SimpleCampaign[]> {
    const $ = cheerio.load(html);
    
    
    // 통합 파서 사용
    let campaigns: SimpleCampaign[] = [];
    let config;
    
    switch (source) {
      case 'reviewplace.co.kr':
        config = CampaignParser.getReviewPlaceConfig();
        break;
      case 'reviewnote.co.kr':
        config = CampaignParser.getReviewNoteConfig();
        break;
      case 'revu.net':
        config = CampaignParser.getRevuConfig();
        break;
      default:
        console.warn(`⚠️ 지원하지 않는 소스: ${source}, ReviewPlace 파서 사용`);
        config = CampaignParser.getReviewPlaceConfig();
    }
    
    campaigns = await this.parser.parseWithConfig($, config);
    
    return campaigns;
  }



  
  private removeDuplicates(campaigns: SimpleCampaign[]): SimpleCampaign[] {
    const seen = new Set<string>();
    return campaigns.filter(campaign => {
      const key = `${campaign.title}-${campaign.reward}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  
  private validateCampaigns(campaigns: SimpleCampaign[]): ValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    let validCount = 0;
    
    campaigns.forEach((campaign, index) => {
      // 필수 필드 검증
      if (!campaign.title || campaign.title.length < 3) {
        issues.push(`Campaign ${index}: title이 너무 짧음 (${campaign.title})`);
        return;
      }
      
      if (!campaign.deadline) {
        issues.push(`Campaign ${index}: deadline이 비어있음`);
        return;
      }
      
      if (campaign.reward <= 0) {
        issues.push(`Campaign ${index}: reward가 0 이하 (${campaign.reward})`);
        return;
      }
      
      // 날짜 형식 검증
      if (!campaign.deadline.match(/^D-\d+$/)) {
        warnings.push(`Campaign ${index}: 비정형 deadline 형식 (${campaign.deadline})`);
      }
      
      // 합리적 범위 검증
      const daysMatch = campaign.deadline.match(/D-(\d+)/);
      if (daysMatch) {
        const days = parseInt(daysMatch[1], 10);
        if (days > 365) {
          warnings.push(`Campaign ${index}: 과도하게 긴 마감 기간 (${days}일)`);
        }
        if (days <= 0) {
          issues.push(`Campaign ${index}: 유효하지 않은 마감 기간 (${days}일)`);
          return;
        }
      }
      
      validCount++;
    });
    
    const result: ValidationResult = {
      valid: issues.length === 0,
      issues,
      warnings,
      totalProcessed: campaigns.length,
      validCount
    };
    
    if (issues.length > 0) {
      console.error('🚨 데이터 품질 이슈 발견:', issues.slice(0, 5));
    }
    
    if (warnings.length > 0) {
      console.warn('⚠️ 데이터 품질 경고:', warnings.slice(0, 3));
    }
    
    return result;
  }
  
  // 리소스 정리
  async cleanup(): Promise<void> {
    if (this.dynamicCrawler) {
      await this.dynamicCrawler.close();
    }
  }
}