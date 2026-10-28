import React from "react";

export function formatINR(amount: number, compact: boolean = false): string {
  if (amount === undefined || amount === null) return "₹0";

  if (compact) {
    if (Math.abs(amount) >= 10000000) {
      const cr = amount / 10000000;
      return `₹${cr % 1 === 0 ? cr : cr.toFixed(2)} Cr`;
    }
    if (Math.abs(amount) >= 100000) {
      const lk = amount / 100000;
      return `₹${lk % 1 === 0 ? lk : lk.toFixed(2)} Lakh`;
    }
  }

  const fractionDigits = amount % 1 === 0 ? 0 : 2;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(amount);
}

export const Currency: React.FC<{ 
  amount: number; 
  className?: string; 
  compact?: boolean;
}> = ({
  amount,
  className = "",
  compact = false,
}) => {
  const formatted = formatINR(amount, compact);
  const fullFormatted = formatINR(amount, false);

  return (
    <span 
      className={`font-mono font-semibold ${className}`}
      title={fullFormatted}
    >
      {formatted}
    </span>
  );
};
