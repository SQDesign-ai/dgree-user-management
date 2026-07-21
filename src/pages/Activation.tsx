import { useState } from "react";
import { Link } from "react-router-dom";
import { Logo, Button, Tag } from "@sqdesign-ai/dgree-ds-react";
import { Card, Avatar } from "../components/ui";
import { MultiSelectField, TextField } from "../components/Drawer";
import { useStore, ownerTeamOfYacht, acceptDocuments, setPoaHolders } from "../store";
import {
  CURRENT_TC_VERSION,
  CURRENT_PRIVACY_VERSION,
  type OwnerTeamMember,
  type YachtRole,
} from "../data/mock";
import {
  ACTIVATION_YACHT_ID as YACHT_ID,
  ACTIVATION_YACHT_NAME as YACHT_NAME,
} from "../config";

const roleLabel: Record<YachtRole, string> = {
  owner: "Owner",
  captain: "Captain",
  crew: "Crew",
  guest: "Guest",
};

type Step = "email" | "password" | "documents" | "poa" | "login";

/**
 * The flow, as drawn: the invitation email leads to a password, then the two
 * documents, then — only for an owner — delegating power of attorney. Everyone
 * ends up at the sign-in screen.
 *
 * Which steps a person meets is derived from their record rather than a flag,
 * so someone who has already accepted the current documents simply signs in.
 */
function stepsFor(m: OwnerTeamMember): Step[] {
  const neverSignedIn = !m.tcVersion && !m.privacyVersion;
  const outOfDate =
    m.tcVersion !== CURRENT_TC_VERSION ||
    m.privacyVersion !== CURRENT_PRIVACY_VERSION;

  const steps: Step[] = [];
  // An invitation is only sent once, so a returning person starts further in.
  if (neverSignedIn) steps.push("email", "password");
  if (outOfDate) steps.push("documents");
  // Delegation is part of activating, not something re-asked at every sign-in.
  if (m.role === "owner" && outOfDate) steps.push("poa");
  steps.push("login");
  return steps;
}

/**
 * People are held as handles elsewhere, but an activation email has to be
 * addressed to something that reads like an address.
 */
function emailOf(m: OwnerTeamMember): string {
  return `${m.handle.replace(/^@/, "").replace(/_/g, ".")}@example.com`;
}

/** One line describing why this person sees what they see. */
function stateOf(m: OwnerTeamMember): { label: string; tone: "new" | "stale" | "ok" } {
  if (!m.tcVersion && !m.privacyVersion)
    return { label: "Invited · never signed in", tone: "new" };
  if (
    m.tcVersion !== CURRENT_TC_VERSION ||
    m.privacyVersion !== CURRENT_PRIVACY_VERSION
  )
    return { label: `Accepted T&C ${m.tcVersion} · now ${CURRENT_TC_VERSION}`, tone: "stale" };
  return { label: "Up to date", tone: "ok" };
}

/** What the person is about to walk through, in words. */
function summarise(steps: Step[]): string {
  const named = steps.filter((s) => s !== "login" && s !== "email");
  if (named.length === 0) return "Sign in only";
  return named
    .map((s) =>
      s === "password" ? "Password" : s === "documents" ? "Documents" : "PoA"
    )
    .join(" · ");
}

// -------------------------------------------------------------------------

