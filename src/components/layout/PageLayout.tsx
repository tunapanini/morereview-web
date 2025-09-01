import Header from '@/components/layout/Header';
import CoupangDisclosure from '@/components/ui/CoupangDisclosure';
import { COMMON_MESSAGES } from '@/lib/constants';
import CoupangAdBanner from '../ui/CoupangAdBanner';

interface PageLayoutProps {
  children: React.ReactNode;
  favoritesCount?: number;
}

export default function PageLayout({ children, favoritesCount = 0 }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header favoritesCount={favoritesCount} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {children}
      </main>
      <div className='h-2'></div>
      <div className='max-w-6xl mx-auto'>
        <CoupangAdBanner tsource="campaigns_main" />
        <div className='h-2'></div>
        <CoupangDisclosure />
      </div>
      {/* Small copyright footer - always visible but unobtrusive */}
      <footer className="bg-gray-50 border-t border-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="text-center">
            <p className="text-xs text-gray-400">
              {COMMON_MESSAGES.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}