import React from 'react';

export const SignalBadge = ({ type }) => {
  const styles = {
    bullish: 'bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]',
    bearish: 'bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF]',
    neutral: 'bg-[#F1F3F4] text-[#5F6368] border-[#E8EAED]',
    positive: 'bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]',
  };

  const normalizedType = type?.toLowerCase() || 'neutral';
  const style = styles[normalizedType] || styles.neutral;

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono border ${style}`}>
      {type || 'Neutral'}
    </span>
  );
};

export default SignalBadge;
