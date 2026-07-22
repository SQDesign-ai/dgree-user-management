import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
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
import { ACTIVATION_YACHT_ID as YACHT_ID } from "../config";

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
 * Activation is the same for everyone bar that one branch, so the role is all
 * it takes to know the path.
 */
function stepsFor(role: YachtRole): Step[] {
  return [
    "email",
    "password",
    "documents",
    ...(role === "owner" ? (["poa"] as Step[]) : []),
    "login",
  ];
}

/**
 * People are held as handles elsewhere; the platform identifies them by a
 * name.surname username, which is what the activation email quotes.
 */
function usernameOf(m: OwnerTeamMember): string {
  return m.name.toLowerCase().replace(/\s+/g, ".");
}

function emailOf(m: OwnerTeamMember): string {
  return `${usernameOf(m)}@example.com`;
}

// -------------------------------------------------------------------------

export default function Activation() {
  useStore();
  const { role } = useParams();
  const navigate = useNavigate();
  const team = ownerTeamOfYacht(YACHT_ID);
  // The role picks who you activate as: a real member of the seeded team, so
  // the delegation and consent it records land on someone the admin can see.
  const person = team.find((m) => m.role === role) ?? null;

  const [stepIndex, setStepIndex] = useState(0);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [acceptTc, setAcceptTc] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [attorneyIds, setAttorneyIds] = useState<string[]>(() =>
    team.filter((t) => t.poa).map((t) => t.id)
  );
  const steps = stepsFor((role ?? "crew") as YachtRole);
  const step = steps[stepIndex];

  /** Replay from the top. */
  function restart() {
    setStepIndex(0);
    setPassword("");
    setConfirm("");
    setAcceptTc(false);
    setAcceptPrivacy(false);
    setAttorneyIds(team.filter((t) => t.poa).map((t) => t.id));
  }

  // The role you activate as is chosen on the home page.
  if (!person) return <Navigate to="/" replace />;

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


  // ---- 0. The invitation email
  if (step === "email") {
    return (
      <ActivationEmail
        name={person.name}
        username={usernameOf(person)}
        to={emailOf(person)}
        onFollowLink={next}
      />
    );
  }

  // ---- The sign-in screen everyone lands on (already built in the product)
  if (step === "login") {
    return (
      <Shell onExit={restart}>
        <div className="mb-4 rounded-lg border border-success/40 bg-success/10 px-3 py-2.5">
          <p className="text-xs leading-relaxed text-ink-2">
            Your account is active. Sign in to continue.
          </p>
        </div>
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
          {/* This screen already exists in the product; the flow only has to
              hand over to it. */}
          <span className="text-xs text-muted">Existing screen</span>
          <Link
            to="/"
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            Try another role
          </Link>
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
    <Shell onExit={restart}>
      {/* Account-level: activation can't count on knowing which yacht the
          invitation came from, so it doesn't name one. */}
      <div className="mb-5 flex items-center gap-3">
        <Avatar name={person.name} />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-medium text-white">
            {person.name}
          </span>
          <span className="block text-xs text-muted">
            {roleLabel[person.role]}
          </span>
        </span>
        <span className="shrink-0 text-xs text-muted">
          {position}/{numbered.length}
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
          <p className="text-sm font-semibold text-white">Terms and privacy</p>
          <p className="text-xs leading-relaxed text-muted">
            Please read and accept these to continue. We record which version
            you accepted.
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
        <Button variant="secondary" size="sm" onClick={() => navigate("/")}>
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
    <div className="flex min-h-screen items-center justify-center bg-page px-4 py-10 sm:px-6 sm:py-16">
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

/**
 * The real Keycloak account-action email, from
 * email-previews/04-keycloak-account-action.html — light, 530px, Arial, with
 * the header and footer image bands. Reproduced rather than approximated so
 * the flow starts where the recipient actually starts.
 */
function ActivationEmail({
  name,
  username,
  to,
  onFollowLink,
}: {
  name: string;
  username: string;
  to: string;
  onFollowLink: () => void;
}) {
  const text: React.CSSProperties = {
    fontSize: 16,
    lineHeight: "120%",
    color: "#000000",
  };
  return (
    <div className="flex min-h-screen flex-col items-center bg-page px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-4 w-full max-w-[530px]">
        <div className="rounded-t-lg border border-line bg-nav px-4 py-2.5 text-xs text-ink-3">
          <span className="font-medium text-white">Inbox</span> · to {to}
        </div>
      </div>

      <div
        className="w-full max-w-[530px] overflow-hidden"
        style={{ background: "#ffffff", fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        <div
          style={{
            height: 160,
            background:
              "url('https://cloud.dgree.com/email-assets/header.jpg') center / cover no-repeat",
            backgroundColor: "#0e2d63",
          }}
        />

        <div style={{ padding: "20px" }}>
          <p style={{ ...text, margin: 0 }}>
            Hello, <b>{name}</b>!
          </p>
          <p style={{ ...text, margin: "20px 0 0" }}>
            Your profile has been created on D.gree platform
          </p>
          <p style={{ ...text, margin: "20px 0 0" }}>
            The username is: <b>{username}</b>.
          </p>
          <p style={{ ...text, margin: "30px 0 0" }}>
            Please follow the link to set your password:{" "}
            <a
              href="#set-password"
              onClick={(e) => {
                e.preventDefault();
                onFollowLink();
              }}
              style={{ color: "#0d6efd" }}
            >
              Create_Password_Link
            </a>{" "}
            <b>Note</b>: This link is valid for <b>72 hours (3 days)</b>. If it
            expires, don&apos;t hesitate to get in touch with your administrator
            to request a new link.
          </p>
          <p style={{ ...text, margin: "20px 0 0" }}>
            Start discovering the advantages of 360° monitoring and supervision
            based on quality data.
          </p>
          <p style={{ ...text, margin: "30px 0 0" }}>The D.gree Team</p>
        </div>

        <div
          style={{
            height: 199,
            background:
              "url('https://cloud.dgree.com/email-assets/footer.jpg') center / cover no-repeat",
            backgroundColor: "#0e2d63",
            color: "#ffffff",
            fontSize: 16,
            textAlign: "center",
            paddingTop: 40,
            boxSizing: "border-box",
          }}
        >
          <div>Contact D.gree Technologies</div>
          <div style={{ marginTop: 10 }}>
            <span style={{ borderBottom: "1px solid #ffffff" }}>dgree.tech</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3 text-xs text-muted">
        <Link to="/" className="transition-colors hover:text-white">
          ← Prototype home
        </Link>
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
