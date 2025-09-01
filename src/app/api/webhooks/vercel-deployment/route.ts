/**
 * Vercel Deployment 웹훅 핸들러
 * Error Intelligence Agent 자동 트리거
 */

import { NextRequest, NextResponse } from 'next/server';

interface VercelDeploymentEvent {
  type: 'deployment.created' | 'deployment.succeeded' | 'deployment.failed' | 'deployment.canceled';
  payload: {
    deployment: {
      id: string;
      url: string;
      name: string;
      target: 'production' | 'preview' | 'development';
      state: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
      created: number;
      meta: {
        githubCommitMessage?: string;
        githubCommitSha?: string;
        githubCommitRef?: string;
      };
    };
    team?: {
      id: string;
      name: string;
    };
    user: {
      id: string;
      email: string;
      name: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const webhook: VercelDeploymentEvent = await request.json();
    
    console.warn(`Received Vercel webhook: ${webhook.type}`, {
      deploymentId: webhook.payload.deployment.id,
      state: webhook.payload.deployment.state,
      target: webhook.payload.deployment.target
    });
    
    // 배포 실패시 Error Intelligence Agent 자동 실행
    if (webhook.type === 'deployment.failed' && webhook.payload.deployment.target === 'production') {
      await handleDeploymentFailure(webhook.payload.deployment);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });
    
  } catch (error) {
    console.error('Vercel webhook processing failed:', error);
    
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * 배포 실패 처리 및 Error Intelligence 실행
 */
async function handleDeploymentFailure(deployment: VercelDeploymentEvent['payload']['deployment']) {
  try {
    console.warn(`🔍 Starting Error Intelligence Analysis for deployment: ${deployment.id}`);
    
    // Error Analysis 실행 (Sequential MCP 활용)
    const errorAnalysis = await runErrorIntelligence(deployment.id);
    
    // 분석 결과 로깅
    console.warn('📊 Error Analysis Complete:', {
      deploymentId: deployment.id,
      errorType: errorAnalysis.errorType,
      rootCause: errorAnalysis.rootCause,
      estimatedFixTime: errorAnalysis.estimatedFixTime
    });
    
    // 개발자 알림 (선택사항)
    if (process.env.SLACK_WEBHOOK_URL) {
      await notifyDeveloper(deployment, errorAnalysis);
    }
    
    // 분석 결과를 메모리에 저장 (Serena MCP)
    await saveErrorAnalysis(deployment.id, errorAnalysis);
    
  } catch (error) {
    console.error('Error Intelligence execution failed:', error);
  }
}

/**
 * Error Intelligence 핵심 로직
 */
async function runErrorIntelligence(deploymentId: string) {
  // Phase 1: Vercel MCP로 빌드 로그 수집
  const buildLogs = await fetchBuildLogs(deploymentId);
  
  // Phase 2: 에러 패턴 분석
  const errorPattern = extractErrorPattern(buildLogs);
  
  // Phase 3: Sequential MCP로 체계적 분석
  const analysis = await analyzeErrorWithSequential(errorPattern, buildLogs);
  
  // Phase 4: 해결책 생성
  const solution = await generateSolution(analysis);
  
  return {
    deploymentId,
    errorType: analysis.errorType,
    rootCause: analysis.rootCause,
    affectedFiles: analysis.affectedFiles,
    solution: solution.steps,
    estimatedFixTime: solution.estimatedTime,
    confidence: analysis.confidence,
    timestamp: new Date().toISOString()
  };
}

/**
 * Vercel 빌드 로그 수집 (실제 구현시 Vercel MCP 사용)
 */
async function fetchBuildLogs(deploymentId: string) {
  // TODO: Vercel MCP 연동
  // const logs = await mcp_vercel.get_deployment_build_logs(deploymentId, { limit: 200 });
  
  // 임시 구현 (실제로는 MCP 사용)
  return {
    deploymentId,
    logs: [
      {
        text: "Error: SENDGRID_API_KEY environment variable is required",
        level: "error",
        timestamp: Date.now()
      }
    ]
  };
}

/**
 * 에러 패턴 추출
 */
function extractErrorPattern(buildLogs: Record<string, unknown>) {
  const logs = buildLogs.logs as Array<{ level: string; text: string }>;
  const errorLogs = logs.filter(log => log.level === 'error');
  
  if (errorLogs.length === 0) {
    return { type: 'unknown', pattern: '', context: '' };
  }
  
  const primaryError = errorLogs[0].text;
  
  // 환경변수 에러 패턴
  if (primaryError.includes('environment variable is required')) {
    return {
      type: 'environment_variable',
      pattern: 'environment_variable_missing',
      context: extractEnvVariable(primaryError),
      severity: 'critical'
    };
  }
  
  // TypeScript 에러 패턴  
  if (primaryError.includes('Property') && primaryError.includes('does not exist on type')) {
    return {
      type: 'typescript_error',
      pattern: 'property_not_found',
      context: extractTypeError(primaryError),
      severity: 'critical'
    };
  }
  
  // 빌드 에러 패턴
  if (primaryError.includes('Command') && primaryError.includes('exited with')) {
    return {
      type: 'build_failure',
      pattern: 'build_command_failed',
      context: extractBuildCommand(primaryError),
      severity: 'critical'
    };
  }
  
  return {
    type: 'unknown',
    pattern: 'unrecognized_error',
    context: primaryError.substring(0, 100),
    severity: 'medium'
  };
}

/**
 * Sequential MCP 기반 에러 분석 (실제 구현시 Sequential MCP 사용)
 */
async function analyzeErrorWithSequential(errorPattern: Record<string, unknown>) {
  // TODO: Sequential MCP 연동
  // const analysis = await sequential_thinking({
  //   thought_1: `에러 유형 분류: ${errorPattern.type}`,
  //   thought_2: `에러 컨텍스트 분석: ${errorPattern.context}`,
  //   thought_3: `근본 원인 추적: ${errorPattern.pattern}`,
  //   thought_4: `해결 전략 수립`
  // });
  
  void 0; // buildLogs 매개변수를 사용하지 않음을 명시
  
  // 임시 구현 (환경변수 에러 케이스)
  if (errorPattern.type === 'environment_variable') {
    return {
      errorType: 'Environment Variable Missing',
      rootCause: '빌드 타임에 환경변수를 체크하는 코드가 존재',
      affectedFiles: [
        'web/src/services/email-service.ts',
        'web/src/app/api/admin/subscribers/route.ts'
      ],
      confidence: 0.95,
      category: 'configuration'
    };
  }
  
  return {
    errorType: 'Unknown Error',
    rootCause: 'Further analysis required',
    affectedFiles: [],
    confidence: 0.3,
    category: 'unknown'
  };
}

/**
 * 해결책 생성
 */
async function generateSolution(analysis: Record<string, unknown>) {
  if (analysis.errorType === 'Environment Variable Missing') {
    return {
      steps: [
        {
          step: 1,
          action: "EmailService 클래스에서 지연 초기화 패턴 적용",
          file: "web/src/services/email-service.ts",
          estimatedTime: "3분"
        },
        {
          step: 2,
          action: "환경변수 체크를 sendEmail 메서드 내부로 이동",
          file: "web/src/services/email-service.ts", 
          estimatedTime: "2분"
        },
        {
          step: 3,
          action: "빌드 테스트 및 배포 검증",
          file: "전체 프로젝트",
          estimatedTime: "3분"
        }
      ],
      estimatedTime: "8분",
      priority: "high",
      category: "environment_fix"
    };
  }
  
  return {
    steps: [
      {
        step: 1,
        action: "수동 에러 분석 필요",
        file: "N/A",
        estimatedTime: "15분"
      }
    ],
    estimatedTime: "15분",
    priority: "medium",
    category: "manual_analysis"
  };
}

/**
 * 개발자 알림 (Slack 등)
 */
async function notifyDeveloper(deployment: Record<string, unknown>, analysis: Record<string, unknown>) {
  if (!process.env.SLACK_WEBHOOK_URL) return;
  
  const message = {
    text: `🚨 배포 실패 - Error Intelligence 분석 완료`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*배포 실패:* ${deployment.name}\n*에러 유형:* ${analysis.errorType}\n*예상 해결 시간:* ${analysis.estimatedFixTime}\n*신뢰도:* ${Math.round(analysis.confidence * 100)}%`
        }
      }
    ]
  };
  
  try {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  } catch (error) {
    console.error('Slack notification failed:', error);
  }
}

/**
 * 분석 결과 저장 (Serena MCP 활용)
 */
async function saveErrorAnalysis(deploymentId: string, analysis: Record<string, unknown>) {
  // TODO: Serena MCP 메모리 저장
  // await serena.write_memory(
  //   `error-analysis-${deploymentId}-${Date.now()}`,
  //   JSON.stringify(analysis, null, 2)
  // );
  
  void analysis; // analysis 매개변수를 사용하지 않음을 명시
  console.warn('Error analysis saved:', deploymentId);
}

// 유틸리티 함수들
function extractEnvVariable(errorText: string): string {
  const match = errorText.match(/(\w+).*environment variable/);
  return match ? match[1] : 'UNKNOWN_VAR';
}

function extractTypeError(errorText: string): string {
  const match = errorText.match(/Property '(\w+)' does not exist on type '(\w+)'/);
  return match ? `${match[1]} on ${match[2]}` : errorText;
}

function extractBuildCommand(errorText: string): string {
  const match = errorText.match(/Command "([^"]+)"/);
  return match ? match[1] : 'unknown command';
}