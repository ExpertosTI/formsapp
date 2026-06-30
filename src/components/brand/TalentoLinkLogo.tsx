interface Props {
  size?: "sm" | "md";
  className?: string;
}

export function TalentoLinkLogo({ size = "md", className = "" }: Props) {
  const box = size === "sm" ? "w-9 h-9 text-xs" : "w-11 h-11 text-sm";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`${box} relative flex items-center justify-center rounded-xl font-black tracking-tighter text-[var(--tl-bg)] shadow-lg`}
        style={{
          background: "linear-gradient(135deg, #2dd4bf 0%, #6366f1 100%)",
          boxShadow: "0 4px 20px -4px rgba(45, 212, 191, 0.45)",
        }}
      >
        <span className="relative z-10">TL</span>
        <div
          className="absolute inset-0 rounded-xl opacity-40"
          style={{ background: "radial-gradient(circle at 30% 25%, #fff, transparent 60%)" }}
        />
      </div>
      <div className="leading-none">
        <p
          className={`font-semibold tracking-tight text-white ${size === "sm" ? "text-sm" : "text-[15px]"}`}
          style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}
        >
          Talento<span className="text-teal-400">Link</span>
        </p>
        {size !== "sm" && (
          <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.2em] text-slate-500">
            renace
          </p>
        )}
      </div>
    </div>
  );
}