export default function Activation() {
  useStore();
  const team = ownerTeamOfYacht(YACHT_ID);

  const [personId, setPersonId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [acceptTc, setAcceptTc] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [attorneyIds, setAttorneyIds] = useState<string[]>([]);
  // Frozen when the flow starts: completing it changes the person's record, so
  // recomputing would shorten the flow underneath whoever is walking it.
  const [steps, setSteps] = useState<Step[]>([]);

  const person = team.find((m) => m.id === personId) ?? null;
  const step = steps[stepIndex];

  function start(m: OwnerTeamMember) {
    setPersonId(m.id);
    setSteps(stepsFor(m));
    setStepIndex(0);
    setPassword("");
    setConfirm("");
    setAcceptTc(false);
    setAcceptPrivacy(false);
    setAttorneyIds(team.filter((t) => t.poa).map((t) => t.id));
  }

  function reset() {
    setPersonId(null);
    setStepIndex(0);
  }

  function next() {
    if (!person) return;
    if (step === "documents") {
      acceptDocuments(YACHT_ID, person.id, {
        tcVersion: CURRENT_TC_VERSION,
        privacyVersion: CURRENT_PRIVACY_VERSION,
      });
    }
    if (step === "poa") setPoaHolders(YACHT_ID, attorneyIds);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  // ---- Who's activating? (a prototype affordance, not part of the product)
  if (!person) {
    return (
      <Shell>
        <p className="mb-1 text-sm font-semibold text-white">
          Who is activating?
        </p>
        <p className="mb-5 text-xs text-muted">
          Each person on {YACHT_NAME} meets a different flow, depending on what
          they have already accepted.
        </p>
        <div className="flex flex-col gap-2">
          {team.map((m) => {
            const s = stateOf(m);
            return (
              <button
                key={m.id}
                onClick={() => start(m)}
                className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-left transition-colors hover:bg-hover/40"
              >
                <Avatar name={m.name} />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block text-sm font-medium text-white">
                    {m.name}{" "}
                    <span className="text-xs font-normal text-ink-4">
                      · {roleLabel[m.role]}
                    </span>
                  </span>
                  <span className="block text-xs text-muted">{s.label}</span>
                </span>
                <Tag
                  color={
                    s.tone === "new" ? "orange" : s.tone === "stale" ? "yellow" : "mist"
                  }
                >
                  {summarise(stepsFor(m))}
                </Tag>
              </button>
            );
          })}
        </div>
      </Shell>
    );
  }

  const firstName = person.name.split(" ")[0];

  // ---- 0. The invitation email
  if (step === "email") {
    return (
      <Shell onExit={reset}>
        <Chrome label="Inbox" />
        <div className="border-b border-line pb-3">
          <p className="text-sm font-semibold text-white">
            You&apos;ve been invited to {YACHT_NAME}
          </p>
          <p className="mt-1 text-xs text-muted">
            D.gree Yachting &lt;no-reply@dgree.com&gt; · to {emailOf(person)}
          </p>
        </div>
        <div className="py-4 text-sm leading-relaxed text-ink-2">
          <p>Hi {firstName},</p>
          <p className="mt-3">
            You have been added to {YACHT_NAME} as {roleLabel[person.role]}.
            Activate your account to see the yacht&apos;s data.
          </p>
          <p className="mt-3 text-xs text-muted">
            This link expires in 7 days.
          </p>
        </div>
        <Button onClick={next}>Activate your account</Button>
      </Shell>
    );
  }

  // ---- The sign-in screen everyone lands on (already built in the product)
  if (step === "login") {
    const activated = steps.length > 1;
    return (
      <Shell onExit={reset}>
        {activated && (
          <div className="mb-4 rounded-lg border border-success/40 bg-success/10 px-3 py-2.5">
            <p className="text-xs leading-relaxed text-ink-2">
              {steps.includes("password")
                ? "Your account is active."
                : "Thanks — that's recorded."}{" "}
              Sign in to continue.
            </p>
          </div>
        )}
        <p className="mb-4 text-sm font-semibold text-white">Sign in</p>
        <div className="flex flex-col gap-3">
          <TextField label="Email" value={emailOf(person)} onChange={() => {}} />
          <TextField
            label="Password"
            type="password"
            value=""
            onChange={() => {}}
            placeholder="Your password"
          />
        </div>
        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs text-muted">Existing screen</span>
          <Button size="sm" onClick={reset}>
            Try another person
          </Button>
        </div>
      </Shell>
    );
  }

  const canContinue =
    step === "password"
      ? password.length >= 8 && password === confirm
      : step === "documents"
      ? acceptTc && acceptPrivacy
      : true;

  // Position within the steps that are actual screens in the flow.
  const numbered = steps.filter((s) => s !== "email" && s !== "login");
  const position = numbered.indexOf(step) + 1;

  return (
    <Shell onExit={reset}>
      <div className="mb-5 flex items-center gap-3">
        <Avatar name={person.name} />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-sm font-medium text-white">
            {person.name}
          </span>
          <span className="block text-xs text-muted">
            {roleLabel[person.role]} · {YACHT_NAME}
          </span>
        </span>
        <span className="text-xs text-muted">
          Step {position} of {numbered.length}
        </span>
      </div>

      {step === "password" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-white">Set your password</p>
          <p className="text-xs leading-relaxed text-muted">
            Choose a password to finish setting up your account.
          </p>
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
          />
          <TextField
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={setConfirm}
            placeholder="Repeat it"
          />
          {confirm.length > 0 && password !== confirm && (
            <p className="text-xs text-danger">Those don&apos;t match.</p>
          )}
        </div>
      )}

      {step === "documents" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-white">
            {person.tcVersion ? "We've updated our terms" : "Terms and privacy"}
          </p>
          <p className="text-xs leading-relaxed text-muted">
            {person.tcVersion
              ? `You accepted T&C ${person.tcVersion}. It has changed since, so please read and accept the current version.`
              : "Please read and accept these to continue. We record which version you accepted."}
          </p>
          <DocRow
            label="Terms & Conditions"
            version={CURRENT_TC_VERSION}
            checked={acceptTc}
            onChange={setAcceptTc}
          />
          <DocRow
            label="Privacy policy"
            version={CURRENT_PRIVACY_VERSION}
            checked={acceptPrivacy}
            onChange={setAcceptPrivacy}
          />
        </div>
      )}

      {step === "poa" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-white">Power of attorney</p>
          <p className="text-xs leading-relaxed text-muted">
            As the owner, you can name people to authorise 3rd-party data
            sharing on your behalf. Anyone on your team can hold it, and you can
            change this later in your settings.
          </p>
          <MultiSelectField
            label="Delegate to"
            options={team
              .filter((m) => m.role !== "owner")
              .map((m) => ({
                value: m.id,
                label: m.name,
                sublabel: `${roleLabel[m.role]}${
                  m.tcVersion ? "" : " · not signed in yet"
                }`,
              }))}
            selected={attorneyIds}
            onToggle={(id) =>
              setAttorneyIds((ids) =>
                ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
              )
            }
            avatar
            emptyText="No one else on the team yet — you can do this later."
          />
          <p className="text-xs text-muted">
            {attorneyIds.length === 0
              ? "No one will be able to authorise data sharing for you."
              : `${attorneyIds.length} ${
                  attorneyIds.length === 1 ? "person" : "people"
                } will act on your behalf.`}
          </p>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <Button variant="secondary" size="sm" onClick={reset}>
          Cancel
        </Button>
        <Button size="sm" onClick={next} disabled={!canContinue}>
          {step === "poa" ? "Delegate" : "Continue"}
        </Button>
      </div>
    </Shell>
  );
}

// -------------------------------------------------------------------------

function Shell({
  children,
  onExit,
}: {
  children: React.ReactNode;
  onExit?: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Logo className="h-7 w-auto" />
          <div className="mt-1.5 text-[9px] font-semibold tracking-[0.35em] text-nav-section">
            YACHTING
          </div>
        </div>
        <Card className="p-6">{children}</Card>
        {/* The flow has no navigation of its own, so this is the way out. */}
        <div className="mt-5 flex items-center justify-center gap-3 text-xs text-muted">
          {onExit && (
            <>
              <button
                onClick={onExit}
                className="transition-colors hover:text-white"
              >
                Restart
              </button>
              <span className="text-ink-4">·</span>
            </>
          )}
          <Link to="/" className="transition-colors hover:text-white">
            ← Prototype home
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Frames the card as something arriving from outside the product. */
function Chrome({ label }: { label: string }) {
  return (
    <div className="-mx-6 -mt-6 mb-4 flex items-center gap-2 rounded-t-xl border-b border-line bg-nav px-4 py-2">
      <span className="flex gap-1.5">
        <span className="size-2 rounded-full bg-danger/70" />
        <span className="size-2 rounded-full bg-warn/70" />
        <span className="size-2 rounded-full bg-success/70" />
      </span>
      <span className="text-[11px] font-medium text-ink-3">{label}</span>
    </div>
  );
}

function DocRow({
  label,
  version,
  checked,
  onChange,
}: {
  label: string;
  version: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-line px-3 py-2.5 transition-colors hover:bg-hover/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-[var(--color-brand)]"
      />
      <span className="min-w-0 flex-1 text-sm text-ink-2">
        I accept the{" "}
        <span className="font-medium text-white underline">{label}</span>
      </span>
      <Tag color="mist">{version}</Tag>
    </label>
  );
}
