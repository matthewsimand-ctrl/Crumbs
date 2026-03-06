import React from 'react';

interface CrumbsLogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

export const CrumbsLogo: React.FC<CrumbsLogoProps> = ({
  className = '',
  iconClassName = 'w-10 h-10',
  textClassName = 'text-xl font-bold tracking-tight text-amber-900',
  showText = true,
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      <svg
        viewBox="0 0 48 48"
        className={`${iconClassName} rounded-xl shadow-lg shadow-amber-200`.trim()}
        role="img"
        aria-label="Crumbs logo"
      >
        <defs>
          <linearGradient id="crumbsGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#B45309" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#crumbsGradient)" />
        <path
          d="M13 25c0-4.8 4.3-8.7 9.5-8.7 4.2 0 7.7 2.4 8.9 5.8 2.1.4 3.6 2 3.6 4 0 2.2-1.9 4-4.3 4H17.1c-2.3 0-4.1-1.7-4.1-3.9 0-.6.1-.9 0-1.2z"
          fill="#FFF7ED"
          opacity="0.96"
        />
        <circle cx="18" cy="35" r="2" fill="#FB923C" />
        <circle cx="24" cy="36.5" r="1.7" fill="#FDBA74" />
        <circle cx="29" cy="34.5" r="1.5" fill="#FED7AA" />
      </svg>
      {showText && <span className={textClassName}>Crumbs</span>}
    </div>
  );
};
