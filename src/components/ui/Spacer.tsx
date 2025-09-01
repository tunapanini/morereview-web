import React from 'react';

interface SpacerProps {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    responsive?: boolean;
    className?: string;
    'aria-label'?: string;
}

/**
 * 레이아웃에서 일관된 간격을 제공하는 Spacer 컴포넌트
 * 
 * @param size - 간격 크기 (xs: 8px, sm: 16px, md: 24px, lg: 32px, xl: 48px, 2xl: 64px)
 * @param responsive - 반응형 간격 적용 여부
 * @param className - 추가 CSS 클래스
 * @param aria-label - 접근성을 위한 라벨 (선택사항)
 */
export function Spacer({
    size = 'md',
    responsive = false,
    className = '',
    'aria-label': ariaLabel
}: SpacerProps) {
    const sizeClasses = {
        xs: 'h-2',      // 8px
        sm: 'h-4',      // 16px
        md: 'h-6',      // 24px
        lg: 'h-8',      // 32px
        xl: 'h-12',     // 48px
        '2xl': 'h-16'   // 64px
    };

    const responsiveClasses = responsive ? {
        xs: 'h-2 md:h-3 lg:h-4',           // 8px → 12px → 16px
        sm: 'h-4 md:h-5 lg:h-6',           // 16px → 20px → 24px
        md: 'h-6 md:h-8 lg:h-10',          // 24px → 32px → 40px
        lg: 'h-8 md:h-10 lg:h-12',         // 32px → 40px → 48px
        xl: 'h-12 md:h-16 lg:h-20',        // 48px → 64px → 80px
        '2xl': 'h-16 md:h-20 lg:h-24'      // 64px → 80px → 96px
    } : {};

    const classes = responsive ? responsiveClasses[size] : sizeClasses[size];

    return (
        <div
            className={`${classes} ${className}`.trim()}
            aria-hidden={!ariaLabel}
            aria-label={ariaLabel}
        />
    );
}

export default Spacer;
