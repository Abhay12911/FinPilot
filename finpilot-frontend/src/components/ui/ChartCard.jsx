import React from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

export const ChartCard = ({ data, color = '#137333', strokeWidth = 2, height = 40 }) => {
  if (!data || data.length === 0) {
    return <div style={{ height }} className="w-full bg-[#FAFAFA] rounded flex items-center justify-center text-[10px] text-[#8C8C8C]">No Data</div>;
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={strokeWidth} 
            dot={false}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartCard;
