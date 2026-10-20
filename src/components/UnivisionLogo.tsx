import React from 'react';

interface UnivisionLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  light?: boolean;
  stacked?: boolean;
  emblemOnly?: boolean;
}

export const UnivisionLogo: React.FC<UnivisionLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  light = false,
  stacked = false,
  emblemOnly = false,
}) => {
  // Sizing definitions
  const iconSize =
    size === 'sm' ? 32 : size === 'lg' ? 56 : size === 'xl' ? 72 : 44;
  const titleSize =
    size === 'sm'
      ? 'text-lg tracking-[0.14em]'
      : size === 'lg'
      ? 'text-2xl tracking-[0.16em]'
      : size === 'xl'
      ? 'text-3xl tracking-[0.18em]'
      : 'text-xl tracking-[0.15em]';
  const subtitleSize =
    size === 'sm'
      ? 'text-[7.5px] tracking-[0.24em]'
      : size === 'lg'
      ? 'text-[10px] tracking-[0.28em]'
      : size === 'xl'
      ? 'text-[12px] tracking-[0.3em]'
      : 'text-[8.5px] tracking-[0.26em]';

  const navyColor = light ? '#ffffff' : '#0d2345';
  const goldColor = '#c59b53';
  const charcoalColor = light ? '#94a3b8' : '#3e3e3e';

  const svgEmblem = (
    <svg
      width={iconSize}
      height={iconSize * 1.05}
      viewBox="0 0 100 105"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-xs ${emblemOnly ? className : ''}`}
    >
      {/* 1. Twin Towers / Skyscrapers rising to the central apex */}
      {/* Left Charcoal Tower */}
      <path
        d="M34.5 10.5L49.2 2.5V36H34.5V10.5Z"
        fill={charcoalColor}
      />
      {/* Right Architectural Gold Tower */}
      <path
        d="M50.8 2.5L65.5 10.5V36H50.8V2.5Z"
        fill={goldColor}
      />

      {/* 2. Gabled House in the center cavity */}
      {/* Main Navy Gable Roof */}
      <path
        d="M50 20.5L68.5 35L64.5 38.5L50 27L35.5 38.5L31.5 35L50 20.5Z"
        fill={navyColor}
      />
      {/* Golden Roof Accent / Eave Trim */}
      <path
        d="M50 29.5L63.5 39.5L61.8 41.5L50 32.5L38.2 41.5L36.5 39.5L50 29.5Z"
        fill={goldColor}
      />

      {/* 4 Golden Square Windows (2x2 Grid) */}
      <rect x="44.8" y="42.5" width="4.2" height="4.2" fill={goldColor} rx="0.3" />
      <rect x="51.0" y="42.5" width="4.2" height="4.2" fill={goldColor} rx="0.3" />
      <rect x="44.8" y="48.2" width="4.2" height="4.2" fill={goldColor} rx="0.3" />
      <rect x="51.0" y="48.2" width="4.2" height="4.2" fill={goldColor} rx="0.3" />

      {/* 3. Outer Navy Hexagonal "U" Frame */}
      <path
        d="M17.5 12.5H31V50.5L50 63.5L69 50.5V12.5H82.5V58L50 80.5L17.5 58V12.5Z"
        fill={navyColor}
      />
    </svg>
  );

  if (emblemOnly) {
    return svgEmblem;
  }

  return (
    <div
      className={`flex ${
        stacked ? 'flex-col items-center text-center' : 'items-center gap-3'
      } ${className}`}
    >
      {svgEmblem}

      {/* Typography Lockup */}
      <div className={`flex flex-col ${stacked ? 'items-center mt-2' : ''}`}>
        {/* Brand Name */}
        <span
          className={`font-black font-sans leading-none ${titleSize} ${
            light ? 'text-white' : 'text-[#0d2345]'
          }`}
        >
          UNIVISION
        </span>

        {showSubtitle && (
          <div className="flex flex-col mt-1">
            {/* Elegant Golden Divider Line with Centered Diamond */}
            <div className="flex items-center gap-1.5 my-0.5">
              <div className="h-[1px] flex-1 bg-[#c59b53]/80" />
              <div className="w-1.5 h-1.5 rotate-45 bg-[#c59b53] shrink-0" />
              <div className="h-[1px] flex-1 bg-[#c59b53]/80" />
            </div>

            {/* Subtitle */}
            <span
              className={`font-bold font-sans uppercase leading-tight ${subtitleSize} ${
                light ? 'text-slate-200' : 'text-[#0d2345]'
              }`}
            >
              DESIGN AND CONSTRUCTION LTD.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
