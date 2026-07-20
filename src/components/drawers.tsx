import { useState, useEffect, useRef } from "react";
import { Trash2, Search, Check, X } from "lucide-react";
import { Button, Avatar, Badge } from "./ui";
import {
  Drawer,
  TextField,
  SelectField,
  DateField,
  CheckboxField,
  AssignField,
  MultiSelectField,
  Note,
  Row,
} from "./Drawer";
import {
  addAccount,
  addBrand,
  addTeam,
  addYacht,
  getAccounts,
  getBrands,
  candidatePeopleForBrand,
  candidatePeopleForAccount,
  addTeamMember,
  addExistingTeamMember,
  teamsInBrand,
  teamsForYacht,
  setYachtTeamLinks,
  updateOwnerTeamMember,
  removeOwnerTeamMember,
} from "../store";
import {
  type YachtRole,
  type OwnerTeamMember,
  type Person,
} from "../data/mock";

// -------------------------------------------------------------------------
// Create account
// -------------------------------------------------------------------------
export function CreateAccountDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");

  function submit() {
    addAccount(name);
    setName("");
    onClose();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Create account"
      submitLabel="Create account"
      submitDisabled={!name.trim()}
      onSubmit={submit}
    >
      <TextField
        label="Account name"
        value={name}
        onChange={setName}
        placeholder="e.g. Azimut-Benetti"
        autoFocus
      />
      <Note>
        Add the account&apos;s brands from the account page once it exists — a
        brand always belongs to one.
      </Note>
    </Drawer>
  );
}

// -------------------------------------------------------------------------
// Create brand — multi-step wizard (brand → teams → people), all in the
// drawer. Step 1 captures the brand; step 2 defines its teams; step 3 adds
// existing people to each team.
// -------------------------------------------------------------------------

const STANDARD_DEPARTMENTS = [
  "Tech Dep",
  "Customer Care",
  "Warranty Dep",
];

interface DraftTeam {
  key: number;
  name: string;
  memberIds: string[];
}

