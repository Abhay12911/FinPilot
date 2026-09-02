import React from 'react';

/**
 * Premium Skeleton Loading UI Components
 * Designed for FinPilot AI platform with smooth shimmer & layout stability.
 */

export const SkeletonBlock = ({ className = '', style }) => (
  <div 
    className={`skeleton-shimmer bg-[#F1F5F9] rounded-lg ${className}`} 
    style={style} 
  />
);

export const SkeletonCircle = ({ size = 36, className = '' }) => (
  <div 
    className={`skeleton-shimmer bg-[#F1F5F9] rounded-full shrink-0 ${className}`} 
    style={{ width: size, height: size }} 
  />
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4 ${className}`}>
    <div className="flex items-center justify-between">
      <SkeletonBlock className="h-3.5 w-24 rounded-full" />
      <SkeletonCircle size={28} />
    </div>
    <SkeletonBlock className="h-7 w-36 rounded-lg" />
    <div className="flex items-center gap-2 pt-1">
      <SkeletonBlock className="h-4 w-16 rounded-md" />
      <SkeletonBlock className="h-3.5 w-28 rounded-full" />
    </div>
  </div>
);

export const SkeletonStatRow = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonChart = ({ height = 240, title = true }) => (
  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs flex flex-col justify-between">
    {title && (
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1.5">
          <SkeletonBlock className="h-4 w-36 rounded-md" />
          <SkeletonBlock className="h-3 w-56 rounded-full" />
        </div>
        <SkeletonBlock className="h-8 w-24 rounded-xl" />
      </div>
    )}
    <div 
      className="w-full rounded-xl bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9] relative overflow-hidden flex items-end gap-2 p-4"
      style={{ height }}
    >
      {/* Mock chart bars */}
      {Array.from({ length: 12 }).map((_, i) => {
        const heights = ['40%', '65%', '35%', '80%', '55%', '90%', '70%', '45%', '85%', '60%', '75%', '50%'];
        return (
          <div key={i} className="flex-1 flex flex-col justify-end h-full">
            <SkeletonBlock 
              className="w-full rounded-t-sm" 
              style={{ height: heights[i % heights.length] }} 
            />
          </div>
        );
      })}
    </div>
  </div>
);

export const SkeletonTableRow = ({ cols = 6 }) => {
  const widths = ['w-3/4', 'w-1/2', 'w-2/3', 'w-4/5', 'w-1/3', 'w-3/5'];
  return (
    <tr className="border-b border-[#F1F5F9] last:border-0">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <SkeletonBlock className={`h-3.5 rounded-full ${widths[i % widths.length]}`} />
        </td>
      ))}
    </tr>
  );
};

export const SkeletonTable = ({ rows = 6, cols = 6, title = false }) => (
  <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-xs overflow-hidden">
    {title && (
      <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
        <SkeletonBlock className="h-4 w-32 rounded-md" />
        <SkeletonBlock className="h-8 w-20 rounded-xl" />
      </div>
    )}
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <SkeletonBlock className="h-3 w-16 rounded-full" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const SkeletonList = ({ items = 5 }) => (
  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs divide-y divide-[#F1F5F9]">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <SkeletonCircle size={36} />
          <div className="space-y-1.5 flex-1 min-w-0">
            <SkeletonBlock className="h-3.5 w-1/3 rounded-md" />
            <SkeletonBlock className="h-3 w-2/3 rounded-full" />
          </div>
        </div>
        <SkeletonBlock className="h-4 w-16 rounded-md shrink-0" />
      </div>
    ))}
  </div>
);

export const SkeletonPage = () => (
  <div className="space-y-6 animate-pulse-subtle">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-2">
        <SkeletonBlock className="h-3.5 w-24 rounded-full" />
        <SkeletonBlock className="h-8 w-64 rounded-xl" />
      </div>
      <div className="flex items-center gap-2">
        <SkeletonBlock className="h-9 w-28 rounded-xl" />
        <SkeletonBlock className="h-9 w-32 rounded-xl" />
      </div>
    </div>
    <SkeletonStatRow count={4} />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <SkeletonChart height={280} />
      </div>
      <div>
        <SkeletonList items={4} />
      </div>
    </div>
  </div>
);

export default SkeletonBlock;
