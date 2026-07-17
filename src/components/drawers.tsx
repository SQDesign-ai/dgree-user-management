import { useState, useEffect, useRef, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "./ui";
import {
  Drawer,
  TextField,
  TextareaField,
  SelectField,
  DateField,
  CheckboxField,
  AssignField,
  MultiSelectField,
  Note,
  Row,
} from "./Drawer";
import {
  addGroup,
  addShipyard,
  addTeam,
  addYacht,
  getGroups,
  getShipyards,
  ungroupedShipyards,
  candidatePeopleForShipyard,
  candidatePeopleForGroup,
  addTeamMember,
  addExistingTeamMember,
  yachtsInShipyard,
  teamsInShipyard,
  yachtsForTeam,
  teamsForYacht,
  setTeamYachtLinks,
  setYachtTeamLinks,
  updateOwnerTeamMember,
  removeOwnerTeamMember,
} from "../store";
import {
  yachtLabel,
  type YachtRole,
  type OwnerTeamMember,
} from "../data/mock";

// -------------------------------------------------------------------------
// Create group
// -------------------------------------------------------------------------
export function CreateGroupDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shipyardIds, setShipyardIds] = useState<string[]>([]);
  const available = ungroupedShipyards();

  function toggleShipyard(id: string) {
    setShipyardIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );
  }

  function submit() {
    addGroup(name, { shipyardIds });
    setName("");
    setDescription("");
    setShipyardIds([]);
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
      <TextareaField
        label="Description"
        value={description}
        onChange={setDescription}
        placeholder="Optional"
      />
      <MultiSelectField
        label="Attach brands (shipyards)"
        options={available.map((s) => ({
          value: s.id,
          label: s.name,
          sublabel: s.yachts > 0 ? `${s.yachts} yachts` : "No yachts yet",
        }))}
        selected={shipyardIds}
        onToggle={toggleShipyard}
        emptyText="Every brand is already assigned to an account."
      />
      <Note>
        Only brands not yet in an account are listed. You can also add more
        shipyards afterwards from the account page.
      </Note>
    </Drawer>
  );
}

// -------------------------------------------------------------------------
// Create shipyard — multi-step wizard (shipyard → teams → people), all in the
// drawer. Step 1 captures the shipyard; step 2 defines its teams; step 3 adds
// existing people to each team.
// -------------------------------------------------------------------------

const STANDARD_DEPARTMENTS: [string, string][] = [
  ["Tech Dep", "Technical department"],
  ["Customer Care", "Customer support"],
  ["Warranty Dep", "Warranty & after-sales"],
];

interface DraftTeam {
  key: number;
  name: string;
  description: string;
  memberIds: string[];
}

