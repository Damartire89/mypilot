import Logo from "./Logo";

export default function TopBar({ company = "Taxi Martin" }) {
  const initials = company.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="bg-[#1a1a2e] px-4 py-3 flex items-center justify-between">
      <Logo size={22} />
      <div className="w-8 h-8 rounded-full bg-[#3fa9f5] flex items-center justify-center text-white text-xs font-bold">
        {initials}
      </div>
    </div>
  );
}
