import React from 'react';

export const SkeletonBlock = ({ className = '', style }) => (
  <div className={`skeleton-shimmer bg-[#F0F0F0] rounded-md ${className}`} style={style} />
);

export const SkeletonCard = ({ lines = 3 }) => (
  <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm space-y-3">
    <SkeletonBlock className="h-3 w-24" />
    <SkeletonBlock className="h-6 w-32" />
    <SkeletonBlock className="h-3 w-20" />
  </div>
);

export const SkeletonStatRow = ({ count = 4 }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonChart = ({ height = 220 }) => (
  <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
    <SkeletonBlock className="h-3 w-40 mb-6" />
    <SkeletonBlock className="w-full" style={{ height }} />
  </div>
);

export const SkeletonTableRow = ({ cols = 6 }) => (
  <tr className="border-b border-[#F0F0F0] last:border-0">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-4">
        <SkeletonBlock className="h-3.5 w-full max-w-[90px]" />
      </td>
    ))}
  </tr>
);

export const SkeletonTable = ({ rows = 5, cols = 6 }) => (
  <div className="rounded-xl border border-[#E5E5E5] bg-white shadow-sm overflow-hidden">
    <table className="w-full">
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonTableRow key={i} cols={cols} />
        ))}
      </tbody>
    </table>
  </div>
);

export default SkeletonBlock;
