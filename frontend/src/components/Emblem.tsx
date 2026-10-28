import React from "react";

interface EmblemProps {
  className?: string;
  size?: number;
}

export const Emblem: React.FC<EmblemProps> = ({ className = "text-stone-900", size = 48 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Zetsu AICTE Regulatory Trust Emblem"
    >
      {/* Concentric outer provenance rings */}
      <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="50" cy="50" r="41" stroke="currentColor" strokeWidth="1.25" strokeOpacity="0.85" />
      <circle cx="50" cy="50" r="36" stroke="currentColor" strokeWidth="1" strokeOpacity="0.65" strokeDasharray="3 2" />

      {/* Geometric Sacred Triad: Institution, Bank, Regulatory Council */}
      <polygon
        points="50,15 82,73 18,73"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <polygon
        points="50,27 73,69 27,69"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <polygon
        points="50,37 65,65 35,65"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Inverted grounding triangle (Vigilance & Audit Ledger) */}
      <polygon
        points="50,85 18,27 82,27"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        strokeOpacity="0.45"
      />

      {/* Central 24-spoke Trust Hub (Ashoka / Dharma Regulatory integrity) */}
      <circle cx="50" cy="50" r="5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="50" cy="50" r="2" fill="currentColor" />
    </svg>
  );
};
