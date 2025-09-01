interface SkeletonProps {
  className?: string;
}

const Skeleton = ({ className = "" }: SkeletonProps) => {
  return (
    <div className={`animate-pulse rounded bg-gray-300 ${className}`} />
  );
};

export default function CampaignTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-4 hidden sm:block">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-1 flex justify-center">
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="col-span-5">
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="col-span-2">
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="col-span-2">
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="col-span-2">
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </div>

        {/* Table Body - 5개 행 생성 */}
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 sm:gap-4 px-4 sm:px-6 py-4"
            >
              {/* Action Buttons */}
              <div className="col-span-1 flex items-center justify-center">
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>

              {/* Campaign Info */}
              <div className="col-span-8 sm:col-span-5">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Category and Source badges */}
                    <div className="flex items-center gap-1 sm:gap-2 mb-2 flex-wrap">
                      <Skeleton className="h-5 w-12 rounded-full" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>

                    {/* Title - 2줄로 표시 */}
                    <div className="mb-2 space-y-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>

                    {/* Mobile: End date */}
                    <div className="sm:hidden">
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Platforms (Desktop only) */}
              <div className="col-span-2 hidden sm:flex items-center gap-1">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-6 w-6 rounded" />
              </div>

              {/* Reward */}
              <div className="col-span-3 sm:col-span-2 flex items-center justify-end">
                <Skeleton className="h-6 w-20" />
              </div>

              {/* End Date (Desktop only) */}
              <div className="col-span-2 hidden sm:flex items-center">
                <div className="flex flex-col space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}