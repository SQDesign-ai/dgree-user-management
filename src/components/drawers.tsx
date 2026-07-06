import { useState } from "react";
import {
  Drawer,
  TextField,
  TextareaField,
  SelectField,
  DateField,
  CheckboxField,
  AutoField,
  AssignField,
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
} from "../store";
import type { YachtRole } from "../data/mock";

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

  function submit() {
    addGroup(name);
    setName("");
    setDescription("");
    onClose();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Create group"
      submitLabel="Create group"
      submitDisabled={!name.trim()}
      onSubmit={submit}
    >
      <TextField
        label="Group name"
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
      <Note>Add shipyards (brands) afterwards from the group page.</Note>
    </Drawer>
  );
}

// -------------------------------------------------------------------------
// Create shipyard
// -------------------------------------------------------------------------
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
  const [name, setName] = useState("");
  const [group, setGroup] = useState(groupId ?? "");
  const [standardDepartments, setStandardDepartments] = useState(true);

  // keep group selection in sync when opened from a specific group card
  const effectiveGroup = groupId ?? group;

  function submit() {
    if (!effectiveGroup) return;
    addShipyard(effectiveGroup, name, { standardDepartments });
    setName("");
    setGroup(groupId ?? "");
    setStandardDepartments(true);
    onClose();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Create shipyard"
      submitLabel="Create shipyard"
      submitDisabled={!name.trim() || !effectiveGroup}
      onSubmit={submit}
    >
      <TextField
        label="Shipyard name"
        value={name}
        onChange={setName}
        placeholder="e.g. Sanlorenzo"
        autoFocus
      />
      {groupId ? (
        <AssignField
          label="Group"
          value={groups.find((g) => g.id === groupId)?.name ?? "—"}
        />
      ) : (
        <SelectField
          label="Group"
          value={group}
          onChange={setGroup}
          placeholder="Select group"
          options={groups.map((g) => ({ value: g.id, label: g.name }))}
        />
      )}
      <CheckboxField
        checked={standardDepartments}
        onChange={setStandardDepartments}
        label="Create standard departments — Tech Dep, Customer Care, Warranty"
      />
      <Note>Assign yachts and add people afterwards from the shipyard page.</Note>
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

  function submit() {
    addTeam(shipyard || shipyardId, { name, description });
    setName("");
    setDescription("");
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
        onChange={setShipyard}
        options={shipyards.map((s) => ({ value: s.id, label: s.name }))}
      />
      <TextareaField
        label="Description"
        value={description}
        onChange={setDescription}
        placeholder="What this team does"
      />
      <Note>Add members afterwards from the team page.</Note>
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
  const [shipyard, setShipyard] = useState(shipyardId);
  const [shipyardDelivery, setShipyardDelivery] = useState("");
  const [ownerDelivery, setOwnerDelivery] = useState("");

  function submit() {
    addYacht(shipyard || shipyardId, {
      code: name,
      mmsi,
      status: ownerDelivery || mmsi ? "delivered" : "production",
    });
    setName("");
    setMmsi("");
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
      <AutoField label="D.gree Asset UUID" text="Generated automatically on create" />
      <Note>
        No more typing UUIDs. The API key, access governance, description, image
        and delivery status are all managed on the yacht page after creation —
        one flow, no separate edit screen.
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

/** Combine "Name" + "Surname" into a single display name. */
export const fullName = (r: CreateUserResult) =>
  [r.firstName, r.surname].filter(Boolean).join(" ").trim();

export const roleName = (r: YachtRole) =>
  ({ owner: "Owner", captain: "Captain", crew: "Crew", guest: "Guest" }[r]);
