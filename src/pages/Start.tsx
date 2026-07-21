import { Link } from "react-router-dom";
import { ShieldCheck, UserCheck, ChevronRight } from "lucide-react";
import { Logo } from "@sqdesign-ai/dgree-ds-react";
import { useStore, ownerTeamOfYacht } from "../store";
import { CURRENT_TC_VERSION, CURRENT_PRIVACY_VERSION } from "../data/mock";
import { ACTIVATION_YACHT_ID } from "../config";

/**
 * The prototype covers two sides of the same data: what an administrator sets
 * up, and what the person they invited then goes through. They share a store,
 * so a change on one side shows up on the other — this page is just the door
 * to each.
 */
export default function Start() {
  useStore();
  const team = ownerTeamOfYacht(ACTIVATION_YACHT_ID);
  const pending = team.filter(
    (m) =>
      m.tcVersion !== CURRENT_TC_VERSION ||
      m.privacyVersion !== CURRENT_PRIVACY_VERSION
  ).length;

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-6 py-16">
      <div className="w-full max-w-xl">
        <div className="mb-10 flex flex-col items-center">
          <Logo className="h-8 w-auto" />
          <div className="mt-1.5 text-[9px] font-semibold tracking-[0.35em] text-nav-section">
            YACHTING
          </div>
        </div>

        <h1 className="text-center text-xl font-semibold text-white">
          Access management prototype
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-relaxed text-muted">
          Two surfaces over one set of data. What you change in the admin shows
          up in the activation flow, and the other way round.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Door
            to="/access"
            icon={<ShieldCheck className="size-5" />}
            title="Admin"
            body="Accounts, brands, teams and the fleet. Invite people, build teams, link yachts."
            meta="Access management · D.gree fleet"
          />
          <Door
            to="/activation"
            icon={<UserCheck className="size-5" />}
            title="Account activation"
            body="What an invited person meets when they first sign in — password, terms, power of attorney."
            meta={
              pending === 0
                ? "Everyone is up to date"
                : `${pending} ${
                    pending === 1 ? "person has" : "people have"
                  } something to accept`
            }
          />
        </div>

        <p className="mt-8 text-center text-xs text-muted">
          Nothing here is a gate — both doors are open, and the data resets if
          you clear the browser storage.
        </p>
      </div>
    </div>
  );
}

function Door({
  to,
  icon,
  title,
  body,
  meta,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  meta: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-4 rounded-xl border border-line bg-surface p-5 transition-colors hover:border-brand/60 hover:bg-hover/40"
    >
      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-nav text-brand">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-white">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted">
          {body}
        </span>
        <span className="mt-2 block text-[11px] text-nav-section">{meta}</span>
      </span>
      <ChevronRight className="mt-3 size-4 shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
