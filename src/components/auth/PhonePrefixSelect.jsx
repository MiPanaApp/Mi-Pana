export default function PhonePrefixSelect({ value, onChange }) {
  const options = [
    { label: "🇪🇸 España", value: "+34" },
    { label: "🇺🇸 USA", value: "+1" },
    { label: "🇨🇴 Colombia", value: "+57" },
    { label: "🇨🇱 Chile", value: "+56" },
    { label: "🇻🇪 Venezuela", value: "+58" },
  ];

  return (
    <div className="w-[118px] flex-shrink-0 bg-[#E8E8F0] rounded-[14px] shadow-[inset_4px_4px_9px_rgba(180,180,210,0.55),inset_-4px_-4px_9px_rgba(255,255,255,0.9)] relative overflow-hidden">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-full appearance-none bg-transparent py-[13px] pl-3 pr-2 outline-none font-sans text-[12px] font-bold text-[#1A1A3A]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label} ({opt.value})
          </option>
        ))}
      </select>
    </div>
  );
}
