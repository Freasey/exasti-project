/**
 * Ilustrasi pesepeda + siluet kota. Dipakai di banner dashboard dan
 * panel brand halaman login. Murni SVG supaya ringan dan ikut tema.
 */
export function CyclistScene({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 520 300"
      className={className}
      style={style}
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="eco-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8be04e" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#8be04e" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="eco-city" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2d5a1c" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#12240b" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="eco-road" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8be04e" stopOpacity="0" />
          <stop offset="45%" stopColor="#8be04e" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#8be04e" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="520" height="300" fill="url(#eco-sky)" />

      {/* skyline belakang */}
      <g fill="url(#eco-city)">
        <path d="M0 210h34v-58h20v58h26v-84h30v84h24v-46h26v46h30v-70h22v70h34v-52h26v52h30v-96h24v96h28v-40h24v40h34v-64h22v64h32v-44h24v44H0z" />
      </g>
      <circle cx="66" cy="150" r="26" stroke="#3d7a24" strokeWidth="3" opacity=".55" />
      <circle cx="66" cy="150" r="4" fill="#3d7a24" opacity=".55" />

      {/* pepohonan */}
      <g fill="#1f4413" opacity=".9">
        <path d="M18 210v-16m0-6a11 11 0 1 1 .1 0Z" stroke="#2d6b1a" strokeWidth="3" />
        <circle cx="18" cy="184" r="12" />
        <circle cx="470" cy="188" r="14" />
        <rect x="468" y="196" width="4" height="16" />
        <circle cx="440" cy="192" r="10" />
        <rect x="438" y="198" width="4" height="13" />
      </g>

      {/* jalan */}
      <rect x="0" y="209" width="520" height="2.5" fill="url(#eco-road)" />

      {/* garis kecepatan */}
      <g stroke="#8be04e" strokeLinecap="round" opacity=".45">
        <path d="M40 120h58" strokeWidth="3" />
        <path d="M22 142h40" strokeWidth="2.5" />
        <path d="M54 164h34" strokeWidth="2" />
      </g>

      {/* sepeda + rider */}
      <g transform="translate(105 0)">
        <g stroke="#0f1a0c" strokeWidth="5.5" strokeLinecap="round" fill="none">
          <circle cx="120" cy="170" r="34" />
          <circle cx="300" cy="170" r="34" />
        </g>
        <g stroke="#8be04e" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity=".9">
          <circle cx="120" cy="170" r="34" />
          <circle cx="300" cy="170" r="34" />
        </g>

        {/* rangka */}
        <g
          stroke="#0f1a0c"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <path d="M205 170 190 118M190 118h95M205 170l88-28M205 170h-85M190 118l-70 52M293 142l7 28M285 118l18-8" />
        </g>
        <g
          stroke="#c8f2a4"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity=".55"
        >
          <path d="M205 170 190 118M190 118h95M205 170l88-28M205 170h-85M190 118l-70 52" />
        </g>
        <circle cx="205" cy="170" r="7" fill="#0f1a0c" />
        <path d="M182 112h18" stroke="#0f1a0c" strokeWidth="8" strokeLinecap="round" />

        {/* rider */}
        <g fill="none" stroke="#0f1a0c" strokeLinecap="round" strokeLinejoin="round">
          <path d="M191 110 246 76" strokeWidth="16" />
          <path d="M246 76l46 32" strokeWidth="10" />
          <path d="M191 110l26 34 -12 26" strokeWidth="11" />
          <path d="M196 112l30 24 -6 32" strokeWidth="9" opacity=".75" />
        </g>
        <circle cx="262" cy="62" r="14" fill="#0f1a0c" />
        <path
          d="M248 58a14 14 0 0 1 28-2l4 3-32 3z"
          fill="#0f1a0c"
          stroke="#8be04e"
          strokeWidth="2"
        />
        <path d="M274 66l8 2" stroke="#0f1a0c" strokeWidth="5" strokeLinecap="round" />
      </g>

      {/* daun melayang */}
      <g fill="#8be04e" opacity=".75">
        <path d="M424 92c6-6 15-6 19-5 .8 4.6-.8 12.6-7 15.6-3.9 1.9-8.4.6-10.4-2.5-2-3.1-1.4-5.9-1.6-8.1Z" />
        <path d="M388 132c4-4 10-4 12.6-3.3.5 3-.6 8.4-4.7 10.4-2.6 1.2-5.6.4-6.9-1.7-1.3-2-.9-3.9-1-5.4Z" opacity=".6" />
        <path d="M462 148c3-3 7.6-3 9.5-2.5.4 2.3-.4 6.4-3.5 7.9-2 .9-4.2.3-5.2-1.3-1-1.6-.7-3-.8-4.1Z" opacity=".45" />
      </g>
    </svg>
  );
}
