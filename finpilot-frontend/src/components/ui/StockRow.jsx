import React from 'react';
import { ChartCard } from './ChartCard';
import { SignalBadge } from './SignalBadge';

export const StockRow = ({ ticker, name, price, changePercent, signal, sparklineData }) => {
  const isPositive = changePercent >= 0;
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA] transition-colors -mx-4 px-4 rounded-lg cursor-pointer">
      <div className="flex flex-col min-w-[120px]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[13px] text-[#050505]">{ticker}</span>
          <span className="text-[11px] text-[#8C8C8C] truncate max-w-[100px] hidden sm:inline-block">{name}</span>
        </div>
        <div className="mt-1">
          <SignalBadge type={signal} />
        </div>
      </div>

      <div className="flex-1 max-w-[120px] mx-4 hidden md:block">
        <ChartCard 
          data={sparklineData} 
          color={isPositive ? '#137333' : '#C5221F'} 
          height={32} 
        />
      </div>

      <div className="flex flex-col items-end min-w-[80px]">
        <span className="font-semibold text-[13px] text-[#050505]">
          ${price.toFixed(2)}
        </span>
        <span className={`text-[11px] font-medium ${isPositive ? 'text-[#137333]' : 'text-[#C5221F]'}`}>
          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      </div>
    </div>
  );
};

export default StockRow;
