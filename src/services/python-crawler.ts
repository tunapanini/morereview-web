/**
 * Python 스크래핑 시스템 subprocess 호출 서비스
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

interface PythonScrapeResult {
  success: boolean;
  data: unknown[];
  count: number;
  summary?: {
    total_found: number;
    total_saved: number;
    duration_ms: number;
  };
  source: string;
  timestamp: string;
  error?: string;
}

export class PythonScraperService {
  private readonly scrapingPath: string;

  constructor() {
    this.scrapingPath = path.join(process.cwd(), '..', 'scraping');
  }

  /**
   * Python 스크래핑 실행 (저장 포함)
   */
  async scrapeWithSave(): Promise<PythonScrapeResult> {
    const startTime = Date.now();
    
    try {
      console.warn('🐍 Python 스크래핑 시작 (Supabase 저장)');
      
      // Poetry 환경에서 Python 스크립트 실행 (로그 숨김)
      const command = `cd "${this.scrapingPath}" && poetry run python -c "
import sys, os, json, asyncio, logging
sys.path.insert(0, '.')

# 로그 레벨을 ERROR로 설정하여 INFO 로그 숨김
logging.getLogger().setLevel(logging.ERROR)

async def main():
    try:
        from database.supabase_client import SupabaseClient
        from models import CampaignData
        from scrapers.reviewplace import ReviewPlaceScraper
        
        # ReviewPlace 스크래핑
        async with ReviewPlaceScraper() as scraper:
            result = await scraper.scrape('제품')
            campaigns = result.campaigns
        
        if campaigns:
            # Supabase 저장
            client = SupabaseClient()
            saved_count = await client.save_campaigns(campaigns)
            
            result = {
                'success': True,
                'data': [c.__dict__ for c in campaigns],
                'count': len(campaigns),
                'summary': {
                    'total_found': len(campaigns),
                    'total_saved': saved_count,
                    'duration_ms': 0
                },
                'source': 'python-reviewplace',
                'timestamp': '$(date -Iseconds)'
            }
        else:
            result = {
                'success': False,
                'data': [],
                'count': 0,
                'error': 'No campaigns found',
                'source': 'python-reviewplace',
                'timestamp': '$(date -Iseconds)'
            }
            
        print(json.dumps(result, ensure_ascii=False, default=str))
        
    except Exception as e:
        error_result = {
            'success': False,
            'data': [],
            'count': 0,
            'error': str(e),
            'source': 'python-reviewplace',
            'timestamp': '$(date -Iseconds)'
        }
        print(json.dumps(error_result, ensure_ascii=False))

asyncio.run(main())
"`;

      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30초 타임아웃
        maxBuffer: 1024 * 1024 * 10 // 10MB 버퍼
      });

      if (stderr && !stderr.includes('INFO')) {
        console.warn('🐍 Python stderr:', stderr);
      }

      // JSON 응답 파싱
      const result: PythonScrapeResult = JSON.parse(stdout.trim());
      
      // 실제 처리 시간 추가
      const duration = Date.now() - startTime;
      if (result.summary) {
        result.summary.duration_ms = duration;
      }

      console.warn(`🐍 Python 스크래핑 완료: ${result.count}개 수집, ${result.summary?.total_saved || 0}개 저장`);
      
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error('❌ Python 스크래핑 실패:', errorMessage);
      
      return {
        success: false,
        data: [],
        count: 0,
        summary: {
          total_found: 0,
          total_saved: 0,
          duration_ms: duration
        },
        source: 'python-reviewplace',
        timestamp: new Date().toISOString(),
        error: errorMessage
      };
    }
  }

  /**
   * Python 시스템 헬스체크
   */
  async healthCheck(): Promise<{ available: boolean; version?: string; error?: string }> {
    try {
      const { stdout } = await execAsync(`cd "${this.scrapingPath}" && poetry --version`, {
        timeout: 5000
      });
      
      return {
        available: true,
        version: stdout.trim()
      };
      
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

export const pythonScraper = new PythonScraperService();