function StepDots({ step }: { step: number }) {
  const labels = ["Shipyard", "Teams", "People"];
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

export function CreateShipyardDrawer({
  open,
  onClose,
  groupId,
}: {
  open: boolean;
  onClose: () => void;
  groupId?: string;
}) {
  const groups = getGroups();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [group, setGroup] = useState(groupId ?? "");
  const [standardDepartments, setStandardDepartments] = useState(true);
  const [teams, setTeams] = useState<DraftTeam[]>([]);
  const keyRef = useRef(0);
  const newKey = () => ++keyRef.current;

  const effectiveGroup = groupId ?? group;
  const candidates = candidatePeopleForGroup(effectiveGroup);

  function reset() {
    setStep(1);
    setName("");
    setGroup(groupId ?? "");
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
        ([n]) => !ts.some((t) => t.name.trim().toLowerCase() === n.toLowerCase())
      ).map(([n, d]) => ({
        key: newKey(),
        name: n,
        description: d,
        memberIds: [] as string[],
      })),
    ]);
  }
  function addBlankTeam() {
    setTeams((ts) => [
      ...ts,
      { key: newKey(), name: "", description: "", memberIds: [] },
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
      ? !!name.trim() && !!effectiveGroup
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
      const sid = addShipyard(effectiveGroup, name, {
        standardDepartments: false,
      });
      validTeams.forEach((t) =>
        addTeam(sid, {
          name: t.name,
          description: t.description,
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
        {step < 3 ? "Next" : "Create shipyard"}
      </button>
    </footer>
  );

  return (
    <Drawer
      open={open}
      onClose={close}
      title="Create shipyard"
      onSubmit={primary}
      footer={footer}
    >
      <div className="pb-1">
        <StepDots step={step} />
      </div>

      {step === 1 && (
        <>
          <TextField
            label="Shipyard name"
            value={name}
            onChange={setName}
            placeholder="e.g. Sanlorenzo"
            autoFocus
          />
          {groupId ? (
            <AssignField
              label="Account"
              value={groups.find((g) => g.id === groupId)?.name ?? "—"}
            />
          ) : (
            <SelectField
              label="Account"
              value={group}
              onChange={setGroup}
              placeholder="Select account"
              options={groups.map((g) => ({ value: g.id, label: g.name }))}
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
              <TextField
                label="Description"
                value={t.description}
                onChange={(v) => updateTeam(t.key, { description: v })}
                placeholder="What this team does"
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
                emptyText="No people available for this group yet."
              />
            </div>
          ))}
          <Note>
            Pick existing people from this group (or any SailADV member). You
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
  shipyardId,
}: {
  open: boolean;
  onClose: () => void;
  shipyardId: string;
}) {
  const shipyards = getShipyards();
  const [name, setName] = useState("");
  const [shipyard, setShipyard] = useState(shipyardId);
  const [description, setDescription] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);

  const activeShipyard = shipyard || shipyardId;
  const candidates = candidatePeopleForShipyard(activeShipyard);

  function changeShipyard(id: string) {
    setShipyard(id);
    setMemberIds([]); // candidates differ per group — reset selection
  }

  function toggleMember(id: string) {
    setMemberIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );
  }

  function submit() {
    addTeam(activeShipyard, { name, description, memberIds });
    setName("");
    setDescription("");
    setMemberIds([]);
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
        label="Shipyard"
        value={shipyard}
        onChange={changeShipyard}
        options={shipyards.map((s) => ({ value: s.id, label: s.name }))}
      />
      <TextareaField
        label="Description"
        value={description}
        onChange={setDescription}
        placeholder="What this team does"
      />
      <MultiSelectField
        label="Add people"
        avatar
        options={candidates.map((p) => ({
          value: p.id,
          label: p.name,
          sublabel: p.handle,
          badge: p.kind === "sail-adv" ? "SailADV" : undefined,
        }))}
        selected={memberIds}
        onToggle={toggleMember}
        emptyText="No people available for this shipyard's group yet."
      />
      <Note>
        Pick existing people from this group (or any SailADV member). The same
        person can belong to several teams. You can also invite brand-new people
        from the team page.
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
  shipyardId,
}: {
  open: boolean;
  onClose: () => void;
  shipyardId: string;
}) {
  const shipyards = getShipyards();
  const [name, setName] = useState("");
  const [mmsi, setMmsi] = useState("");
  const [assetUuid, setAssetUuid] = useState("");
  const [shipyard, setShipyard] = useState(shipyardId);
  const [shipyardDelivery, setShipyardDelivery] = useState("");
  const [ownerDelivery, setOwnerDelivery] = useState("");

  function submit() {
    const stage = ownerDelivery
      ? "delivered"
      : shipyardDelivery
      ? "pre_delivery"
      : "production";
    addYacht(shipyard || shipyardId, {
      code: name,
      mmsi,
      assetUuid,
      stage,
      shipyardDeliveryDate: shipyardDelivery || undefined,
      customerDeliveryDate: ownerDelivery || undefined,
    });
    setName("");
    setMmsi("");
    setAssetUuid("");
    setShipyardDelivery("");
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
        label="Shipyard"
        value={shipyard}
        onChange={setShipyard}
        options={shipyards.map((s) => ({ value: s.id, label: s.name }))}
      />
      <Row>
        <DateField
          label="Shipyard delivery"
          value={shipyardDelivery}
          onChange={setShipyardDelivery}
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
  extra,
}: {
  open: boolean;
  onClose: () => void;
  assignValue: string;
  assignLabel?: string;
  roleLabel?: string;
  roleOptions: { value: string; label: string }[];
  onCreate: (r: CreateUserResult) => void;
  /**
   * Anything the calling context needs to ask that depends on the chosen role —
   * it receives the current role and decides whether to render. Keeps
   * role-specific questions out of this otherwise generic drawer.
   */
  extra?: (role: string) => ReactNode;
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
      {extra?.(role)}
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
  const groups = getGroups();
  const shipyards = getShipyards();
  const [uuid, setUuid] = useState("");
  const [account, setAccount] = useState("");
  const [shipyard, setShipyard] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [mmsi, setMmsi] = useState("");

  useEffect(() => {
    if (!open) return;
    setUuid("");
    setAccount("");
    setShipyard("");
    setCode("");
    setName("");
    setMmsi("");
  }, [open]);

  const shipyardOptions = shipyards.filter((s) => s.groupId === account);
  const canSubmit = !!shipyard && !!code.trim();

  function submit() {
    if (!shipyard) return;
    addYacht(shipyard, { code, name, mmsi, assetUuid: uuid, stage: "production" });
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
          label="Account"
          value={account}
          onChange={(v) => {
            setAccount(v);
            setShipyard("");
          }}
          placeholder="Select account"
          options={groups.map((g) => ({ value: g.id, label: g.name }))}
        />
        <SelectField
          label="Shipyard"
          value={shipyard}
          onChange={setShipyard}
          placeholder={account ? "Select shipyard" : "Pick an account first"}
          options={shipyardOptions.map((s) => ({ value: s.id, label: s.name }))}
        />
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
  shipyardId,
  teamId,
  teamName,
}: {
  open: boolean;
  onClose: () => void;
  shipyardId: string;
  teamId: string;
  teamName: string;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");

  // Reset every time the drawer is opened.
  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setFirstName("");
    setSurname("");
    setEmail("");
  }, [open]);

  const candidates = candidatePeopleForShipyard(shipyardId, teamId);
  const hasInvite = !!firstName.trim();
  const canSubmit = selected.length > 0 || hasInvite;

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function submit() {
    selected.forEach((id) => addExistingTeamMember(teamId, shipyardId, id));
    if (hasInvite) {
      const name = [firstName, surname].filter(Boolean).join(" ").trim();
      addTeamMember(teamId, shipyardId, { name, status: "invited" });
    }
    onClose();
  }

  const n = selected.length;
  const submitLabel =
    n && hasInvite
      ? `Add ${n} + invite`
      : n
      ? `Add ${n} ${n === 1 ? "person" : "people"}`
      : hasInvite
      ? "Send invite"
      : "Add people";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Add people to ${teamName}`}
      submitLabel={submitLabel}
      submitDisabled={!canSubmit}
      onSubmit={submit}
    >
      {/* Invite a brand-new person */}
      <div className="space-y-3 rounded-lg border border-line bg-[#0e2149]/40 p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-2">
          Invite a new person
        </div>
        <Row>
          <TextField label="Name" value={firstName} onChange={setFirstName} placeholder="e.g. Luca" />
          <TextField label="Surname" value={surname} onChange={setSurname} placeholder="e.g. Bianchi" />
        </Row>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="name@company.com"
        />
      </div>

      {/* Pick existing directory people */}
      <MultiSelectField
        label="Add existing people"
        avatar
        options={candidates.map((p) => ({
          value: p.id,
          label: p.name,
          sublabel: p.handle,
          badge: p.kind === "sail-adv" ? "SailADV" : undefined,
        }))}
        selected={selected}
        onToggle={toggle}
        emptyText="Everyone in this group is already on the team."
      />
    </Drawer>
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
        emptyText="Nothing available in this shipyard yet."
      />
      <Note>{note}</Note>
    </Drawer>
  );
}

/** Assign which yachts a team can access — opened from the team page. */
export function AssignYachtsToTeamDrawer({
  open,
  onClose,
  shipyardId,
  shipyardName,
  teamId,
  teamName,
}: {
  open: boolean;
  onClose: () => void;
  shipyardId: string;
  shipyardName: string;
  teamId: string;
  teamName: string;
}) {
  const options = yachtsInShipyard(shipyardId).map((y) => ({
    value: y.id,
    label: yachtLabel(y),
    sublabel: y.mmsi ? `MMSI ${y.mmsi}` : "MMSI not assigned",
  }));
  const initial = yachtsForTeam(shipyardId, teamId).map((y) => y.id);
  return (
    <AssignLinksDrawer
      open={open}
      onClose={onClose}
      title={`Assign yachts · ${teamName}`}
      label={`Yachts in ${shipyardName}`}
      note="A team can access many yachts, and a yacht can be worked by many teams. The same link shows on the yacht page."
      options={options}
      initial={initial}
      onSave={(ids) => setTeamYachtLinks(shipyardId, teamId, ids)}
    />
  );
}

/** Assign which teams can access a yacht — opened from the yacht page. */
export function AssignTeamsToYachtDrawer({
  open,
  onClose,
  shipyardId,
  shipyardName,
  yachtId,
  yachtName,
}: {
  open: boolean;
  onClose: () => void;
  shipyardId: string;
  shipyardName: string;
  yachtId: string;
  yachtName: string;
}) {
  const options = teamsInShipyard(shipyardId).map((t) => ({
    value: t.id,
    label: t.name,
    sublabel: t.description,
  }));
  const initial = teamsForYacht(shipyardId, yachtId).map((t) => t.id);
  return (
    <AssignLinksDrawer
      open={open}
      onClose={onClose}
      title={`Assign teams · ${yachtName}`}
      label={`Teams in ${shipyardName}`}
      note="A yacht can be worked by many teams, and a team can access many yachts. The same link shows on the team page."
      options={options}
      initial={initial}
      onSave={(ids) => setYachtTeamLinks(shipyardId, yachtId, ids)}
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