function StepDots({ step }: { step: number }) {
  const labels = ["Brand", "Teams", "People"];
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                active
                  ? "bg-brand text-white"
                  : done
                  ? "bg-brand/30 text-[#9dc0ff]"
                  : "bg-white/[0.06] text-muted"
              }`}
            >
              {n}
            </span>
            <span
              className={`text-xs font-medium ${
                active ? "text-white" : "text-muted"
              }`}
            >
              {label}
            </span>
            {n < 3 && <span className="mx-1 h-px w-5 bg-line" />}
          </div>
        );
      })}
    </div>
  );
}

export function CreateBrandDrawer({
  open,
  onClose,
  accountId,
}: {
  open: boolean;
  onClose: () => void;
  accountId?: string;
}) {
  const accounts = getAccounts();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [account, setAccount] = useState(accountId ?? "");
  const [standardDepartments, setStandardDepartments] = useState(true);
  const [teams, setTeams] = useState<DraftTeam[]>([]);
  const keyRef = useRef(0);
  const newKey = () => ++keyRef.current;

  const effectiveAccount = accountId ?? account;
  const candidates = candidatePeopleForAccount(effectiveAccount);

  function reset() {
    setStep(1);
    setName("");
    setAccount(accountId ?? "");
    setStandardDepartments(true);
    setTeams([]);
  }
  function close() {
    reset();
    onClose();
  }

  function addStandardTeams() {
    setTeams((ts) => [
      ...ts,
      ...STANDARD_DEPARTMENTS.filter(
        (n) => !ts.some((t) => t.name.trim().toLowerCase() === n.toLowerCase())
      ).map((n) => ({
        key: newKey(),
        name: n,
        memberIds: [] as string[],
      })),
    ]);
  }
  function addBlankTeam() {
    setTeams((ts) => [
      ...ts,
      { key: newKey(), name: "", memberIds: [] },
    ]);
  }
  function updateTeam(key: number, patch: Partial<DraftTeam>) {
    setTeams((ts) => ts.map((t) => (t.key === key ? { ...t, ...patch } : t)));
  }
  function removeTeam(key: number) {
    setTeams((ts) => ts.filter((t) => t.key !== key));
  }
  function toggleMember(key: number, id: string) {
    setTeams((ts) =>
      ts.map((t) =>
        t.key === key
          ? {
              ...t,
              memberIds: t.memberIds.includes(id)
                ? t.memberIds.filter((x) => x !== id)
                : [...t.memberIds, id],
            }
          : t
      )
    );
  }

  const validTeams = teams.filter((t) => t.name.trim());

  // gate for the primary button per step
  const canAdvance =
    step === 1
      ? !!name.trim() && !!effectiveAccount
      : step === 2
      ? validTeams.length > 0
      : true;

  function primary() {
    if (!canAdvance) return;
    if (step === 1) {
      // seed standard departments the first time we reach the teams step
      if (teams.length === 0 && standardDepartments) addStandardTeams();
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      const sid = addBrand(effectiveAccount, name, {
        standardDepartments: false,
      });
      validTeams.forEach((t) =>
        addTeam(sid, {
          name: t.name,
          memberIds: t.memberIds,
        })
      );
      close();
    }
  }

  const footer = (
    <footer className="flex items-center justify-between gap-2 border-t border-line bg-surface/40 px-6 py-4">
      <button
        type="button"
        onClick={() => (step === 1 ? close() : setStep(step - 1))}
        className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-3 transition-colors hover:bg-white/[0.06]"
      >
        {step === 1 ? "Cancel" : "Back"}
      </button>
      <button
        type="submit"
        disabled={!canAdvance}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {step < 3 ? "Next" : "Create brand"}
      </button>
    </footer>
  );

  return (
    <Drawer
      open={open}
      onClose={close}
      title="Create brand"
      onSubmit={primary}
      footer={footer}
    >
      <div className="pb-1">
        <StepDots step={step} />
      </div>

      {step === 1 && (
        <>
          <TextField
            label="Brand name"
            value={name}
            onChange={setName}
            placeholder="e.g. Sanlorenzo"
            autoFocus
          />
          {accountId ? (
            <AssignField
              label="Account"
              value={accounts.find((g) => g.id === accountId)?.name ?? "—"}
            />
          ) : (
            <SelectField
              label="Account"
              value={account}
              onChange={setAccount}
              placeholder="Select account"
              options={accounts.map((g) => ({ value: g.id, label: g.name }))}
            />
          )}
          <CheckboxField
            checked={standardDepartments}
            onChange={setStandardDepartments}
            label="Prefill standard departments — Tech Dep, Customer Care, Warranty"
          />
          <Note>Next you&apos;ll define teams, then add people to each.</Note>
        </>
      )}

      {step === 2 && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-3">Teams</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addStandardTeams}
                className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink-3 hover:bg-white/[0.06]"
              >
                + Standard
              </button>
              <button
                type="button"
                onClick={addBlankTeam}
                className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink-3 hover:bg-white/[0.06]"
              >
                + Add team
              </button>
            </div>
          </div>
          {teams.length === 0 && (
            <div className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
              No teams yet. Add standard departments or a custom team.
            </div>
          )}
          {teams.map((t, i) => (
            <div
              key={t.key}
              className="space-y-3 rounded-lg border border-line bg-[#0e2149]/40 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-2">
                  Team {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeTeam(t.key)}
                  className="text-xs font-medium text-muted hover:text-danger"
                >
                  Remove
                </button>
              </div>
              <TextField
                label="Team name"
                value={t.name}
                onChange={(v) => updateTeam(t.key, { name: v })}
                placeholder="e.g. Tech Dep"
              />
            </div>
          ))}
          <Note>At least one named team is required to continue.</Note>
        </>
      )}

      {step === 3 && (
        <>
          <span className="text-xs font-semibold text-ink-3">
            Add people to each team
          </span>
          {validTeams.length === 0 && (
            <Note>No teams to populate.</Note>
          )}
          {validTeams.map((t) => (
            <div key={t.key} className="space-y-2">
              <div className="text-sm font-semibold text-white">{t.name}</div>
              <MultiSelectField
                label="People"
                avatar
                options={candidates.map((p) => ({
                  value: p.id,
                  label: p.name,
                  sublabel: p.handle,
                  badge: p.kind === "sail-adv" ? "SailADV" : undefined,
                }))}
                selected={t.memberIds}
                onToggle={(id) => toggleMember(t.key, id)}
                emptyText="No people available for this account yet."
              />
            </div>
          ))}
          <Note>
            Pick existing people from this account (or any SailADV member). You
            can invite brand-new people from each team page later.
          </Note>
        </>
      )}
    </Drawer>
  );
}

// -------------------------------------------------------------------------
// Create team
// -------------------------------------------------------------------------
export function CreateTeamDrawer({
  open,
  onClose,
  brandId,
}: {
  open: boolean;
  onClose: () => void;
  brandId: string;
}) {
  const brands = getBrands();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState(brandId);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [invites, setInvites] = useState<string[]>([]);

  const activeBrand = brand || brandId;

  function changeBrand(id: string) {
    setBrand(id);
    setMemberIds([]); // candidates differ per account — reset selection
  }

  function submit() {
    // The team has to exist before anyone can be invited into it.
    const teamId = addTeam(activeBrand, { name, memberIds });
    invites.forEach((email) =>
      addTeamMember(teamId, activeBrand, {
        name: nameFromEmail(email),
        handle: email,
        status: "invited",
      })
    );
    setName("");
    setMemberIds([]);
    setInvites([]);
    onClose();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Create team"
      submitLabel="Create team"
      submitDisabled={!name.trim()}
      onSubmit={submit}
    >
      <TextField
        label="Team name"
        value={name}
        onChange={setName}
        placeholder="e.g. Tech Dep"
        autoFocus
      />
      <SelectField
        label="Brand"
        value={brand}
        onChange={changeBrand}
        options={brands.map((s) => ({ value: s.id, label: s.name }))}
      />
      <div>
        <PeoplePicker
          candidates={candidatePeopleForBrand(activeBrand)}
          selected={memberIds}
          onToggle={(id) =>
            setMemberIds((ids) =>
              ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
            )
          }
          invites={invites}
          onInvite={(email) => setInvites((v) => [...v, email])}
          onRemoveInvite={(email) =>
            setInvites((v) => v.filter((x) => x !== email))
          }
          emptyText="No people available for this brand's account yet."
        />
      </div>
      <Note>
        Pick existing people from this account (or any SailADV member), and invite
        anyone who isn&apos;t there yet. The same person can belong to several
        teams.
      </Note>
    </Drawer>
  );
}

// -------------------------------------------------------------------------
// Create yacht
// -------------------------------------------------------------------------
export function CreateYachtDrawer({
  open,
  onClose,
  brandId,
}: {
  open: boolean;
  onClose: () => void;
  brandId: string;
}) {
  const brands = getBrands();
  const [name, setName] = useState("");
  const [mmsi, setMmsi] = useState("");
  const [assetUuid, setAssetUuid] = useState("");
  const [brand, setBrand] = useState(brandId);
  const [brandDelivery, setBrandDelivery] = useState("");
  const [ownerDelivery, setOwnerDelivery] = useState("");

  function submit() {
    const stage = ownerDelivery
      ? "delivered"
      : brandDelivery
      ? "pre_delivery"
      : "production";
    addYacht(brand || brandId, {
      code: name,
      mmsi,
      assetUuid,
      stage,
      brandDeliveryDate: brandDelivery || undefined,
      customerDeliveryDate: ownerDelivery || undefined,
    });
    setName("");
    setMmsi("");
    setAssetUuid("");
    setBrandDelivery("");
    setOwnerDelivery("");
    onClose();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Create yacht"
      submitLabel="Create yacht"
      submitDisabled={!name.trim()}
      onSubmit={submit}
    >
      <TextField
        label="Yacht name"
        value={name}
        onChange={setName}
        placeholder="e.g. SL50-171 · CONTIGO"
        autoFocus
      />
      <TextField
        label="MMSI"
        value={mmsi}
        onChange={setMmsi}
        placeholder="Optional · e.g. 256962000"
      />
      <SelectField
        label="Brand"
        value={brand}
        onChange={setBrand}
        options={brands.map((s) => ({ value: s.id, label: s.name }))}
      />
      <Row>
        <DateField
          label="Brand delivery"
          value={brandDelivery}
          onChange={setBrandDelivery}
        />
        <DateField
          label="Owner delivery"
          value={ownerDelivery}
          onChange={setOwnerDelivery}
        />
      </Row>
      <TextField
        label="D.gree Asset UUID"
        value={assetUuid}
        onChange={setAssetUuid}
        placeholder="Paste the UUID issued by D.gree core"
      />
      <Note>
        The Asset UUID is issued by the D.gree core backend — paste the code
        here to bind this yacht to it. The API key, access governance,
        description, image and delivery status are managed on the yacht page
        after creation.
      </Note>
    </Drawer>
  );
}

// -------------------------------------------------------------------------
// Create user (contextual "Add person")
// -------------------------------------------------------------------------
export interface CreateUserResult {
  firstName: string;
  surname: string;
  email: string;
  role: string;
}

export function CreateUserDrawer({
  open,
  onClose,
  assignLabel,
  assignValue,
  roleLabel = "Role",
  roleOptions,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  assignValue: string;
  assignLabel?: string;
  roleLabel?: string;
  roleOptions: { value: string; label: string }[];
  onCreate: (r: CreateUserResult) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(roleOptions[0]?.value ?? "");

  function submit() {
    onCreate({ firstName, surname, email, role });
    setFirstName("");
    setSurname("");
    setEmail("");
    setRole(roleOptions[0]?.value ?? "");
    onClose();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Create user"
      submitLabel="Send invite"
      submitDisabled={!firstName.trim()}
      onSubmit={submit}
    >
      <Row>
        <TextField label="Name" value={firstName} onChange={setFirstName} placeholder="e.g. Luca" autoFocus />
        <TextField label="Surname" value={surname} onChange={setSurname} placeholder="e.g. Bianchi" />
      </Row>
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="name@company.com"
      />
      <AssignField label={assignLabel ?? "Assign to"} value={assignValue} />
      <SelectField
        label={roleLabel}
        value={role}
        onChange={setRole}
        options={roleOptions}
      />
      <Note>
        An invite email is sent — the person sets their own password and accepts
        the T&amp;Cs on first login.
      </Note>
    </Drawer>
  );
}

// -------------------------------------------------------------------------
// Add yacht — sync a yacht that already exists in the D.gree core DB by its
// Asset UUID. Opened from the fleet / all-yachts view.
// -------------------------------------------------------------------------
export function AddYachtDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const accounts = getAccounts();
  const brands = getBrands();
  const [uuid, setUuid] = useState("");
  const [brand, setBrand] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [mmsi, setMmsi] = useState("");

  useEffect(() => {
    if (!open) return;
    setUuid("");
    setBrand("");
    setCode("");
    setName("");
    setMmsi("");
  }, [open]);

  // A brand belongs to exactly one account, so the account follows from the
  // brand rather than being a second thing to get right.
  const accountName =
    accounts.find((a) => a.id === brands.find((b) => b.id === brand)?.accountId)
      ?.name ?? "";
  const canSubmit = !!brand && !!code.trim();

  function submit() {
    if (!brand) return;
    addYacht(brand, { code, name, mmsi, assetUuid: uuid, stage: "production" });
    onClose();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Add yacht"
      submitLabel="Add yacht"
      submitDisabled={!canSubmit}
      onSubmit={submit}
    >
      <TextField
        label="D.gree Asset UUID"
        value={uuid}
        onChange={setUuid}
        placeholder="Paste the UUID issued by D.gree core"
        autoFocus
      />
      <Row>
        <SelectField
          label="Brand"
          value={brand}
          onChange={setBrand}
          placeholder="Select brand"
          options={brands.map((s) => ({ value: s.id, label: s.name }))}
        />
        <AssignField label="Account" value={accountName || "—"} />
      </Row>
      <Row>
        <TextField
          label="Hull code"
          value={code}
          onChange={setCode}
          placeholder="e.g. SL50-171"
        />
        <TextField
          label="Yacht name"
          value={name}
          onChange={setName}
          placeholder="e.g. CONTIGO"
        />
      </Row>
      <TextField
        label="MMSI"
        value={mmsi}
        onChange={setMmsi}
        placeholder="Optional · e.g. 256962000"
      />
      <Note>
        Yachts are created in the D.gree core DB. Paste the Asset UUID to sync
        one into the fleet — it enters as In production.
      </Note>
    </Drawer>
  );
}

// -------------------------------------------------------------------------
// Add people to a team — unified flow: invite a brand-new person AND/OR pick
// existing directory people in one drawer, submitted together (fewer clicks).
// -------------------------------------------------------------------------
export function AddTeamPeopleDrawer({
  open,
  onClose,
  brandId,
  teamId,
  teamName,
}: {
  open: boolean;
  onClose: () => void;
  brandId: string;
  teamId: string;
  teamName: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [invites, setInvites] = useState<string[]>([]);

  // Reset every time the drawer is opened.
  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setInvites([]);
  }, [open]);

  const n = selected.length;
  const m = invites.length;
  const submitLabel =
    n && m
      ? `Add ${n} · invite ${m}`
      : n
      ? `Add ${n} ${n === 1 ? "person" : "people"}`
      : m
      ? `Invite ${m}`
      : "Add people";

  function submit() {
    selected.forEach((id) => addExistingTeamMember(teamId, brandId, id));
    invites.forEach((email) =>
      addTeamMember(teamId, brandId, {
        name: nameFromEmail(email),
        handle: email,
        status: "invited",
      })
    );
    onClose();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Add people to ${teamName}`}
      submitLabel={submitLabel}
      submitDisabled={!n && !m}
      onSubmit={submit}
    >
      <PeoplePicker
        candidates={candidatePeopleForBrand(brandId, teamId)}
        selected={selected}
        onToggle={(id) =>
          setSelected((s) =>
            s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
          )
        }
        invites={invites}
        onInvite={(email) => setInvites((v) => [...v, email])}
        onRemoveInvite={(email) =>
          setInvites((v) => v.filter((x) => x !== email))
        }
        emptyText="Everyone in this account is already on the team."
      />
    </Drawer>
  );
}

