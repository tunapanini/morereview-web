import { tableLabels } from '@/lib/labels';

export interface DeadlineBadgeProps {
  endDate: Date | undefined;
  className?: string;
  showParens?: boolean;
  variant?: 'urgent' | 'warning' | 'default';
}

export interface DeadlineBadgeInfo {
  daysUntilEnd: number;
  shouldShow: boolean;
  variant: 'urgent' | 'warning' | 'default';
}

// 뱃지 표시 여부와 variant를 결정하는 로직
export function getDeadlineBadgeInfo(endDate: Date | undefined): DeadlineBadgeInfo {
  if (!endDate) {
    return {
      daysUntilEnd: 0,
      shouldShow: false,
      variant: 'default'
    };
  }

  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const daysUntilEnd = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // 2일 초과면 뱃지 표시 안함
  if (daysUntilEnd > 2) {
    return {
      daysUntilEnd,
      shouldShow: false,
      variant: 'default'
    };
  }

  // 0일 이하이면 "오늘 마감" 표시
  if (daysUntilEnd <= 0) {
    return {
      daysUntilEnd: 0,
      shouldShow: true,
      variant: 'urgent'
    };
  }

  // 1일이면 urgent, 2-3일이면 warning
  const variant = daysUntilEnd <= 1 ? 'urgent' : 'warning';

  return {
    daysUntilEnd,
    shouldShow: true,
    variant
  };
}

export default function DeadlineBadge({ 
  endDate, 
  className = '',
  showParens = false,
  variant: forcedVariant
}: DeadlineBadgeProps) {
  const badgeInfo = getDeadlineBadgeInfo(endDate);
  
  if (!badgeInfo.shouldShow) {
    return null;
  }

  const finalVariant = forcedVariant || badgeInfo.variant;
  
  // variant에 따른 스타일
  const variantStyles = {
    urgent: 'text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-200',
    warning: 'text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200', 
    default: 'text-gray-600'
  };

  const badgeText = badgeInfo.daysUntilEnd === 0 ? '오늘 마감' : `${badgeInfo.daysUntilEnd}${tableLabels.mobile.daysLeft}`;
  const displayText = showParens ? `(${badgeText})` : badgeText;

  return (
    <span className={`text-xs font-medium ${variantStyles[finalVariant]} ${className}`}>
      {displayText}
    </span>
  );
}