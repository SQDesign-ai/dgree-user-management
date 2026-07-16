import { type ReactNode } from "react";
import { Search } from "lucide-react";
import { STAGE_META, type YachtStage } from "../data/mock";

// ---- Badge ---------------------------------------------------------------

type Tone = "neutral" | "success" | "warn" | "danger" | "brand" | "outline";

const toneMap: Record<Tone, string> = {
  neutral: "bg-white/[0.06] text-ink-3 border border-white/10",
  success: "bg-success/15 text-success border border-success/25",
  warn: "bg-warn/15 text-warn border border-warn/25",
  danger: "bg-danger/15 text-danger border border-danger/25",
  brand: "bg-brand/20 text-[#9dc0ff] border border-brand/30",
  outline: "bg-transparent text-ink-3 border border-line",
};

export function Badge({
  children,
  tone = "neutral",
  dot = false,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
}) {
  const dotColor: Record<Tone, string> = {
    neutral: "bg-muted",
    success: "bg-success",
    warn: "bg-warn",
    danger: "bg-danger",
    brand: "bg-brand",
    outline: "bg-muted",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${toneMap[tone]}`}
    >
      {dot && <span className={`size-1.5 rounded-full ${dotColor[tone]}`} />}
      {children}
    </span>
  );
}

/** Badge for a yacht's delivery lifecycle stage. */
export function StageBadge({
  stage,
  dot = true,
}: {
  stage: YachtStage;
  dot?: boolean;
}) {
  const m = STAGE_META[stage];
  return (
    <Badge tone={m.tone} dot={dot}>
      {m.short}
    </Badge>
  );
}

// ---- Button --------------------------------------------------------------

export function Button({
  children,
  variant = "primary",
  onClick,
  className = "",
}: {
  children: ReactNode;
  variant?: "primary" | "ghost" | "secondary" | "danger";
  onClick?: () => void;
  className?: string;
}) {
  const styles = {
    primary:
      "bg-brand hover:bg-brand-hover text-white shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset]",
    secondary: "bg-surface-3 hover:bg-hover text-ink-2 border border-line",
    ghost: "bg-transparent hover:bg-white/[0.06] text-ink-3 border border-line",
    // Destructive, but outlined — it shouldn't out-shout the primary action.
    danger: "bg-danger/10 hover:bg-danger/20 text-danger border border-danger/40",
  }[variant];
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

// ---- Search input --------------------------------------------------------

export function SearchInput({ placeholder }: { placeholder: string }) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
        placeholder={placeholder}
        className="w-full rounded-lg border border-line bg-surface/60 py-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}

// ---- Avatar --------------------------------------------------------------

const AVATAR_TINTS = [
  "from-[#2d5bb8] to-[#1c3a78]",
  "from-[#3a6ea5] to-[#22406e]",
  "from-[#4b5ea8] to-[#2a3a70]",
  "from-[#356a8f] to-[#1f4560]",
];

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const tint =
    AVATAR_TINTS[
      name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TINTS.length
    ];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${tint} font-semibold text-white`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}

// ---- Tabs ----------------------------------------------------------------

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-6 border-b border-line">
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
              on
                ? "border-brand text-white"
                : "border-transparent text-ink-4 hover:text-ink-2"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ---- Card ----------------------------------------------------------------

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-line bg-surface/70 ${className}`}
    >
      {children}
    </div>
  );
}

// ---- Empty state ---------------------------------------------------------

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center text-sm text-muted">
      {children}
    </div>
  );
}
