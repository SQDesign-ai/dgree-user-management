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

type Step = "password" | "documents" | "attorneys";

/**
 * What this person has to do before they're in — derived from their record, not
 * a flag, so the flow is a consequence of the data rather than a separate
 * source of truth.
 */
function stepsFor(m: OwnerTeamMember): Step[] {
  const neverSignedIn = !m.tcVersion && !m.privacyVersion;
  const outOfDate =
    m.tcVersion !== CURRENT_TC_VERSION ||
    m.privacyVersion !== CURRENT_PRIVACY_VERSION;

  const steps: Step[] = [];
  if (neverSignedIn) steps.push("password");
  if (outOfDate) steps.push("documents");
  // Only an owner names the people who may act for them.
  if (m.role === "owner") steps.push("attorneys");
  return steps;
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

// -------------------------------------------------------------------------

export default function FirstLogin() {
  useStore();
  const team = ownerTeamOfYacht(YACHT_ID);

  const [personId, setPersonId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [acceptTc, setAcceptTc] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [attorneyIds, setAttorneyIds] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  // Captured when the flow starts: completing it updates the person, so asking
  // "did they have steps?" afterwards would always answer no.
  const [hadSteps, setHadSteps] = useState(false);

  const person = team.find((m) => m.id === personId) ?? null;
  const steps = person ? stepsFor(person) : [];
  const step = steps[stepIndex];

  function start(m: OwnerTeamMember) {
    setPersonId(m.id);
    setStepIndex(0);
    setPassword("");
    setConfirm("");
    setAcceptTc(false);
    setAcceptPrivacy(false);
    setAttorneyIds(team.filter((t) => t.poa).map((t) => t.id));
    const todo = stepsFor(m);
    setHadSteps(todo.length > 0);
    setFinished(todo.length === 0);
  }

  function reset() {
    setPersonId(null);
    setFinished(false);
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
    if (step === "attorneys") {
      setPoaHolders(YACHT_ID, attorneyIds);
    }
    if (stepIndex + 1 >= steps.length) setFinished(true);
    else setStepIndex((i) => i + 1);
  }

  const canContinue =
    step === "password"
      ? password.length >= 8 && password === confirm
      : step === "documents"
      ? acceptTc && acceptPrivacy
      : true;

  // ---- Who's signing in? (a prototype affordance, not part of the product)
  if (!person) {
    return (
      <Shell>
        <p className="mb-1 text-sm font-semibold text-white">
          Who is signing in?
        </p>
        <p className="mb-5 text-xs text-muted">
          Each person on {YACHT_NAME} meets a different flow, depending on what
          they have already accepted.
        </p>
        <div className="flex flex-col gap-2">
          {team.map((m) => {
            const s = stateOf(m);
            const n = stepsFor(m).length;
            return (
              <button
                key={m.id}
                onClick={() => start(m)}
                className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-left transition-colors hover:bg-hover/40"
              >
                <Avatar name={m.name} />
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block text-sm font-medium text-white">
                    {m.name}
                  </span>
                  <span className="block text-xs text-muted">{s.label}</span>
                </span>
                <Tag
                  color={
                    s.tone === "new" ? "orange" : s.tone === "stale" ? "yellow" : "mist"
                  }
                >
                  {n === 0 ? "Straight in" : `${n} step${n > 1 ? "s" : ""}`}
                </Tag>
              </button>
            );
          })}
        </div>
      </Shell>
    );
  }

  // ---- Nothing to do / finished
  if (finished) {
    return (
      <Shell>
        <div className="text-center">
          <Avatar name={person.name} size={44} />
          <p className="mt-3 text-sm font-semibold text-white">
            {hadSteps
              ? `You're all set, ${person.name.split(" ")[0]}`
              : `Welcome back, ${person.name.split(" ")[0]}`}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {hadSteps
              ? `Signed in to ${YACHT_NAME} as ${roleLabel[person.role]}.`
              : "Nothing to accept — everything is already up to date."}
          </p>
        </div>
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" size="sm" onClick={reset}>
            Try another person
          </Button>
        </div>
      </Shell>
    );
  }

  // ---- The flow
  return (
    <Shell>
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
          Step {stepIndex + 1} of {steps.length}
        </span>
      </div>

      {step === "password" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-white">Set your password</p>
          <p className="text-xs leading-relaxed text-muted">
            You were invited to {YACHT_NAME}. Choose a password to finish
            setting up your account.
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

      {step === "attorneys" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-white">
            Power of attorney
          </p>
          <p className="text-xs leading-relaxed text-muted">
            As the owner, you can name people to authorise 3rd-party data
            sharing on your behalf. Anyone on your team can hold it, and you can
            change this later in your settings.
          </p>
          <MultiSelectField
            label="Held by"
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
          {stepIndex + 1 >= steps.length ? "Finish" : "Continue"}
        </Button>
      </div>
    </Shell>
  );
}

// -------------------------------------------------------------------------

function Shell({ children }: { children: React.ReactNode }) {
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
        <div className="mt-5 text-center">
          <Link
            to="/"
            className="text-xs text-muted transition-colors hover:text-white"
          >
            ← Prototype home
          </Link>
        </div>
      </div>
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
