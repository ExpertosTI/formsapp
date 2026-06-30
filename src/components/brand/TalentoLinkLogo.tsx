import Image from "next/image";

interface Props {
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}

const sizes = {
  sm: { img: 32, text: "text-sm" },
  md: { img: 40, text: "text-[15px]" },
  lg: { img: 56, text: "text-lg" },
};

export function TalentoLinkLogo({ size = "md", className = "", showText = true }: Props) {
  const s = sizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Image
        src="/branding/talentolink-logo.png"
        alt="TalentoLink"
        width={s.img}
        height={s.img}
        className="rounded-xl object-cover shrink-0"
        priority
      />
      {showText && (
        <div className="leading-none hidden sm:block">
          <p className={`font-semibold tracking-tight text-white ${s.text}`}>
            Talento<span className="text-teal-400">Link</span>
          </p>
          {size !== "sm" && (
            <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.2em] text-slate-500">
              renace
            </p>
          )}
        </div>
      )}
    </div>
  );
}
