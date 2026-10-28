import React from "react";
import { Emblem } from "./Emblem";

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  subtitle?: string;
  textClassName?: string;
  subtitleClassName?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 36,
  className = "",
  showText = false,
  subtitle = "AICTE FDR & SECURITY DEPOSIT GOVERNANCE PORTAL",
  textClassName = "",
  subtitleClassName = "",
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 shrink-0 ${className}`}>
      <Emblem
        size={size}
        className="text-stone-900 shrink-0 transition-transform group-hover:scale-105"
      />

      {showText && (
        <div className="flex flex-col justify-center leading-none select-none shrink-0">
          <span
            className={`font-serif italic text-xl sm:text-[22px] font-normal text-stone-900 tracking-tight leading-none whitespace-nowrap group-hover:text-amber-800 transition-colors ${textClassName}`}
          >
            zetsu
          </span>
          <span
            className={`hidden sm:block text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5B7B94] mt-1 sm:mt-1.5 leading-none whitespace-nowrap ${subtitleClassName}`}
          >
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
};
