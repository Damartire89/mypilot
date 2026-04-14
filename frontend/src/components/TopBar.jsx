import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";

export default function TopBar() {
  const { company } = useAuth();
  const name = company?.name || "myPilot";
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      background: "var(--surface)", borderBottom: "1px solid var(--border)",
      padding: "0 16px", height: "52px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <Logo size={20} />
      <div style={{
        width: 32, height: 32, borderRadius: "8px",
        background: "var(--brand)", color: "white",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "12px", fontWeight: 700,
      }}>
        {initials}
      </div>
    </div>
  );
}
