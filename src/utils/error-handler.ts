/**
 * 에러 핸들링 유틸리티
 * 사용자 친화적인 에러 메시지와 표준화된 에러 응답을 제공합니다.
 */

import { NextResponse } from 'next/server';
import { 
  ApiErrorResponse, 
  ErrorCode, 
  ERROR_STATUS_MAP 
} from '@/types/api-response';
import { logger } from '@/utils/logger';

// 사용자 친화적 에러 메시지 (한국어)
const USER_FRIENDLY_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.UNAUTHORIZED]: '인증이 필요합니다. 다시 로그인해주세요.',
  [ErrorCode.FORBIDDEN]: '접근 권한이 없습니다.',
  [ErrorCode.BAD_REQUEST]: '잘못된 요청입니다. 입력 값을 확인해주세요.',
  [ErrorCode.NOT_FOUND]: '요청한 리소스를 찾을 수 없습니다.',
  [ErrorCode.METHOD_NOT_ALLOWED]: '허용되지 않은 요청 방법입니다.',
  [ErrorCode.INTERNAL_ERROR]: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  [ErrorCode.DATABASE_ERROR]: '데이터 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  [ErrorCode.EXTERNAL_API_ERROR]: '외부 서비스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.',
  [ErrorCode.VALIDATION_ERROR]: '입력 값이 올바르지 않습니다. 다시 확인해주세요.',
  [ErrorCode.DUPLICATE_ENTRY]: '이미 존재하는 데이터입니다.',
  [ErrorCode.DATA_NOT_FOUND]: '데이터를 찾을 수 없습니다.',
  [ErrorCode.SYNC_FAILED]: '데이터 동기화에 실패했습니다. 관리자에게 문의해주세요.',
  [ErrorCode.SYNC_IN_PROGRESS]: '이미 동기화가 진행 중입니다. 잠시 후 다시 시도해주세요.',
  [ErrorCode.NO_DATA_AVAILABLE]: '사용 가능한 데이터가 없습니다.'
};

// 에러 컨텍스트 인터페이스
interface ErrorContext {
  code?: ErrorCode;
  message?: string;
  details?: any;
  statusCode?: number;
  requestId?: string;
  logLevel?: 'error' | 'warn' | 'info';
}

/**
 * 표준화된 에러 응답 생성
 */
export function createErrorResponse(
  error: Error | unknown,
  context?: ErrorContext
): NextResponse {
  // 에러 코드 결정
  const errorCode = context?.code || ErrorCode.INTERNAL_ERROR;
  const statusCode = context?.statusCode || ERROR_STATUS_MAP[errorCode] || 500;
  
  // 사용자 친화적 메시지 선택
  const userMessage = context?.message || 
                      USER_FRIENDLY_MESSAGES[errorCode] || 
                      USER_FRIENDLY_MESSAGES[ErrorCode.INTERNAL_ERROR];
  
  // 에러 응답 객체 생성
  const errorResponse: ApiErrorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: userMessage,
      timestamp: new Date().toISOString(),
      requestId: context?.requestId
    }
  };
  
  // 개발 환경에서만 상세 정보 포함
  if (process.env.NODE_ENV !== 'production' && context?.details) {
    errorResponse.error.details = context.details;
  }
  
  // 로깅
  const logLevel = context?.logLevel || 'error';
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  logger[logLevel]('API Error', {
    code: errorCode,
    message: errorMessage,
    stack: errorStack,
    context: context?.details,
    requestId: context?.requestId
  });
  
  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * 에러 타입별 핸들러
 */
export function handleDatabaseError(error: Error, requestId?: string): NextResponse {
  // 중복 키 에러
  if (error.message.includes('unique constraint') || 
      error.message.includes('duplicate key')) {
    return createErrorResponse(error, {
      code: ErrorCode.DUPLICATE_ENTRY,
      requestId,
      logLevel: 'warn'
    });
  }
  
  // 연결 에러
  if (error.message.includes('connection') || 
      error.message.includes('timeout')) {
    return createErrorResponse(error, {
      code: ErrorCode.DATABASE_ERROR,
      message: '데이터베이스 연결에 실패했습니다.',
      requestId
    });
  }
  
  // 기타 데이터베이스 에러
  return createErrorResponse(error, {
    code: ErrorCode.DATABASE_ERROR,
    requestId
  });
}

/**
 * 외부 API 에러 핸들러
 */
export function handleExternalApiError(
  error: Error, 
  apiName?: string,
  requestId?: string
): NextResponse {
  const message = apiName 
    ? `${apiName} 서비스 연결에 실패했습니다.`
    : '외부 서비스 연결에 실패했습니다.';
    
  return createErrorResponse(error, {
    code: ErrorCode.EXTERNAL_API_ERROR,
    message,
    requestId,
    details: { apiName }
  });
}

/**
 * 유효성 검사 에러 핸들러
 */
export function handleValidationError(
  errors: Record<string, string>,
  requestId?: string
): NextResponse {
  const errorMessages = Object.entries(errors)
    .map(([field, message]) => `${field}: ${message}`)
    .join(', ');
    
  return createErrorResponse(new Error('Validation failed'), {
    code: ErrorCode.VALIDATION_ERROR,
    message: `입력 값이 올바르지 않습니다: ${errorMessages}`,
    requestId,
    details: errors,
    logLevel: 'warn'
  });
}

/**
 * 성공 응답 생성 헬퍼
 */
export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  metadata?: any
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * try-catch 래퍼
 */
export async function withErrorHandler<T>(
  handler: () => Promise<T>,
  context?: ErrorContext
): Promise<NextResponse> {
  try {
    const result = await handler();
    return createSuccessResponse(result);
  } catch (error) {
    return createErrorResponse(error, context);
  }
}