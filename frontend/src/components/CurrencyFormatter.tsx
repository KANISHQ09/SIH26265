import React from "react";

export function formatINR(amount: number): string {
  if (amount === undefined || amount === null) return "₹ 0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export const Currency: React.FC<{ amount: number; className?: string }> = ({
  amount,
  className = "",
}) => {
  return <span className={`font-mono font-semibold ${className}`}>{formatINR(amount)}</span>;
};
