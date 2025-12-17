import React from 'react';

// Exact replica of logo option #2 from PDF
// Side-profile standing Dalmatian
export const DalmatianLogo = ({ className = "h-12 w-auto" }: { className?: string }) => (
  <svg viewBox="0 0 200 140" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Main body - simplified sleek profile */}
    <path
      d="M40 70 C40 60 45 55 55 55 L145 55 C155 55 165 60 170 70 L170 95 C170 105 165 110 155 110 L60 110 C50 110 40 100 40 85 Z"
      fill="white"
      stroke="#1e293b"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Head - pointing left */}
    <ellipse
      cx="38"
      cy="68"
      rx="18"
      ry="22"
      fill="white"
      stroke="#1e293b"
      strokeWidth="2.5"
    />

    {/* Snout */}
    <path
      d="M20 68 C18 65 18 62 20 60 C23 58 27 58 29 60 C30 63 30 66 28 68 C26 70 22 70 20 68 Z"
      fill="white"
      stroke="#1e293b"
      strokeWidth="2"
    />

    {/* Nose - black */}
    <ellipse cx="21" cy="64" rx="3" ry="4" fill="#1e293b"/>

    {/* Eye */}
    <circle cx="42" cy="65" r="3" fill="#1e293b"/>
    <circle cx="43.5" cy="63.5" r="1" fill="white"/>

    {/* Ear - hanging down */}
    <path
      d="M45 55 C45 50 42 45 38 45 C34 45 30 48 30 55 C30 60 32 65 35 68"
      fill="white"
      stroke="#1e293b"
      strokeWidth="2.5"
      strokeLinecap="round"
    />

    {/* Spot on ear */}
    <circle cx="36" cy="52" r="3" fill="#1e293b"/>

    {/* Body spots - scattered naturally */}
    <circle cx="70" cy="68" r="5" fill="#1e293b"/>
    <circle cx="90" cy="75" r="4" fill="#1e293b"/>
    <circle cx="105" cy="65" r="6" fill="#1e293b"/>
    <circle cx="125" cy="72" r="4.5" fill="#1e293b"/>
    <circle cx="145" cy="68" r="5" fill="#1e293b"/>
    <circle cx="85" cy="90" r="4" fill="#1e293b"/>
    <circle cx="110" cy="88" r="3.5" fill="#1e293b"/>
    <circle cx="135" cy="85" r="4" fill="#1e293b"/>
    <circle cx="58" cy="82" r="3" fill="#1e293b"/>
    <circle cx="155" cy="78" r="3.5" fill="#1e293b"/>

    {/* Front left leg */}
    <rect
      x="60"
      y="110"
      width="8"
      height="22"
      rx="1"
      fill="white"
      stroke="#1e293b"
      strokeWidth="2.5"
    />
    <circle cx="64" cy="95" r="3" fill="#1e293b"/>

    {/* Front right leg */}
    <rect
      x="85"
      y="110"
      width="8"
      height="22"
      rx="1"
      fill="white"
      stroke="#1e293b"
      strokeWidth="2.5"
    />

    {/* Back left leg */}
    <rect
      x="125"
      y="110"
      width="8"
      height="22"
      rx="1"
      fill="white"
      stroke="#1e293b"
      strokeWidth="2.5"
    />

    {/* Back right leg */}
    <rect
      x="148"
      y="110"
      width="8"
      height="22"
      rx="1"
      fill="white"
      stroke="#1e293b"
      strokeWidth="2.5"
    />

    {/* Paws - small black pads */}
    <ellipse cx="64" cy="133" rx="5" ry="2" fill="#1e293b"/>
    <ellipse cx="89" cy="133" rx="5" ry="2" fill="#1e293b"/>
    <ellipse cx="129" cy="133" rx="5" ry="2" fill="#1e293b"/>
    <ellipse cx="152" cy="133" rx="5" ry="2" fill="#1e293b"/>

    {/* Tail - curved upward */}
    <path
      d="M168 95 C175 95 180 90 185 80 C187 75 186 70 184 68"
      stroke="#1e293b"
      strokeWidth="3.5"
      strokeLinecap="round"
      fill="none"
    />
    {/* Spot on tail */}
    <circle cx="178" cy="82" r="3" fill="#1e293b"/>
  </svg>
);

// Brand text with cyan checkmark in the "o"
export const CoachDogBrandText = ({ className = "text-3xl" }: { className?: string }) => (
  <span className={`${className} font-display font-extrabold text-slate-900 tracking-tight flex items-center`}>
    CoachD
    <span className="relative mx-0.5 inline-flex items-center justify-center h-[0.8em] w-[0.8em] bg-cyan-500 rounded-full text-white shadow-md ring-2 ring-white">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="h-[0.5em] w-[0.5em]">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
    g
  </span>
);

// Full logo - Dalmatian + Text
export const CoachDogFullLogo = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center space-x-3 ${className}`}>
    <DalmatianLogo className="h-12 w-auto" />
    <CoachDogBrandText className="text-2xl" />
  </div>
);
