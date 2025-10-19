'use client';

import { displayPrice } from '@/lib/currency';

interface PriceProps {
  priceBgn: number;
  className?: string;
  showBoth?: boolean; // Show both currencies
  inline?: boolean; // Display inline (horizontal) vs stacked
}

export default function Price({ 
  priceBgn, 
  className = '', 
  showBoth = true,
  inline = true 
}: PriceProps) {
  const bgnPrice = displayPrice(priceBgn, 'BGN');
  const eurPrice = displayPrice(priceBgn, 'EUR');

  if (!showBoth) {
    return <span className={className}>{bgnPrice}</span>;
  }

  if (inline) {
    return (
      <span className={className}>
        <span className="font-semibold">{bgnPrice}</span>
        <span className="opacity-70 mx-2">/</span>
        <span className="opacity-90">{eurPrice}</span>
      </span>
    );
  }

  // Stacked layout
  return (
    <span className={`flex flex-col ${className}`}>
      <span className="font-semibold">{bgnPrice}</span>
      <span className="text-sm opacity-70">{eurPrice}</span>
    </span>
  );
}