/**
 * Choose people for a team, whether or not they exist yet.
 *
 * One field does both jobs: it filters the directory as you type, and when what
 * you typed is an address nobody matches, it offers to invite it. Queued
 * invites are held as chips so several can be lined up before submitting.
 *
 * Selection and invites live with the caller — what happens on submit differs
 * (an existing team links a person; a new one is created first) and only the
 * search box is this component's own business.
 */
function PeoplePicker({
  candidates,
  selected,
  onToggle,
  invites,
  onInvite,
  onRemoveInvite,
  emptyText,
}: {
  candidates: Person[];
  selected: string[];
  onToggle: (id: string) => void;
  invites: string[];
  onInvite: (email: string) => void;
  onRemoveInvite: (email: string) => void;
  emptyText: string;
}) {
  const [query, setQuery] = useState("");

  const q = query.trim();
  const lower = q.toLowerCase();

  // Only an address can be invited — that's what the invite is sent to.
  const isEmail = /^\S+@\S+\.\S+$/.test(q);
  const canInvite = isEmail && !invites.includes(lower);

  const matches = lower
    ? candidates.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.handle.toLowerCase().includes(lower)
      )
    : candidates;

  function invite() {
    if (!canInvite) return;
    onInvite(lower);
    setQuery(""); // ready for the next one, so several can be queued up
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-white">
          Who do you want to add?
        </p>
        <p className="mt-0.5 text-xs text-muted">
          You can add and invite several people at once.
        </p>
      </div>

      {/* The Invite button sits inside the field, so it reads as what to do
          with what you just typed rather than a separate control. It only
          appears once that's a complete address — nothing to press before. */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canInvite) {
              e.preventDefault();
              invite();
            }
          }}
          placeholder="Search people, or type an email to invite"
          className={`w-full rounded-lg border border-line bg-[#0e2149] py-2.5 pl-9 text-sm text-ink placeholder:text-muted outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20 ${
            canInvite ? "pr-[5.5rem]" : "pr-3"
          }`}
        />
        {canInvite && (
          <button
            // Not a submit: it lives inside the drawer's form, and without this
            // it would send the whole thing.
            type="button"
            onClick={invite}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            Invite
          </button>
        )}
      </div>

      <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-lg border border-line bg-[#0e2149]/40 p-1.5">
        {/* Invited people join the list rather than sitting apart from it —
            they're being added just as much as anyone ticked below. */}
        {invites.map((email) => (
          <div
            key={email}
            className="flex w-full items-center gap-3 rounded-md bg-brand/15 px-2.5 py-2"
          >
            <span className="flex size-4 shrink-0 items-center justify-center rounded border border-brand bg-brand text-white">
              <Check className="size-3" strokeWidth={3} />
            </span>
            <Avatar name={nameFromEmail(email)} size={28} />
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm text-white">
                {nameFromEmail(email)}
              </span>
              <span className="block truncate text-xs text-muted">{email}</span>
            </span>
            <Badge tone="brand">Invite</Badge>
            <button
              type="button"
              onClick={() => onRemoveInvite(email)}
              aria-label={`Remove ${email}`}
              className="rounded p-1 text-muted transition-colors hover:bg-white/10 hover:text-ink-3"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}

        {matches.map((p) => {
          const on = selected.includes(p.id);
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => onToggle(p.id)}
              className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors ${
                on ? "bg-brand/15" : "hover:bg-white/[0.04]"
              }`}
            >
              <span
                className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                  on
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-transparent"
                }`}
              >
                {on && <Check className="size-3" strokeWidth={3} />}
              </span>
              <Avatar name={p.name} size={28} />
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block text-sm text-white">{p.name}</span>
                <span className="block text-xs text-muted">{p.handle}</span>
              </span>
              {p.kind === "sail-adv" && <Badge tone="brand">SailADV</Badge>}
            </button>
          );
        })}

        {matches.length === 0 && (
          <p className="px-2.5 py-6 text-center text-xs leading-relaxed text-muted">
            {!q
              ? emptyText
              : canInvite
              ? `Nobody here matches — use Invite to add ${q}.`
              : `No one matches “${q}”. Type their full email address to invite them.`}
          </p>
        )}
      </div>
    </div>
  );
}

