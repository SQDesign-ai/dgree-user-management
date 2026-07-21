import { Link } from "react-router-dom";
import { ShieldCheck, UserCheck, ChevronRight } from "lucide-react";
import { Logo } from "@sqdesign-ai/dgree-ds-react";
import { Card } from "../components/ui";
import type { YachtRole } from "../data/mock";

const ROLES: { role: YachtRole; label: string }[] = [
  { role: "owner", label: "Owner" },
  { role: "captain", label: "Captain" },
  { role: "crew", label: "Crew" },
  { role: "guest", label: "Guest" },
];

/**
 * The prototype covers two sides of the same data: what an administrator sets
 * up, and what the person they invited then goes through.
 *
 * Activation forks by role here rather than inside the flow, so each one is its
 * own entry and nothing has to be explained before you open it.
 */
export default function Start() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10 flex flex-col items-center">
          <Logo className="h-8 w-auto" />
          <div className="mt-1.5 text-[9px] font-semibold tracking-[0.35em] text-nav-section">
            YACHTING
          </div>
        </div>

        <h1 className="mb-6 text-center text-xl font-semibold text-white">
          Access management prototype
        </h1>

        <Card className="mb-4 p-5">
          <Header icon={<ShieldCheck className="size-5" />} title="Admin" />
          <Row to="/access" label="Access management" />
        </Card>

        <Card className="p-5">
          <Header
            icon={<UserCheck className="size-5" />}
            title="Account activation"
          />
          {ROLES.map((r) => (
            <Row key={r.role} to={`/activation/${r.role}`} label={r.label} />
          ))}
        </Card>
      </div>
    </div>
  );
}

function Header({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-3 border-b border-line pb-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-nav text-brand">
        {icon}
      </span>
      <span className="text-sm font-semibold text-white">{title}</span>
    </div>
  );
}

function Row({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-lg border border-line px-4 py-3 text-sm text-white transition-colors hover:border-brand/60 hover:bg-hover/40 [&+&]:mt-2"
    >
      <span className="min-w-0 flex-1">{label}</span>
      <ChevronRight className="size-4 shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
