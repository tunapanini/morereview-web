'use client';

import { useEffect } from 'react';
import { logger } from '@/utils/logger';

export default function ErrorLogger() {
  useEffect(() => {
    // 전역 에러 핸들러
    const handleError = (event: ErrorEvent) => {
      logger.error('Uncaught error detected', {
        message: event.message,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    };

    // Promise rejection 핸들러
    const handleRejection = (event: PromiseRejectionEvent) => {
      logger.error('Unhandled promise rejection', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // 초기 로드 시 에러 체크
    logger.dev('Page loaded successfully', {
      timestamp: new Date().toISOString(),
      url: window.location.href
    });

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}