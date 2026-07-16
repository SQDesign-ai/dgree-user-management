import { type ReactNode } from "react";
import { Search } from "lucide-react";
import {
  Badge as DsBadge,
  type BadgeTone as DsBadgeTone,
} from "@sqdesign-ai/dgree-ds-react";
import { STAGE_META, type YachtStage } from "../data/mock";

// Categorisation (roles, PoA, team names…) belongs on Tag — Badge is for
// semantic status only.
export { Tag, tagColorFor, TAG_COLORS, Chip, NumberBadge } from "@sqdesign-ai/dgree-ds-react";
export type { TagColor } from "@sqdesign-ai/dgree-ds-react";

// ---- Badge ---------------------------------------------------------------

/**
 * The app's tones predate the DS, so they're mapped onto its semantic set.
 * `brand`/`outline` have no semantic meaning — those call sites are
 * categorical and should move to Tag.
 */
type Tone = "neutral" | "success" | "warn" | "danger" | "brand" | "outline";

const toneMap: Record<Tone, DsBadgeTone> = {
  neutral: "neutral",
  success: "success",
  warn: "warning",
  danger: "danger",
  brand: "info",
  outline: "neutral",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
  /**
   * Deliberately not forwarded to the DS. The two mean different things: here
   * it meant "a dot inside the filled pill", whereas the DS's `dot` swaps the
   * pill out for a bare dot + label ("colour only, for tight rows"). Passing it
   * through silently stripped the pill everywhere, so we render the DS's
   * default pill and ignore it.
   */
  dot?: boolean;
}) {
  return <DsBadge tone={toneMap[tone]}>{children}</DsBadge>;
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

// Straight from the design system — its variants (primary | secondary | ghost
// | danger) already match what this app used, and ButtonProps extends
// ButtonHTMLAttributes, so onClick/className carry over unchanged.
export { Button, IconButton } from "@sqdesign-ai/dgree-ds-react";
export type { ButtonProps, ButtonVariant } from "@sqdesign-ai/dgree-ds-react";

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

// From the DS — it carries the surface, border, radius and shadow, and takes
// the same {children, className} this app was already passing.
export { Card } from "@sqdesign-ai/dgree-ds-react";

// ---- Empty state ---------------------------------------------------------

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center text-sm text-muted">
      {children}
    </div>
  );
}
