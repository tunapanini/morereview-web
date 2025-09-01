// 데이터 품질 모니터링 및 검증 시스템

import { SimpleCampaign, ValidationResult } from '@/types/simple-crawler';

export interface QualityMetrics {
  totalCampaigns: number;
  nullDeadlines: number;
  invalidDeadlines: number;
  validDeadlines: number;
  extractionMethods: {
    listPage: number;
    detailPage: number;
    fallback: number;
  };
  sourcesProcessed: string[];
  averageRemainingDays: number;
  qualityScore: number; // 0-100
}

export interface QualityAlert {
  severity: 'error' | 'warning' | 'info';
  message: string;
  campaign?: string;
  source?: string;
  timestamp: Date;
}

export class DataQualityMonitor {
  private alerts: QualityAlert[] = [];
  private metrics: QualityMetrics = this.initializeMetrics();

  private initializeMetrics(): QualityMetrics {
    return {
      totalCampaigns: 0,
      nullDeadlines: 0,
      invalidDeadlines: 0,
      validDeadlines: 0,
      extractionMethods: {
        listPage: 0,
        detailPage: 0,
        fallback: 0
      },
      sourcesProcessed: [],
      averageRemainingDays: 0,
      qualityScore: 100
    };
  }

  // 캠페인 데이터 품질 분석
  analyzeCampaigns(campaigns: SimpleCampaign[]): ValidationResult {
    this.metrics = this.initializeMetrics();
    this.alerts = [];
    
    this.metrics.totalCampaigns = campaigns.length;
    
    let totalDays = 0;
    let validDaysCount = 0;
    const issues: string[] = [];
    const warnings: string[] = [];
    let validCount = 0;

    campaigns.forEach((campaign, index) => {
      this.analyzeSingleCampaign(campaign, index, issues, warnings);
      
      // 마감일 분석
      if (campaign.deadline) {
        const daysMatch = campaign.deadline.match(/D-(\d+)/);
        if (daysMatch) {
          const days = parseInt(daysMatch[1], 10);
          totalDays += days;
          validDaysCount++;
          this.metrics.validDeadlines++;
          
          if (days <= 0) {
            this.addAlert('error', `캠페인 ${index}: 마감일이 0일 이하`, campaign.title, campaign.source);
            this.metrics.invalidDeadlines++;
          } else {
            validCount++;
          }
        } else {
          this.addAlert('warning', `캠페인 ${index}: 비정형 마감일 형식`, campaign.title, campaign.source);
          this.metrics.invalidDeadlines++;
        }
      } else {
        this.addAlert('error', `캠페인 ${index}: 마감일이 null`, campaign.title, campaign.source);
        this.metrics.nullDeadlines++;
      }
      
      // 소스 추적
      if (!this.metrics.sourcesProcessed.includes(campaign.source)) {
        this.metrics.sourcesProcessed.push(campaign.source);
      }
    });

    // 평균 마감일 계산
    this.metrics.averageRemainingDays = validDaysCount > 0 ? totalDays / validDaysCount : 0;
    
    // 품질 점수 계산 (0-100)
    this.metrics.qualityScore = this.calculateQualityScore();

    // 심각한 문제 감지
    this.detectCriticalIssues();

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      totalProcessed: campaigns.length,
      validCount
    };
  }

  private analyzeSingleCampaign(campaign: SimpleCampaign, index: number, issues: string[], warnings: string[]): void {
    // 제목 검증
    if (!campaign.title || campaign.title.trim().length < 3) {
      issues.push(`Campaign ${index}: 제목이 너무 짧음`);
      this.addAlert('error', `제목이 부족한 캠페인`, campaign.title, campaign.source);
    }

    // 보상 검증
    if (campaign.reward <= 0) {
      issues.push(`Campaign ${index}: 보상이 0 이하`);
      this.addAlert('error', `보상이 0인 캠페인`, campaign.title, campaign.source);
    }

    // 극단적 보상 감지
    if (campaign.reward > 1000000) {
      warnings.push(`Campaign ${index}: 과도하게 높은 보상 (${campaign.reward})`);
      this.addAlert('warning', `과도한 보상 캠페인 (${campaign.reward}원)`, campaign.title, campaign.source);
    }

    // URL 유효성 기본 검사
    if (campaign.detailUrl && !campaign.detailUrl.startsWith('http')) {
      warnings.push(`Campaign ${index}: 유효하지 않은 URL 형식`);
      this.addAlert('warning', `잘못된 URL 형식`, campaign.title, campaign.source);
    }
  }

  private addAlert(severity: 'error' | 'warning' | 'info', message: string, campaign?: string, source?: string): void {
    this.alerts.push({
      severity,
      message,
      campaign,
      source,
      timestamp: new Date()
    });
  }

  private calculateQualityScore(): number {
    if (this.metrics.totalCampaigns === 0) return 100;

    let score = 100;

    // Null 마감일 패널티 (심각)
    const nullRatio = this.metrics.nullDeadlines / this.metrics.totalCampaigns;
    score -= nullRatio * 50; // null이 많을수록 큰 감점

    // 유효하지 않은 마감일 패널티 (중간)
    const invalidRatio = this.metrics.invalidDeadlines / this.metrics.totalCampaigns;
    score -= invalidRatio * 25;

    // 추출 방법 다양성 보너스
    const methodCount = Object.values(this.metrics.extractionMethods).filter(count => count > 0).length;
    if (methodCount >= 2) score += 5;

    // 소스 다양성 보너스
    if (this.metrics.sourcesProcessed.length > 1) score += 5;

    // 합리적인 평균 마감일 보너스
    if (this.metrics.averageRemainingDays >= 1 && this.metrics.averageRemainingDays <= 30) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private detectCriticalIssues(): void {
    // 50% 이상이 null deadline
    const nullRatio = this.metrics.nullDeadlines / this.metrics.totalCampaigns;
    if (nullRatio > 0.5) {
      this.addAlert('error', `심각: ${(nullRatio * 100).toFixed(1)}%의 캠페인에서 마감일이 null`);
    }

    // 품질 점수가 너무 낮음
    if (this.metrics.qualityScore < 70) {
      this.addAlert('error', `데이터 품질 점수가 낮음: ${this.metrics.qualityScore.toFixed(1)}/100`);
    }

    // 모든 마감일이 기본값 (7일)인 경우
    if (this.metrics.averageRemainingDays === 7 && this.metrics.validDeadlines === this.metrics.totalCampaigns) {
      this.addAlert('warning', `모든 캠페인의 마감일이 기본값(7일)로 설정됨 - 추출 로직 점검 필요`);
    }

    // 극단적으로 긴 평균 마감일
    if (this.metrics.averageRemainingDays > 60) {
      this.addAlert('warning', `평균 마감일이 과도하게 긺: ${this.metrics.averageRemainingDays.toFixed(1)}일`);
    }
  }

  // 추출 방법별 통계 업데이트
  updateExtractionStats(method: 'listPage' | 'detailPage' | 'fallback', count: number = 1): void {
    this.metrics.extractionMethods[method] += count;
  }

  // 모니터링 리포트 생성
  generateReport(): {
    metrics: QualityMetrics;
    alerts: QualityAlert[];
    summary: string;
  } {
    const errorCount = this.alerts.filter(a => a.severity === 'error').length;
    const warningCount = this.alerts.filter(a => a.severity === 'warning').length;

    const summary = `
📊 데이터 품질 리포트
- 총 캠페인: ${this.metrics.totalCampaigns}개
- 품질 점수: ${this.metrics.qualityScore.toFixed(1)}/100
- 유효 마감일: ${this.metrics.validDeadlines}개 (${((this.metrics.validDeadlines / this.metrics.totalCampaigns) * 100).toFixed(1)}%)
- Null 마감일: ${this.metrics.nullDeadlines}개
- 평균 마감일: ${this.metrics.averageRemainingDays.toFixed(1)}일
- 오류: ${errorCount}개, 경고: ${warningCount}개
- 처리된 소스: ${this.metrics.sourcesProcessed.join(', ')}
    `.trim();

    return {
      metrics: this.metrics,
      alerts: this.alerts,
      summary
    };
  }

  // 슬랙/이메일 알림을 위한 중요 알림 필터
  getCriticalAlerts(): QualityAlert[] {
    return this.alerts.filter(alert => 
      alert.severity === 'error' || 
      (alert.severity === 'warning' && alert.message.includes('심각'))
    );
  }

  // 실시간 모니터링을 위한 메트릭스
  getRealTimeMetrics(): {
    nullDeadlineRatio: number;
    qualityScore: number;
    averageRemainingDays: number;
    criticalAlertCount: number;
  } {
    return {
      nullDeadlineRatio: this.metrics.totalCampaigns > 0 ? this.metrics.nullDeadlines / this.metrics.totalCampaigns : 0,
      qualityScore: this.metrics.qualityScore,
      averageRemainingDays: this.metrics.averageRemainingDays,
      criticalAlertCount: this.getCriticalAlerts().length
    };
  }
}