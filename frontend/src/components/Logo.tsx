import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 36,
  className = "",
  showText = false,
  textClassName = "",
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        style={{ width: size, height: size }}
        className="relative shrink-0 rounded-xl overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Clean Dark Stone Base */}
          <rect width="100" height="100" rx="24" fill="#1C1917" />

          {/* Simple Bold Amber Z */}
          <path
            d="M 28 30 H 72 L 32 70 H 72"
            stroke="#F59E0B"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showText && (
        <span className={`font-serif text-lg font-bold tracking-tight text-stone-900 group-hover:text-amber-800 transition-colors ${textClassName}`}>
          Zetsu
        </span>
      )}
    </div>
  );
};
