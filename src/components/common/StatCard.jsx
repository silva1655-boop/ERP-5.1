import { card } from "../../utils/constants";

const COLOR_MAP = {
  navy:    "border-blue-200 bg-blue-50   text-blue-800",
  blue:    "border-blue-200 bg-blue-50   text-blue-700",
  red:     "border-red-200  bg-red-50    text-red-600",
  amber:   "border-amber-200 bg-amber-50 text-amber-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cyan:    "border-cyan-200 bg-cyan-50   text-cyan-700",
};

export function StatCard({ icon: Icon, label, value, sub, color = "navy" }) {
  return (
    <div className={`${card} p-5 flex items-center gap-4`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${COLOR_MAP[color] || COLOR_MAP.navy}`}>
        <Icon size={20}/>
      </div>
      <div>
        <p className="text-gray-500 text-xs font-medium mb-0.5">{label}</p>
        <p className="text-gray-900 font-bold text-2xl leading-none">{value}</p>
        {sub && <p className="text-gray-400 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}
