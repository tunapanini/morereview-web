'use client';

import { CampaignSource } from '@/types/campaign';
import { sourceLabels } from '@/lib/labels';

interface SourceLabelProps {
  source: CampaignSource;
  className?: string;
}

export default function SourceLabel({ source, className = '' }: SourceLabelProps) {
  return (
    <span className={`caption text-gray-500 font-medium ${className}`}>
      {sourceLabels[source]}
    </span>
  );
}
