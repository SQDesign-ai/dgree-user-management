import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutGrid, Columns2, Ship, ShieldCheck, Check } from "lucide-react";
import { useExperience, setExperience, type Experience } from "../experience";

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 items-center justify-center rounded-lg bg-white/10">
        <Ship className="size-5 text-white" />
      </div>
      <div className="leading-none">
        <div className="text-lg font-bold tracking-tight text-white">D.gree</div>
        <div className="mt-1 text-[9px] font-semibold tracking-[0.35em] text-nav-section">
          YACHTING
        </div>
      </div>
    </div>
  );
}

function OptionCard({
  id,
  active,
  icon,
  title,
  tagline,
  onPick,
}: {
  id: Experience;
  active: boolean;
  icon: ReactNode;
  title: string;
  tagline: string;
  onPick: (e: Experience) => void;
}) {
  return (
    <button
      onClick={() => onPick(id)}
      className={`flex flex-col rounded-2xl border p-6 text-left transition-colors ${
        active
          ? "border-brand bg-brand/10 ring-1 ring-brand/40"
          : "border-line bg-surface/70 hover:border-brand/50 hover:bg-hover/30"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex size-11 items-center justify-center rounded-xl bg-brand/15 text-brand">
          {icon}
        </div>
        {active && (
          <span className="flex items-center gap-1.5 rounded-full bg-brand/20 px-2.5 py-1 text-xs font-semibold text-[#9dc0ff]">
            <Check className="size-3.5" strokeWidth={3} />
            Current
          </span>
        )}
      </div>
      <div className="text-lg font-semibold text-white">{title}</div>
      <div className="mt-1 text-sm text-ink-4">{tagline}</div>

      <div
        className={`mt-6 rounded-lg py-2.5 text-center text-sm font-medium ${
          active
            ? "bg-white/[0.06] text-ink-3"
            : "bg-brand text-white"
        }`}
      >
        {active ? "Selected" : "Use this experience"}
      </div>
    </button>
  );
}

export default function ExperienceSelector() {
  const experience = useExperience();
  const navigate = useNavigate();

  function pick(e: Experience) {
    setExperience(e);
    navigate("/");
  }

  return (
    <div className="min-h-full bg-page px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-8 text-2xl font-bold tracking-tight text-white">
            Choose an experience
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-4">
            Two ways to structure the platform, so we can compare them. Yacht
            production and user access get separated differently in each. You can
            switch any time from the sidebar.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <OptionCard
            id="single"
            active={experience === "single"}
            icon={<LayoutGrid className="size-6" />}
            title="Single page"
            tagline="Everything under one Access management page"
            onPick={pick}
          />
          <OptionCard
            id="split"
            active={experience === "split"}
            icon={<Columns2 className="size-6" />}
            title="Two pages"
            tagline="Access and fleet kept separate"
            onPick={pick}
          />
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted">
          <ShieldCheck className="size-3.5" />
          Prototype setting — this only changes the navigation shape, not the data.
        </div>
      </div>
    </div>
  );
}
