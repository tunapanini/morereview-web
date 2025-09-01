/**
 * 환경변수 기반 로깅 시스템
 * 
 * LOG_LEVEL 환경변수로 로깅 레벨을 제어:
 * - dev: 모든 로그 출력 (개발 환경)
 * - info: 정보성 로그와 에러 출력 (스테이징)
 * - error: 에러만 출력 (프로덕션)
 * - none: 로그 비활성화
 */

const LOG_LEVEL = process.env.NEXT_PUBLIC_LOG_LEVEL || process.env.LOG_LEVEL || 'error';
const IS_SERVER = typeof window === 'undefined';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// 로그 레벨 우선순위
const LOG_LEVELS = {
  none: 0,
  error: 1,
  warn: 2,
  info: 3,
  dev: 4,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

// 현재 로그 레벨 가져오기
const currentLogLevel = LOG_LEVELS[LOG_LEVEL as LogLevel] || LOG_LEVELS.error;

// 민감한 정보 마스킹
function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveKeys = [
    'password', 'secret', 'token', 'key', 'apikey', 'api_key',
    'authorization', 'auth', 'credential', 'private'
  ];

  const masked = Array.isArray(data) ? [...data] : { ...data };

  for (const key in masked) {
    const lowerKey = key.toLowerCase();
    
    // 민감한 키인 경우 마스킹
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      masked[key] = '[MASKED]';
    } 
    // 객체인 경우 재귀적으로 처리
    else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }

  return masked;
}

// 로그 포맷팅
function formatLog(level: string, message: string, data?: any): string {
  const timestamp = new Date().toISOString();
  const environment = IS_SERVER ? 'SERVER' : 'CLIENT';
  
  let formattedMessage = `[${timestamp}] [${environment}] [${level}] ${message}`;
  
  if (data !== undefined) {
    const maskedData = IS_PRODUCTION ? maskSensitiveData(data) : data;
    formattedMessage += ` ${JSON.stringify(maskedData, null, 2)}`;
  }
  
  return formattedMessage;
}

export const logger = {
  /**
   * 개발 환경 전용 로그
   */
  dev: (message: string, data?: any) => {
    if (currentLogLevel >= LOG_LEVELS.dev) {
      console.log(formatLog('DEV', message, data));
    }
  },

  /**
   * 정보성 로그
   */
  info: (message: string, data?: any) => {
    if (currentLogLevel >= LOG_LEVELS.info) {
      console.log(formatLog('INFO', message, data));
    }
  },

  /**
   * 경고 로그
   */
  warn: (message: string, data?: any) => {
    if (currentLogLevel >= LOG_LEVELS.warn) {
      console.warn(formatLog('WARN', message, data));
    }
  },

  /**
   * 에러 로그
   */
  error: (message: string, data?: any) => {
    if (currentLogLevel >= LOG_LEVELS.error) {
      console.error(formatLog('ERROR', message, data));
    }
  },

  /**
   * 성능 측정 로그 (개발 환경 전용)
   */
  time: (label: string) => {
    if (currentLogLevel >= LOG_LEVELS.dev) {
      console.time(label);
    }
  },

  timeEnd: (label: string) => {
    if (currentLogLevel >= LOG_LEVELS.dev) {
      console.timeEnd(label);
    }
  },

  /**
   * 그룹 로그 (개발 환경 전용)
   */
  group: (label: string) => {
    if (currentLogLevel >= LOG_LEVELS.dev) {
      console.group(label);
    }
  },

  groupEnd: () => {
    if (currentLogLevel >= LOG_LEVELS.dev) {
      console.groupEnd();
    }
  },
};

// 전역 에러 핸들러 (클라이언트 사이드)
if (!IS_SERVER && IS_PRODUCTION) {
  window.addEventListener('error', (event) => {
    logger.error('Uncaught error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', {
      reason: event.reason,
    });
  });
}

export default logger;