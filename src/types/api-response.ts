/**
 * API 응답 표준화 타입 정의
 */

// 성공 응답
export interface ApiSuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
  metadata?: {
    timestamp: string;
    requestId?: string;
    [key: string]: any;
  };
}

// 에러 응답
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

// 통합 응답 타입
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// 표준 에러 코드
export enum ErrorCode {
  // 인증 관련
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // 요청 관련
  BAD_REQUEST = 'BAD_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  
  // 서버 관련
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // 데이터 관련
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  
  // 동기화 관련
  SYNC_FAILED = 'SYNC_FAILED',
  SYNC_IN_PROGRESS = 'SYNC_IN_PROGRESS',
  NO_DATA_AVAILABLE = 'NO_DATA_AVAILABLE'
}

// HTTP 상태 코드 매핑
export const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.METHOD_NOT_ALLOWED]: 405,
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_API_ERROR]: 502,
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.DUPLICATE_ENTRY]: 409,
  [ErrorCode.DATA_NOT_FOUND]: 404,
  [ErrorCode.SYNC_FAILED]: 500,
  [ErrorCode.SYNC_IN_PROGRESS]: 409,
  [ErrorCode.NO_DATA_AVAILABLE]: 204
};

// 페이지네이션 응답
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// 리스트 응답
export interface ListResponse<T> {
  items: T[];
  count: number;
  metadata?: {
    [key: string]: any;
  };
}