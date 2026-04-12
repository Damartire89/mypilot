export default function Logo({ size = 28 }) {
  const svgSize = size * 0.85;
  return (
    <div className="flex items-baseline gap-0">
      <span style={{ fontSize: size, fontWeight: 900, color: "#1a1a2e", lineHeight: 1 }}>my</span>
      <span style={{ fontSize: size, fontWeight: 900, color: "#3fa9f5", lineHeight: 1 }}>pil</span>
      <svg
        width={svgSize}
        height={svgSize}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginBottom: "1px", marginLeft: "1px", marginRight: "1px" }}
      >
        <circle cx="16" cy="16" r="13" stroke="#3fa9f5" strokeWidth="3" fill="none" />
        <circle cx="16" cy="16" r="3.5" fill="#3fa9f5" />
        <line x1="16" y1="12.5" x2="16" y2="3" stroke="#3fa9f5" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="13.5" y1="19" x2="6" y2="27" stroke="#3fa9f5" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="18.5" y1="19" x2="26" y2="27" stroke="#3fa9f5" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span style={{ fontSize: size, fontWeight: 900, color: "#3fa9f5", lineHeight: 1 }}>t</span>
    </div>
  );
}
