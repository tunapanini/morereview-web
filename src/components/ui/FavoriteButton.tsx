'use client';

interface FavoriteButtonProps {
  isFavorited: boolean;
  onToggle: (e: React.MouseEvent) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function FavoriteButton({ 
  isFavorited, 
  onToggle, 
  className = '',
  size = 'md' 
}: FavoriteButtonProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2.5',
    lg: 'p-3'
  };

  return (
    <button
      onClick={onToggle}
      className={`rounded-full transition-all duration-200 hover-scale ${
        isFavorited
          ? 'text-red-500 bg-red-50 hover:bg-red-100'
          : 'text-gray-400 hover:text-red-500 hover:bg-gray-50'
      } ${buttonSizeClasses[size]} ${className}`}
      aria-label={isFavorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}
      title={isFavorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}
    >
      <svg
        className={`transition-all duration-200 ${
          isFavorited ? 'fill-current scale-110' : 'fill-none'
        } ${sizeClasses[size]}`}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
