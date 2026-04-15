export default function Logo({ size = 28, dark = false }) {
  const svgSize = size * 0.85;
  const accent = dark ? "#06b6d4" : "var(--brand)";
  const textColor = dark ? "#f1f5f9" : "var(--text)";
  return (
    <div className="flex items-baseline gap-0">
      <span style={{ fontSize: size, fontWeight: 900, color: textColor, lineHeight: 1 }}>my</span>
      <span style={{ fontSize: size, fontWeight: 900, color: accent, lineHeight: 1 }}>pil</span>
      <svg
        width={svgSize}
        height={svgSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginBottom: "1px", marginLeft: "1px", marginRight: "1px" }}
      >
        <circle cx="16" cy="16" r="13" stroke={accent} strokeWidth="3" fill="none" />
        <circle cx="16" cy="16" r="3.5" fill={accent} />
        <line x1="16" y1="12.5" x2="16" y2="3" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="13.5" y1="19" x2="6" y2="27" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="18.5" y1="19" x2="26" y2="27" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span style={{ fontSize: size, fontWeight: 900, color: accent, lineHeight: 1 }}>t</span>
    </div>
  );
}
