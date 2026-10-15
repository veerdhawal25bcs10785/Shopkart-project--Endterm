import React from 'react';

const Logo = ({ size = 'md', showTagline = true, className = '' }) => {
  const isSmall = size === 'sm';

  return (
    <div className={`flex items-center gap-2.5 group select-none ${className}`}>
      {/* Icon Mark Badge */}
      <div className="relative">
        <div
          className={`${
            isSmall ? 'w-7 h-7' : 'w-9 h-9'
          } rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-500 p-[1.5px] shadow-md shadow-indigo-500/25 group-hover:scale-105 group-hover:shadow-indigo-500/40 transition-all duration-300`}
        >
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            {/* Custom stylized cart + lightning speed emblem */}
            <svg
              className={`${
                isSmall ? 'w-3.5 h-3.5' : 'w-5 h-5'
              } text-indigo-400 group-hover:text-white transition-colors`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="20" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="18" cy="20" r="1.5" fill="currentColor" stroke="none" />
              <path d="M2.5 3.5h3.2l2.4 11.2a1.8 1.8 0 0 0 1.8 1.4h8.8a1.8 1.8 0 0 0 1.8-1.4l1.6-7.7H7" />
              <path
                d="M13 7l-2 3h4l-2 3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Brand Wordmark */}
      <div className="flex flex-col">
        <div
          className={`${
            isSmall ? 'text-lg' : 'text-xl'
          } font-black tracking-tight leading-none text-slate-900 flex items-center`}
        >
          <span>Shop</span>
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent ml-0.5">
            Kart
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 ml-1 mb-1.5"></span>
        </div>
        {showTagline && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-none mt-1">
            Marketplace
          </span>
        )}
      </div>
    </div>
  );
};

export default Logo;
