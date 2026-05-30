import { ST } from "../../utils/constants";

// Named export for use by pages that import { Badge }
export function Badge({ s, label }) {
  const c = ST[s] || { label: s, cls: "text-gray-600 bg-gray-100 border-gray-300" };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-semibold ${c.cls}`}>
      {label || c.label}
    </span>
  );
}

// Default export for backward-compat with old import style
export default Badge;
