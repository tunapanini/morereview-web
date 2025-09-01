import Link from 'next/link';

interface CampaignExploreButtonProps {
    className?: string;
}

export default function CampaignExploreButton({ className = '' }: CampaignExploreButtonProps) {
    return (
        <Link
            href="/campaigns"
            className={`inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-primary-600 rounded-lg shadow-lg hover:bg-primary-700 hover:shadow-xl hover-lift transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-300 ${className}`}
        >
            <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
            </svg>
            캠페인 탐색 시작하기
        </Link>
    );
}
