(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["chunks/[root-of-the-server]__9acd1565._.js", {

"[externals]/node:buffer [external] (node:buffer, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}}),
"[project]/src/utils/logger.ts [middleware-edge] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * 환경변수 기반 로깅 시스템
 * 
 * LOG_LEVEL 환경변수로 로깅 레벨을 제어:
 * - dev: 모든 로그 출력 (개발 환경)
 * - info: 정보성 로그와 에러 출력 (스테이징)
 * - error: 에러만 출력 (프로덕션)
 * - none: 로그 비활성화
 */ __turbopack_context__.s({
    "default": ()=>__TURBOPACK__default__export__,
    "logger": ()=>logger
});
const LOG_LEVEL = process.env.NEXT_PUBLIC_LOG_LEVEL || process.env.LOG_LEVEL || 'error';
const IS_SERVER = "undefined" === 'undefined';
const IS_PRODUCTION = ("TURBOPACK compile-time value", "development") === 'production';
// 로그 레벨 우선순위
const LOG_LEVELS = {
    none: 0,
    error: 1,
    warn: 2,
    info: 3,
    dev: 4
};
// 현재 로그 레벨 가져오기
const currentLogLevel = LOG_LEVELS[LOG_LEVEL] || LOG_LEVELS.error;
// 민감한 정보 마스킹
function maskSensitiveData(data) {
    if (typeof data !== 'object' || data === null) {
        return data;
    }
    const sensitiveKeys = [
        'password',
        'secret',
        'token',
        'key',
        'apikey',
        'api_key',
        'authorization',
        'auth',
        'credential',
        'private'
    ];
    const masked = Array.isArray(data) ? [
        ...data
    ] : {
        ...data
    };
    for(const key in masked){
        const lowerKey = key.toLowerCase();
        // 민감한 키인 경우 마스킹
        if (sensitiveKeys.some((sensitive)=>lowerKey.includes(sensitive))) {
            masked[key] = '[MASKED]';
        } else if (typeof masked[key] === 'object' && masked[key] !== null) {
            masked[key] = maskSensitiveData(masked[key]);
        }
    }
    return masked;
}
// 로그 포맷팅
function formatLog(level, message, data) {
    const timestamp = new Date().toISOString();
    const environment = ("TURBOPACK compile-time truthy", 1) ? 'SERVER' : "TURBOPACK unreachable";
    let formattedMessage = `[${timestamp}] [${environment}] [${level}] ${message}`;
    if (data !== undefined) {
        const maskedData = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : data;
        formattedMessage += ` ${JSON.stringify(maskedData, null, 2)}`;
    }
    return formattedMessage;
}
const logger = {
    /**
   * 개발 환경 전용 로그
   */ dev: (message, data)=>{
        if (currentLogLevel >= LOG_LEVELS.dev) {
            // eslint-disable-next-line no-console
            console.log(formatLog('DEV', message, data));
        }
    },
    /**
   * 정보성 로그
   */ info: (message, data)=>{
        if (currentLogLevel >= LOG_LEVELS.info) {
            // eslint-disable-next-line no-console
            console.log(formatLog('INFO', message, data));
        }
    },
    /**
   * 경고 로그
   */ warn: (message, data)=>{
        if (currentLogLevel >= LOG_LEVELS.warn) {
            console.warn(formatLog('WARN', message, data));
        }
    },
    /**
   * 에러 로그
   */ error: (message, data)=>{
        if (currentLogLevel >= LOG_LEVELS.error) {
            console.error(formatLog('ERROR', message, data));
        }
    },
    /**
   * 성능 측정 로그 (개발 환경 전용)
   */ time: (label)=>{
        if (currentLogLevel >= LOG_LEVELS.dev) {
            // eslint-disable-next-line no-console
            console.time(label);
        }
    },
    timeEnd: (label)=>{
        if (currentLogLevel >= LOG_LEVELS.dev) {
            // eslint-disable-next-line no-console
            console.timeEnd(label);
        }
    },
    /**
   * 그룹 로그 (개발 환경 전용)
   */ group: (label)=>{
        if (currentLogLevel >= LOG_LEVELS.dev) {
            // eslint-disable-next-line no-console
            console.group(label);
        }
    },
    groupEnd: ()=>{
        if (currentLogLevel >= LOG_LEVELS.dev) {
            // eslint-disable-next-line no-console
            console.groupEnd();
        }
    }
};
// 전역 에러 핸들러 (클라이언트 사이드)
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
const __TURBOPACK__default__export__ = logger;
}),
"[project]/src/lib/rate-limit.ts [middleware-edge] (ecmascript)": ((__turbopack_context__) => {
"use strict";

/**
 * Rate Limiting 유틸리티
 * IP 기반으로 API 요청을 제한합니다.
 */ __turbopack_context__.s({
    "API_RATE_LIMITS": ()=>API_RATE_LIMITS,
    "DEFAULT_RATE_LIMIT": ()=>DEFAULT_RATE_LIMIT,
    "checkRateLimit": ()=>checkRateLimit,
    "cleanupRateLimitStore": ()=>cleanupRateLimitStore
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$playwright$2b$test$40$1$2e$55$2e$0_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.4.6_@playwright+test@1.55.0_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$playwright$2b$test$40$1$2e$55$2e$0_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.4.6_@playwright+test@1.55.0_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/esm/server/web/spec-extension/response.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/logger.ts [middleware-edge] (ecmascript)");
;
;
// 메모리 저장소 (프로덕션에서는 Redis 권장)
const rateLimitStore = new Map();
const DEFAULT_RATE_LIMIT = {
    limit: 60,
    windowMs: 60 * 1000,
    message: '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.'
};
const API_RATE_LIMITS = {
    '/api/sync-regions': {
        limit: 1,
        windowMs: 60 * 60 * 1000,
        message: '지역 동기화는 1시간에 한 번만 가능합니다.'
    },
    '/api/regions': {
        limit: 100,
        windowMs: 60 * 1000
    },
    '/api/dev': {
        limit: 10,
        windowMs: 60 * 1000
    }
};
function checkRateLimit(identifier, pathname, config) {
    const now = Date.now();
    // API별 설정 또는 기본 설정 사용
    const rateLimitConfig = config || API_RATE_LIMITS[pathname] || DEFAULT_RATE_LIMIT;
    const { limit, windowMs, message } = rateLimitConfig;
    // 식별자별 데이터 가져오기
    const key = `${identifier}:${pathname}`;
    const data = rateLimitStore.get(key) || {
        requests: []
    };
    // 차단된 경우 체크
    if (data.blocked && now - data.blocked < windowMs) {
        const retryAfter = Math.ceil((data.blocked + windowMs - now) / 1000);
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["logger"].warn('Rate limit blocked', {
            identifier,
            pathname,
            retryAfter
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$playwright$2b$test$40$1$2e$55$2e$0_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: message || DEFAULT_RATE_LIMIT.message,
                retryAfter
            }
        }, {
            status: 429,
            headers: {
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': new Date(data.blocked + windowMs).toISOString(),
                'Retry-After': retryAfter.toString()
            }
        });
    }
    // 시간 창 내의 요청만 필터링
    const validRequests = data.requests.filter((time)=>now - time < windowMs);
    // 제한 초과 체크
    if (validRequests.length >= limit) {
        data.blocked = now;
        rateLimitStore.set(key, data);
        const retryAfter = Math.ceil(windowMs / 1000);
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["logger"].warn('Rate limit exceeded', {
            identifier,
            pathname,
            requests: validRequests.length,
            limit
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$playwright$2b$test$40$1$2e$55$2e$0_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: message || DEFAULT_RATE_LIMIT.message,
                retryAfter
            }
        }, {
            status: 429,
            headers: {
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': new Date(now + windowMs).toISOString(),
                'Retry-After': retryAfter.toString()
            }
        });
    }
    // 요청 기록
    validRequests.push(now);
    rateLimitStore.set(key, {
        requests: validRequests
    });
    // Rate limit 헤더 추가 (정보 제공용)
    const remaining = limit - validRequests.length;
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["logger"].dev('Rate limit check passed', {
        identifier,
        pathname,
        used: validRequests.length,
        limit,
        remaining
    });
    // null 반환시 요청 계속 진행
    return null;
}
function cleanupRateLimitStore() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24시간
    for (const [key, data] of rateLimitStore.entries()){
        const lastRequest = Math.max(...data.requests, data.blocked || 0);
        if (now - lastRequest > maxAge) {
            rateLimitStore.delete(key);
        }
    }
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["logger"].dev('Rate limit store cleanup completed', {
        remainingKeys: rateLimitStore.size
    });
}
// 주기적 정리 (1시간마다)
if ("TURBOPACK compile-time truthy", 1) {
    setInterval(cleanupRateLimitStore, 60 * 60 * 1000);
}
}),
"[project]/src/middleware.ts [middleware-edge] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "config": ()=>config,
    "middleware": ()=>middleware
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$playwright$2b$test$40$1$2e$55$2e$0_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.4.6_@playwright+test@1.55.0_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$playwright$2b$test$40$1$2e$55$2e$0_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@15.4.6_@playwright+test@1.55.0_react-dom@19.1.0_react@19.1.0__react@19.1.0/node_modules/next/dist/esm/server/web/spec-extension/response.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$rate$2d$limit$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/rate-limit.ts [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/logger.ts [middleware-edge] (ecmascript)");
;
;
;
// API 라우트 체크
function isAPIRoute(pathname) {
    return pathname.startsWith('/api/');
}
// 관리자 API 체크 (cron 제외)
function isAdminAPIRoute(pathname) {
    return pathname.startsWith('/api/sync-regions') || pathname.startsWith('/api/dev/');
}
// Cron API 체크
function isCronAPIRoute(pathname) {
    return pathname.startsWith('/api/cron/');
}
// IP 주소 추출
function getClientIp(request) {
    return request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip') || 'unknown';
}
function middleware(request) {
    const pathname = request.nextUrl.pathname;
    // API 라우트만 처리
    if (!isAPIRoute(pathname)) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$playwright$2b$test$40$1$2e$55$2e$0_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    const ip = getClientIp(request);
    // Cron API는 자체 미들웨어에서 처리하므로 여기서는 제외
    if (isCronAPIRoute(pathname)) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$playwright$2b$test$40$1$2e$55$2e$0_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    // 관리자 API 인증 체크
    if (isAdminAPIRoute(pathname)) {
        const adminApiKey = request.headers.get('x-api-key');
        // Admin API 키 인증
        const hasValidApiKey = adminApiKey === process.env.ADMIN_API_KEY;
        // 프로덕션 환경에서는 인증 필수
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }
    // Rate limiting 체크
    const rateLimitResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$rate$2d$limit$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["checkRateLimit"])(ip, pathname);
    if (rateLimitResult) {
        // Rate limit 초과시 에러 응답 반환
        return rateLimitResult;
    }
    // 정상 처리
    const response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$15$2e$4$2e$6_$40$playwright$2b$test$40$1$2e$55$2e$0_react$2d$dom$40$19$2e$1$2e$0_react$40$19$2e$1$2e$0_$5f$react$40$19$2e$1$2e$0$2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    // CORS 헤더 추가 (필요시)
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return response;
}
const config = {
    matcher: '/api/:path*'
};
}),
}]);

//# sourceMappingURL=%5Broot-of-the-server%5D__9acd1565._.js.map