/** A stand-in name until the person sets their own on first sign-in. */
function nameFromEmail(email: string) {
  return (
    email
      .split("@")[0]
      .split(/[._-]+/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ") || email
  );
}

// -------------------------------------------------------------------------
// Assign team ↔ yacht links (many-to-many, editable from both sides)
// -------------------------------------------------------------------------
function AssignLinksDrawer({
  open,
  onClose,
  title,
  label,
  note,
  options,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  label: string;
  note: string;
  options: { value: string; label: string; sublabel?: string }[];
  initial: string[];
  onSave: (ids: string[]) => void;
}) {
  const [sel, setSel] = useState<string[]>(initial);
  // Re-sync from the store each time the drawer is opened.
  useEffect(() => {
    if (open) setSel(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggle(id: string) {
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  function submit() {
    onSave(sel);
    onClose();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      submitLabel="Save links"
      onSubmit={submit}
    >
      <MultiSelectField
        label={label}
        options={options}
        selected={sel}
        onToggle={toggle}
        emptyText="Nothing available in this brand yet."
      />
      <Note>{note}</Note>
    </Drawer>
  );
}

/** Assign which teams can access a yacht — opened from the yacht page. */
export function AssignTeamsToYachtDrawer({
  open,
  onClose,
  brandId,
  brandName,
  yachtId,
  yachtName,
}: {
  open: boolean;
  onClose: () => void;
  brandId: string;
  brandName: string;
  yachtId: string;
  yachtName: string;
}) {
  const options = teamsInBrand(brandId).map((t) => ({
    value: t.id,
    label: t.name,
    sublabel: `${t.memberCount} ${t.memberCount === 1 ? "member" : "members"}`,
  }));
  const initial = teamsForYacht(brandId, yachtId).map((t) => t.id);
  return (
    <AssignLinksDrawer
      open={open}
      onClose={onClose}
      title={`Assign teams · ${yachtName}`}
      label={`Teams in ${brandName}`}
      note="A yacht can be worked by many teams, and a team can access many yachts. The same link shows on the team page."
      options={options}
      initial={initial}
      onSave={(ids) => setYachtTeamLinks(brandId, yachtId, ids)}
    />
  );
}

/** Combine "Name" + "Surname" into a single display name. */
export const fullName = (r: CreateUserResult) =>
  [r.firstName, r.surname].filter(Boolean).join(" ").trim();

export const roleName = (r: YachtRole) =>
  ({ owner: "Owner", captain: "Captain", crew: "Crew", guest: "Guest" }[r]);

// -------------------------------------------------------------------------
// One person's access to a yacht — opened from a row in the yacht team.
// This is where a role is changed, PoA granted, or access revoked.
// -------------------------------------------------------------------------
export function YachtTeamMemberDrawer({
  open,
  onClose,
  yachtId,
  yachtName,
  member,
}: {
  open: boolean;
  onClose: () => void;
  yachtId: string;
  yachtName: string;
  member: OwnerTeamMember | null;
}) {
  const [role, setRole] = useState<YachtRole>("crew");

  useEffect(() => {
    if (!open || !member) return;
    setRole(member.role);
  }, [open, member]);

  if (!member) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={member.name}
      description={`${member.handle} · access to ${yachtName}`}
      submitLabel="Save changes"
      onSubmit={() => {
        // Role only — power of attorney is the owner's grant, made where the
        // owner is, so this drawer must not quietly write it back.
        updateOwnerTeamMember(yachtId, member.id, { role });
        onClose();
      }}
    >
      <SelectField
        label="Role"
        value={role}
        onChange={(v) => setRole(v as YachtRole)}
        options={(["owner", "captain", "crew", "guest"] as YachtRole[]).map(
          (r) => ({ value: r, label: roleName(r) })
        )}
      />

      <Note>
        The role sets what this person can see and do on {yachtName}.
        {role !== "owner" && member.poa
          ? " They hold power of attorney, so they authorise 3rd-party data sharing on the owner's behalf."
          : ""}
      </Note>

      <div className="border-t border-line pt-4">
        <Button
          variant="danger"
          onClick={() => {
            removeOwnerTeamMember(yachtId, member.id);
            onClose();
          }}
        >
          <Trash2 className="size-4" />
          Remove from yacht team
        </Button>
        <p className="mt-2 text-xs text-muted">
          They immediately lose access to {yachtName}.
        </p>
      </div>
    </Drawer>
  );
}
