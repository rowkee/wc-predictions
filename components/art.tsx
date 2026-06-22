// Gaudy Oktoberfest illustrations — flat poster SVGs, navy ink outlines.
// Ported from the original design's art.jsx to typed React components.

const INK = "#16243f";

interface ArtProps {
  size?: number;
  style?: React.CSSProperties;
  className?: string;
  rot?: number;
}

const rotStyle = (rot: number, style?: React.CSSProperties): React.CSSProperties =>
  ({ transform: rot ? `rotate(${rot}deg)` : undefined, ...style });

export function Stein({ size = 64, style, className, rot = 0 }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} style={rotStyle(rot, style)}>
      <path d="M42 28 h7 a9 9 0 0 1 0 18 h-7" fill="none" stroke={INK} strokeWidth="3.2" />
      <rect x="13" y="22" width="31" height="33" rx="3" fill="#f4a300" stroke={INK} strokeWidth="3.2" />
      <rect x="13" y="22" width="31" height="9" fill="#ffc94d" />
      <line x1="19" y1="38" x2="38" y2="38" stroke="#d98a00" strokeWidth="2" />
      <line x1="19" y1="46" x2="38" y2="46" stroke="#d98a00" strokeWidth="2" />
      <rect x="17" y="26" width="4.5" height="24" rx="2" fill="#fff0c2" opacity=".8" />
      <path d="M11 24 q-3 -9 7 -9 q1 -8 11 -6 q5 -7 13 -1 q11 -3 9 9 q5 4 -1 9 q-4 4 -9 1 q-6 3 -12 -1 q-7 3 -12 -2 q-6 -1 -4 -9 Z"
        fill="#fff7e4" stroke={INK} strokeWidth="3" />
    </svg>
  );
}

export function Pretzel({ size = 64, style, className, rot = 0 }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} style={rotStyle(rot, style)}>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <g stroke={INK} strokeWidth="12">
          <path d="M15 23 C 13 50 51 50 49 23" />
          <path d="M20 20 C 33 8 39 44 45 51" />
          <path d="M44 20 C 31 8 25 44 19 51" />
        </g>
        <g stroke="#c06a22" strokeWidth="7.5">
          <path d="M15 23 C 13 50 51 50 49 23" />
          <path d="M20 20 C 33 8 39 44 45 51" />
          <path d="M44 20 C 31 8 25 44 19 51" />
        </g>
        <g stroke="#e09a52" strokeWidth="2.4">
          <path d="M16 25 C 15 47 49 47 48 25" />
        </g>
      </g>
      <g fill="#fffaf0">
        <circle cx="24" cy="30" r="1.6" /><circle cx="40" cy="30" r="1.6" />
        <circle cx="32" cy="42" r="1.6" /><circle cx="30" cy="22" r="1.5" /><circle cx="36" cy="38" r="1.5" />
      </g>
    </svg>
  );
}

export function Sausage({ size = 64, style, className, rot = 0 }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} style={rotStyle(rot, style)}>
      <g transform="rotate(-32 32 32)">
        <rect x="6" y="25" width="52" height="16" rx="8" fill="#a85a2a" stroke={INK} strokeWidth="3.2" />
        <rect x="10" y="28" width="44" height="4" rx="2" fill="#c47a44" />
        <g stroke="#6e3614" strokeWidth="2.4" opacity=".7">
          <line x1="20" y1="26" x2="16" y2="40" />
          <line x1="30" y1="26" x2="26" y2="40" />
          <line x1="40" y1="26" x2="36" y2="40" />
        </g>
      </g>
    </svg>
  );
}

export function Ball({ size = 40, style, className, color = INK }: ArtProps & { color?: string }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} style={style}>
      <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="3.2" />
      <g stroke={color} strokeWidth="2.4">
        <line x1="20" y1="6" x2="20" y2="11" /><line x1="33" y1="16" x2="27" y2="16" />
        <line x1="28" y1="32" x2="25" y2="27" /><line x1="12" y1="32" x2="15" y2="27" /><line x1="7" y1="16" x2="13" y2="16" />
      </g>
    </svg>
  );
}

const GARLAND_ICON = { pretzel: Pretzel, stein: Stein, sausage: Sausage };

export function Garland({ items }: { items?: (keyof typeof GARLAND_ICON)[] }) {
  const list = items ?? (["pretzel", "stein", "sausage", "stein", "pretzel", "sausage",
    "pretzel", "stein", "sausage", "stein", "pretzel", "sausage"] as const);
  return (
    <div className="garland">
      {list.map((k, i) => {
        const Icon = GARLAND_ICON[k];
        return (
          <span key={i} className="garland__hang" style={{ "--i": i } as React.CSSProperties}>
            <span className="garland__str" />
            <Icon size={46} rot={i % 2 ? 8 : -8} />
          </span>
        );
      })}
    </div>
  );
}
