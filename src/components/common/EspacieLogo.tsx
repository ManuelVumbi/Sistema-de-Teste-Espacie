import React from "react";

interface EspacieLogoProps {
  variant?: "full" | "mark" | "badge";
  theme?: "light" | "dark" | "on-dark";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showSubtitle?: boolean;
}

export function EspacieLogo({
  variant = "full",
  theme = "on-dark",
  size = "md",
  className = "",
  showSubtitle = true,
}: EspacieLogoProps) {
  // Dimension presets
  const sizeConfig = {
    xs: { h: "h-6", markW: 24, markH: 24, text: "text-base", sub: "text-[8px]" },
    sm: { h: "h-8", markW: 30, markH: 30, text: "text-lg", sub: "text-[9px]" },
    md: { h: "h-10", markW: 36, markH: 36, text: "text-xl", sub: "text-[10px]" },
    lg: { h: "h-12", markW: 44, markH: 44, text: "text-2xl", sub: "text-[11px]" },
    xl: { h: "h-16", markW: 56, markH: 56, text: "text-3xl", sub: "text-xs" },
  }[size];

  // Colors depending on theme
  const isDarkBackground = theme === "on-dark" || theme === "dark";
  const textColor = isDarkBackground ? "text-slate-100" : "text-[#0A2540]";
  const subColor = isDarkBackground ? "text-slate-400" : "text-[#64748B]";
  const markPrimary = isDarkBackground ? "#38BDF8" : "#0A2540";
  const markSecondary = isDarkBackground ? "#0284C7" : "#002B49";

  // Mark SVG element based on exact brand curves from Espacie Services logo
  const Emblem = ({ w = 36, h = 36 }: { w?: number; h?: number }) => (
    <svg
      width={w}
      height={h}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Top dynamic curved blade / wing */}
      <path
        d="M22 14 C36 12 56 22 66 40 C60 41 46 41 36 38 C23 34 17 25 22 14 Z"
        fill={markPrimary}
      />
      <path
        d="M50 16 C63 24 72 38 70 48 C63 48 50 43 43 36 C34 27 41 19 50 16 Z"
        fill={markSecondary}
      />
      {/* Bottom dynamic curved blade / wing */}
      <path
        d="M14 66 C9 56 12 38 29 25 C31 30 35 41 38 48 C40 59 27 65 14 66 Z"
        fill={markSecondary}
      />
      <path
        d="M28 70 C40 70 60 61 70 42 C65 44 51 51 42 53 C29 56 23 64 28 70 Z"
        fill={markPrimary}
      />
    </svg>
  );

  if (variant === "mark") {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <Emblem w={sizeConfig.markW} h={sizeConfig.markH} />
      </div>
    );
  }

  if (variant === "badge") {
    return (
      <div
        className={`inline-flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-white border border-slate-200/80 shadow-md ${className}`}
      >
        <svg
          width={sizeConfig.markW}
          height={sizeConfig.markH}
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22 14 C36 12 56 22 66 40 C60 41 46 41 36 38 C23 34 17 25 22 14 Z"
            fill="#0A2540"
          />
          <path
            d="M50 16 C63 24 72 38 70 48 C63 48 50 43 43 36 C34 27 41 19 50 16 Z"
            fill="#002B49"
          />
          <path
            d="M14 66 C9 56 12 38 29 25 C31 30 35 41 38 48 C40 59 27 65 14 66 Z"
            fill="#002B49"
          />
          <path
            d="M28 70 C40 70 60 61 70 42 C65 44 51 51 42 53 C29 56 23 64 28 70 Z"
            fill="#0A2540"
          />
        </svg>
        <div className="flex flex-col">
          <span className="font-extrabold text-[#0A2540] tracking-tight leading-none text-base">
            Espacie
          </span>
          {showSubtitle && (
            <span className="text-[8px] font-bold text-[#64748B] tracking-[0.25em] uppercase leading-tight mt-0.5">
              SERVICES
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <Emblem w={sizeConfig.markW} h={sizeConfig.markH} />
      <div className="flex flex-col leading-none">
        <span
          className={`font-black tracking-tight ${textColor} ${sizeConfig.text}`}
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          Espacie
        </span>
        {showSubtitle && (
          <span
            className={`font-bold tracking-[0.28em] uppercase ${subColor} ${sizeConfig.sub} mt-1`}
          >
            SERVICES
          </span>
        )}
      </div>
    </div>
  );
}
