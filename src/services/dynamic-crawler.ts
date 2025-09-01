import { SimpleCampaign } from '@/types/simple-crawler';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Browser = any;
type Page = any;

export class DynamicCrawler {
  private browser: Browser | null = null;
  
  async getBrowser(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    if (process.env.NODE_ENV === 'production') {
      const chromium = await import('@sparticuz/chromium');
      const puppeteer = await import('puppeteer-core');
      
      this.browser = await puppeteer.default.launch({
        args: [
          ...chromium.default.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ],
        defaultViewport: chromium.default.defaultViewport,
        executablePath: await chromium.default.executablePath(),
        headless: chromium.default.headless as unknown as boolean,
      });
    } else {
      const puppeteer = await import('puppeteer');
      this.browser = await puppeteer.default.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });
    }

    return this.browser;
  }

  async crawlRevuSPA(): Promise<SimpleCampaign[]> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    
    try {
      // User-Agent 설정 (봇 차단 회피)
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
      
      // 헤더 설정
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      });

      await page.setViewport({ width: 1200, height: 800 });

      // Revu.net 메인 페이지 접근 (간소화)
      // TODO: 크롤링 대상 URL 재검토
      const url = 'https://www.revu.net/category/%EC%98%A4%EB%8A%98%EC%98%A4%ED%94%88';
      // const url = `https://www.revu.net/category/제품`;
      // const url = `https://www.revu.net/category/지역`;
      console.warn(`🌐 Revu SPA 크롤링 시작: ${url}`);
      
      try {
        await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 20000 
        });
        
        console.warn(`📄 페이지 로딩 완료, DOM 분석 시작...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5초 대기
        
        // 페이지 내용 분석
        const pageInfo = await page.evaluate(() => {
          return {
            title: document.title,
            html: document.documentElement.outerHTML.substring(0, 1000),
            bodyText: document.body?.textContent?.substring(0, 500) || '',
            elementCount: document.querySelectorAll('*').length
          };
        });
        
        console.warn(`📊 페이지 분석: 제목="${pageInfo.title}", 요소수=${pageInfo.elementCount}`);
        console.warn(`📝 페이지 내용 샘플: ${pageInfo.bodyText.substring(0, 100)}...`);
        
        const campaigns = await this.extractCampaigns(page);
        
        console.warn(`✅ Revu SPA 파싱 완료: ${campaigns.length}개 캠페인`);
        return campaigns;
        
      } catch (urlError) {
        console.warn(`⚠️ Revu URL 접근 실패: ${(urlError as Error).message}`);
        return [];
      }

    } catch (error) {
      console.error('❌ Revu SPA 크롤링 에러:', (error as Error).message);
      return [];
    } finally {
      await page.close();
    }
  }

  private async extractCampaigns(page: Page): Promise<any[]> {
    return await page.evaluate(() => {
      console.warn('🔍 Revu DOM 구조 분석 중...');
      
      // 더 포괄적인 셀렉터로 모든 요소 탐색
      const allElements = document.querySelectorAll('*');
      let foundElements = 0;
      
      // 캠페인 관련 텍스트가 있는 요소 찾기
      const potentialItems: Element[] = [];
      
      allElements.forEach(el => {
        const text = el.textContent || '';
        if (text.includes('캠페인') || 
            text.includes('체험') || 
            text.includes('리뷰') ||
            text.includes('P') ||
            text.includes('포인트') ||
            text.includes('D-') ||
            el.tagName === 'A') {
          foundElements++;
          if (foundElements < 20) { // 너무 많은 로그 방지
            potentialItems.push(el);
          }
        }
      });
      
      console.warn(`🔍 잠재적 캠페인 요소: ${foundElements}개 발견`);
      
      const items = document.querySelectorAll(
        'a, .item, .card, .campaign, .product, [data-item], div, span, li'
      );
      
      const results: any[] = [];
      
      items.forEach((item, index) => {
        try {
          const text = item.textContent?.trim() || '';
          
          if (text.length < 5) return;
          
          const titleEl = item.querySelector('h1, h2, h3, h4, .title, .name') || item;
          const title = titleEl?.textContent?.trim() || text;
          
          if (!title || title.length < 3) return;
          
          const rewardText = text.match(/(\d{1,3}(?:,\d{3})*)\s*[P포원]/);
          const reward = rewardText ? parseInt(rewardText[1].replace(/,/g, ''), 10) : 0;
          
          // 더 정확한 링크 추출
          const linkEl = item.querySelector('a') || (item.tagName === 'A' ? item : null);
          let detailUrl = '';
          
          if (linkEl) {
            const href = linkEl.getAttribute('href');
            if (href && href.length > 1 && href !== '/') {
              if (href.startsWith('/')) {
                detailUrl = `https://www.revu.net${href}`;
              } else if (href.startsWith('http')) {
                detailUrl = href;
              }
            }
          }
          
          // URL이 없거나 부정확하면 제목 기반으로 고유성 확보
          if (!detailUrl || detailUrl === 'https://www.revu.net/') {
            detailUrl = `https://www.revu.net/campaign/${encodeURIComponent(title.substring(0, 20))}-${Date.now()}`;
          }
          
          // 일반 페이지 URL 필터링 강화
          const excludedUrlPatterns = [
            '/brandzone/',      // 브랜드존 페이지
            '/brands/',         // 브랜드 페이지
            '/company/',        // 회사 소개 페이지
            '/about/',          // 회사 정보 페이지
            '/faq',            // FAQ 페이지
            '/guide',          // 가이드 페이지
            '/policy',         // 정책 페이지
            '/terms',          // 약관 페이지
            '/mypage',         // 마이페이지
            '/login',          // 로그인 페이지
            '/signup',         // 회원가입 페이지
            '/search',         // 검색 페이지
            '/notice',         // 공지사항
          ];
          
          const shouldExclude = excludedUrlPatterns.some(pattern => 
            detailUrl?.includes(pattern)
          );
          
          if (shouldExclude) {
            console.warn(`⏭️ 일반 페이지 URL 제외: ${detailUrl}`);
            return;
          }
          
          let deadline = '';
          const dayMatch = text.match(/D-(\d+)|(\d+)\s*일/);
          if (dayMatch) {
            deadline = dayMatch[1] ? `D-${dayMatch[1]}` : `D-${dayMatch[2]}`;
          } else {
            deadline = 'D-30';
          }
          
          if (title.length > 5 && 
              (reward > 0 || text.includes('체험') || text.includes('캠페인'))) {
            results.push({
              title: title.substring(0, 100),
              reward: reward || 0,
              deadline,
              detailUrl,
              source: 'revu.net'
            });
            
            if (index < 5) {
              console.warn(`✅ Revu SPA 캠페인 ${index + 1}: ${title.substring(0, 30)}..., 마감: ${deadline}, 포인트: ${reward}`);
            }
          }
        } catch {
          // 브라우저 내 에러는 무시
        }
      });
      
      console.warn(`🔍 총 ${results.length}개 캠페인 추출 완료`);
      return results;
    });
  }


  private async scrollToLoadMore(page: Page): Promise<void> {
    try {
      await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const maxScrolls = 10;
          let scrollCount = 0;
          
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            scrollCount++;
            
            if (totalHeight >= scrollHeight || scrollCount >= maxScrolls) {
              clearInterval(timer);
              resolve();
            }
          }, 200);
        });
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch {
      console.warn('⚠️ Revu SPA 스크롤 로딩 실패');
    }
  }

  async crawlReviewNoteSPA(): Promise<SimpleCampaign[]> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    
    try {
      // User-Agent 설정
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
      
      // 헤더 설정
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      });

      await page.setViewport({ width: 1200, height: 800 });

      // ReviewNote 메인 페이지 접근
      // TODO: 크롤링 대상 URL 재검토
      const url = `https://www.reviewnote.co.kr/campaigns`;
      console.warn(`🌐 ReviewNote SPA 크롤링 시작: ${url}`);
      
      try {
        await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 20000 
        });
        
        console.warn(`📄 ReviewNote 페이지 로딩 완료, DOM 분석 시작...`);
        
        // 더 적극적인 로딩 대기
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10초 대기
        
        // 스크롤해서 더 많은 캠페인 로드
        await this.scrollToLoadMore(page);
        
        // 추가 대기 (스크롤 후 콘텐츠 로딩)
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5초 추가 대기
        
        // 페이지 내용 분석
        const pageInfo = await page.evaluate(() => {
          return {
            title: document.title,
            bodyText: document.body?.textContent?.substring(0, 500) || '',
            elementCount: document.querySelectorAll('*').length
          };
        });
        
        console.warn(`📊 ReviewNote 페이지 분석: 제목="${pageInfo.title}", 요소수=${pageInfo.elementCount}`);
        
        const campaigns = await this.extractReviewNoteCampaigns(page);
        
        console.warn(`✅ ReviewNote SPA 파싱 완료: ${campaigns.length}개 캠페인`);
        return campaigns;
        
      } catch (urlError) {
        console.warn(`⚠️ ReviewNote URL 접근 실패: ${(urlError as Error).message}`);
        return [];
      }

    } catch (error) {
      console.error('❌ ReviewNote SPA 크롤링 에러:', (error as Error).message);
      return [];
    } finally {
      await page.close();
    }
  }

  private async extractReviewNoteCampaigns(page: Page): Promise<any[]> {
    return await page.evaluate(() => {
      console.warn('🔍 ReviewNote DOM 구조 분석 중...');
      
      // ReviewNote 특화 셀렉터들 (캠페인 전용으로 제한)
      const potentialSelectors = [
        'a[href*="/campaigns/"]',  // 캠페인 링크만
        'a[href*="/campaign/"]',   // 단수형 가능성  
        'a[href*="campaignid"]',   // campaignid 파라미터
        '.campaign-item',
        '.campaign-card',
        '[data-campaign-id]',
        'div[class*="campaign"]'
      ];
      
      let bestSelector = '';
      let maxItems = 0;
      
      // 가장 많은 아이템을 찾는 셀렉터 검색
      for (const selector of potentialSelectors) {
        const items = document.querySelectorAll(selector);
        if (items.length > maxItems) {
          maxItems = items.length;
          bestSelector = selector;
        }
        console.warn(`🔍 ${selector}: ${items.length}개 아이템`);
      }
      
      console.warn(`🎯 최적 셀렉터 선택: ${bestSelector} (${maxItems}개)`);
      
      const items = document.querySelectorAll(bestSelector);
      const results: any[] = [];
      
      items.forEach((item, index) => {
        try {
          const text = item.textContent?.trim() || '';
          
          if (text.length < 10) return; // 너무 짧은 텍스트 제외
          
          // 링크 유효성 먼저 확인 (캠페인 페이지가 아니면 제외)
          const linkEl = item.querySelector('a') || (item.tagName === 'A' ? item : null);
          const href = linkEl?.getAttribute('href');
          
          // 캠페인 URL이 아니면 제외
          if (!href || (!href.includes('/campaigns/') && !href.includes('/campaign/'))) {
            return;
          }
          
          // 제목 추출 (다양한 방법 시도)
          let title = '';
          const titleSelectors = ['h1', 'h2', 'h3', 'h4', '.title', '.name', '.campaign-title', 'strong'];
          for (const sel of titleSelectors) {
            const titleEl = item.querySelector(sel);
            if (titleEl?.textContent?.trim()) {
              title = titleEl.textContent.trim();
              break;
            }
          }
          
          // 제목을 찾지 못한 경우 텍스트에서 추출 시도
          if (!title) {
            const lines = text.split('\n')
              .map(line => line.trim())
              .filter(line => 
                line.length > 5 && 
                !line.includes('신청') && 
                !line.includes('일 남음') &&
                !line.includes('D-') &&
                !line.match(/^\d+$/) // 숫자만 있는 라인 제외
              );
            if (lines.length > 0) {
              title = lines[0].trim();
            }
          }
          
          if (!title || title.length < 5) return; // 최소 길이 늘림
          
          // 일반 페이지 필터링 (매장명이지만 실제 캠페인이 아닌 경우)
          const invalidTitlePatterns = [
            /^[가-힣]+다방$/,       // "케익다방" 같은 단순 매장명만
            /^[가-힣]+카페$/,       // "스타벅스" 같은 단순 카페명만
            /^[가-힣]+점$/,         // "강남점" 같은 단순 지점명만
            /^[가-힣]{2,6}$/,       // 2-6글자 단순 이름만
          ];
          
          // 단순 매장명만 있고 캠페인 관련 키워드가 없으면 제외
          const hasCampaignKeywords = text.includes('체험') || text.includes('캠페인') || 
                                      text.includes('리뷰') || text.includes('모집') ||
                                      text.includes('신청') || text.includes('참여') ||
                                      text.includes('이벤트') || text.includes('혜택');
          
          for (const pattern of invalidTitlePatterns) {
            if (pattern.test(title) && !hasCampaignKeywords) {
              console.warn(`⏭️ 일반 페이지 제외: ${title} (캠페인 키워드 없음)`);
              return;
            }
          }
          
          // 보상 추출
          const rewardText = text.match(/(\d{1,3}(?:,\d{3})*)\s*[P포원]/);
          const reward = rewardText ? parseInt(rewardText[1].replace(/,/g, ''), 10) : 0;
          
          // 상세 URL 추출 (이미 위에서 검증됨)
          const detailUrl = href?.startsWith('/') 
            ? `https://www.reviewnote.co.kr${href}` 
            : href;
          
          // 날짜 정보 추출
          let deadline = '';
          const datePatterns = [
            /D-(\d+)/i,
            /(\d+)\s*일\s*남음/,
            /남은\s*(\d+)\s*일/,
            /(\d{1,2})\/(\d{1,2})\s*~\s*(\d{1,2})\/(\d{1,2})/,  // 8/26 ~ 9/5 형태
            /(\d{1,2})\.(\d{1,2})\s*~\s*(\d{1,2})\.(\d{1,2})/   // 8.26 ~ 9.5 형태
          ];
          
          for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
              if (match[1] && !match[3]) {
                // D-X 또는 X일 남음 형태
                deadline = `D-${match[1]}`;
              } else if (match[3] && match[4]) {
                // 날짜 범위 형태 - 종료일 기준으로 계산
                const endMonth = parseInt(match[3], 10);
                const endDay = parseInt(match[4], 10);
                const currentYear = new Date().getFullYear();
                const endDate = new Date(currentYear, endMonth - 1, endDay);
                
                if (endDate < new Date()) {
                  endDate.setFullYear(currentYear + 1);
                }
                
                const diffTime = endDate.getTime() - new Date().getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                deadline = `D-${Math.max(diffDays, 1)}`;
              }
              break;
            }
          }
          
          if (!deadline) deadline = 'D-30'; // 기본값
          
          // ReviewNote 캠페인 유효성 검증 강화
          const isValidCampaign = title.length > 5 && 
            (hasCampaignKeywords || reward > 0 || text.includes('체험') || text.includes('방문'));
          
          if (isValidCampaign) {
            results.push({
              title: title.substring(0, 100),
              reward: reward || 0,
              deadline,
              detailUrl,
              source: 'reviewnote.co.kr'
            });
            
            if (index < 5) {
              console.warn(`✅ ReviewNote SPA 캠페인 ${index + 1}: ${title.substring(0, 30)}..., 마감: ${deadline}, 보상: ${reward}`);
            }
          } else {
            console.warn(`⏭️ ReviewNote 유효하지 않은 캠페인 제외: ${title}`);
          }
        } catch {
          // 브라우저 내 에러는 무시
        }
      });
      
      console.warn(`🔍 ReviewNote 총 ${results.length}개 캠페인 추출 완료`);
      return results;
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}