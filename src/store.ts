// -------------------------------------------------------------------------
// In-memory prototype store.
//
// Seeded from the static mock data, but mutable so the "Add …" flows can
// create entities that appear immediately and persist across navigation
// (until a full page reload). Backed by useSyncExternalStore so any page
// that calls useStore() re-renders when the data changes.
// -------------------------------------------------------------------------
import { useSyncExternalStore } from "react";
import {
  groups as seedGroups,
  shipyards as seedShipyards,
  teamsByShipyard as seedTeams,
  membersByTeam as seedMembers,
  yachtsByShipyard as seedYachts,
  ownerTeamByYacht as seedOwnerTeam,
  peopleByGroup as seedPeople,
  directoryPeople as seedDirectory,
  teamYachtLinks as seedLinks,
  type Group,
  type Shipyard,
  type Team,
  type Member,
  type Yacht,
  type OwnerTeamMember,
  type GroupPerson,
  type Person,
  type TeamYachtLink,
  type MemberStatus,
  type YachtRole,
  type YachtStage,
} from "./data/mock";

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

interface State {
  groups: Group[];
  shipyards: Shipyard[];
  teamsByShipyard: Record<string, Team[]>;
  membersByTeam: Record<string, Member[]>;
  yachtsByShipyard: Record<string, Yacht[]>;
  ownerTeamByYacht: Record<string, OwnerTeamMember[]>;
  peopleByGroup: Record<string, GroupPerson[]>;
  people: Person[]; // shared directory (candidates for team membership)
  teamYachtLinks: TeamYachtLink[]; // many-to-many team↔yacht access
}

function seededState(): State {
  return {
    groups: clone(seedGroups),
    shipyards: clone(seedShipyards),
    teamsByShipyard: clone(seedTeams),
    membersByTeam: clone(seedMembers),
    yachtsByShipyard: clone(seedYachts),
    ownerTeamByYacht: clone(seedOwnerTeam),
    peopleByGroup: clone(seedPeople),
    people: clone(seedDirectory),
    teamYachtLinks: clone(seedLinks),
  };
}

// ---- persistence (localStorage) -----------------------------------------
// Acts as a lightweight "DB": whatever you add is saved in the browser and
// survives reloads. Bump STORAGE_VERSION to invalidate old snapshots when the
// data shape changes. Clear it from the UI via resetStore().

const STORAGE_KEY = "dgree.access.v1";
const STORAGE_VERSION = 7;

function loadState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seededState();
    const parsed = JSON.parse(raw);
    if (parsed?.version !== STORAGE_VERSION || !parsed.state)
      return seededState();
    return parsed.state as State;
  } catch {
    return seededState();
  }
}

function persist() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, state })
    );
  } catch {
    /* storage unavailable / quota — stay in-memory only */
  }
}

const state: State = loadState();

/** Wipe saved data and reseed from the mock defaults. */
export function resetStore() {
  const fresh = seededState();
  (Object.keys(fresh) as (keyof State)[]).forEach((k) => {
    // reassign in place so exported `state` reference stays valid
    (state as unknown as Record<string, unknown>)[k] = fresh[k];
  });
  persist();
  emit();
}

// ---- subscription --------------------------------------------------------

let version = 0;
const listeners = new Set<() => void>();
function emit() {
  version += 1;
  persist();
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
const getSnapshot = () => version;

/** Subscribe the calling component to store changes. */
export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

// ---- helpers -------------------------------------------------------------

function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "item"
  );
}

function uniqueId(base: string, taken: (id: string) => boolean) {
  let id = base;
  let n = 2;
  while (taken(id)) id = `${base}-${n++}`;
  return id;
}

/** Derive an @handle from a display name, e.g. "Marco Rossi" -> "@m_rossi". */
function handleFromName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return `@${slugify(parts[0]).replace(/-/g, "_")}`;
  const first = parts[0][0]?.toLowerCase() ?? "";
  const last = parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, "");
  return `@${first}_${last}`;
}

// ---- read accessors ------------------------------------------------------

export const getGroups = () => state.groups;
export const getShipyards = () => state.shipyards;

export const groupById = (id: string) => state.groups.find((g) => g.id === id);
export const shipyardById = (id: string) =>
  state.shipyards.find((s) => s.id === id);
export const shipyardsInGroup = (groupId: string) =>
  state.shipyards.filter((s) => s.groupId === groupId);
/** Brands not yet attached to any group — the pool for "Create group". */
export const ungroupedShipyards = () =>
  state.shipyards.filter((s) => !s.groupId);
export const peopleInGroup = (groupId: string) =>
  state.peopleByGroup[groupId] ?? [];
export const getDirectory = () => state.people;
export const personById = (id: string) =>
  state.people.find((p) => p.id === id);

/**
 * People who may be linked into a team in this group: regulars whose home group
 * matches, plus all SailADV people (who span groups). A blank groupId (e.g. a
 * shipyard not yet assigned) yields SailADV people only.
 */
export const candidatePeopleForGroup = (groupId: string): Person[] =>
  state.people.filter(
    (p) => p.kind === "sail-adv" || (!!groupId && p.groupId === groupId)
  );

/**
 * People who may be linked into a team in this shipyard (its group's regulars +
 * all SailADV). Optionally excludes anyone already in `excludeTeamId`.
 */
export const candidatePeopleForShipyard = (
  shipyardId: string,
  excludeTeamId?: string
): Person[] => {
  const sy = shipyardById(shipyardId);
  if (!sy) return [];
  const already = new Set(
    excludeTeamId ? membersInTeam(excludeTeamId).map((m) => m.id) : []
  );
  return candidatePeopleForGroup(sy.groupId).filter((p) => !already.has(p.id));
};

// ---- team ↔ yacht access links ------------------------------------------

export const yachtsForTeam = (shipyardId: string, teamId: string): Yacht[] => {
  const ids = new Set(
    state.teamYachtLinks
      .filter((l) => l.shipyardId === shipyardId && l.teamId === teamId)
      .map((l) => l.yachtId)
  );
  return yachtsInShipyard(shipyardId).filter((y) => ids.has(y.id));
};

export const teamsForYacht = (shipyardId: string, yachtId: string): Team[] => {
  const ids = new Set(
    state.teamYachtLinks
      .filter((l) => l.shipyardId === shipyardId && l.yachtId === yachtId)
      .map((l) => l.teamId)
  );
  return teamsInShipyard(shipyardId).filter((t) => ids.has(t.id));
};
export const teamsInShipyard = (shipyardId: string) =>
  state.teamsByShipyard[shipyardId] ?? [];
export const yachtsInShipyard = (shipyardId: string) =>
  state.yachtsByShipyard[shipyardId] ?? [];
export const membersInTeam = (teamId: string) =>
  state.membersByTeam[teamId] ?? [];
export const ownerTeamOfYacht = (yachtId: string) =>
  state.ownerTeamByYacht[yachtId] ?? [];
export const teamById = (shipyardId: string, teamId: string) =>
  teamsInShipyard(shipyardId).find((t) => t.id === teamId);
export const yachtById = (shipyardId: string, yachtId: string) =>
  yachtsInShipyard(shipyardId).find((y) => y.id === yachtId);

export interface GroupWithShipyards extends Group {
  shipyards: Shipyard[];
  yachts: number;
  users: number;
}

export const getGroupsWithShipyards = (): GroupWithShipyards[] =>
  state.groups.map((g) => {
    const inGroup = shipyardsInGroup(g.id);
    return {
      ...g,
      shipyards: inGroup,
      yachts: inGroup.reduce((n, s) => n + s.yachts, 0),
      users: inGroup.reduce((n, s) => n + s.users, 0),
    };
  });

export const getTotals = () => ({
  shipyards: state.shipyards.length,
  groups: state.groups.length,
  yachts: Math.max(
    67,
    state.shipyards.reduce((n, s) => n + s.yachts, 0)
  ),
});

// ---- mutations -----------------------------------------------------------

/** Insert into the shared directory if not already present; returns the id. */
function registerPerson(p: Person): string {
  if (!state.people.some((x) => x.id === p.id)) state.people.push(p);
  return p.id;
}

/** Link an existing directory person into a team (no-op if already a member). */
function linkPersonToTeam(teamId: string, shipyardId: string, personId: string) {
  const person = personById(personId);
  if (!person) return;
  const list = (state.membersByTeam[teamId] ??= []);
  if (list.some((m) => m.id === personId)) return;
  list.push({
    id: person.id,
    name: person.name,
    handle: person.handle,
    status: person.status,
    kind: person.kind,
  });
  const team = teamById(shipyardId, teamId);
  if (team) team.memberCount += 1;
}

export function addGroup(
  name: string,
  opts?: { shipyardIds?: string[] }
): string {
  const id = uniqueId(slugify(name), (i) => !!groupById(i));
  state.groups.push({ id, name: name.trim() });
  // Attach any selected ungrouped brands to the new group.
  (opts?.shipyardIds ?? []).forEach((sid) => {
    const sy = shipyardById(sid);
    if (sy && !sy.groupId) sy.groupId = id;
  });
  emit();
  return id;
}

/** Add an existing directory person to an existing team. */
export function addExistingTeamMember(
  teamId: string,
  shipyardId: string,
  personId: string
) {
  linkPersonToTeam(teamId, shipyardId, personId);
  emit();
}

const STANDARD_DEPARTMENTS: [string, string][] = [
  ["Tech Dep", "Technical department"],
  ["Customer Care", "Customer support"],
  ["Warranty Dep", "Warranty & after-sales"],
];

export function addShipyard(
  groupId: string,
  name: string,
  opts?: { standardDepartments?: boolean }
): string {
  const id = uniqueId(slugify(name), (i) => !!shipyardById(i));
  const shipyard: Shipyard = {
    id,
    name: name.trim(),
    groupId,
    users: 0,
    yachts: 0,
    teams: 0,
  };
  state.shipyards.push(shipyard);
  state.teamsByShipyard[id] = [];
  state.yachtsByShipyard[id] = [];

  if (opts?.standardDepartments) {
    STANDARD_DEPARTMENTS.forEach(([n, d]) => {
      state.teamsByShipyard[id].push({
        id: slugify(n),
        shipyardId: id,
        name: n,
        description: d,
        memberCount: 0,
        assignedBoats: 0,
      });
    });
    shipyard.teams = STANDARD_DEPARTMENTS.length;
  }

  emit();
  return id;
}

export function addTeam(
  shipyardId: string,
  input: { name: string; description: string; memberIds?: string[] }
): string {
  const id = uniqueId(
    slugify(input.name),
    (i) => !!teamById(shipyardId, i)
  );
  const list = (state.teamsByShipyard[shipyardId] ??= []);
  list.push({
    id,
    shipyardId,
    name: input.name.trim(),
    description: input.description.trim(),
    memberCount: 0,
    assignedBoats: 0,
  });
  const sy = shipyardById(shipyardId);
  if (sy) sy.teams += 1;
  // Link any pre-selected existing people as founding members.
  (input.memberIds ?? []).forEach((pid) =>
    linkPersonToTeam(id, shipyardId, pid)
  );
  emit();
  return id;
}

export function addYacht(
  shipyardId: string,
  input: {
    code: string;
    name?: string;
    mmsi?: string;
    stage?: YachtStage;
    shipyardDeliveryDate?: string;
    customerDeliveryDate?: string;
    assetUuid?: string;
  }
): string {
  const id = uniqueId(slugify(input.code), (i) => !!yachtById(shipyardId, i));
  const mmsi = input.mmsi?.trim() || null;
  const stage = input.stage ?? "production";
  const today = new Date().toISOString();
  const list = (state.yachtsByShipyard[shipyardId] ??= []);
  list.push({
    id,
    shipyardId,
    code: input.code.trim(),
    name: input.name?.trim() || undefined,
    status: stage === "production" ? "production" : "delivered",
    stage,
    productionDate: today,
    shipyardDeliveryDate: input.shipyardDeliveryDate || undefined,
    customerDeliveryDate: input.customerDeliveryDate || undefined,
    mmsi,
    lastUpdate: "Just now",
    assetUuid: input.assetUuid?.trim() || undefined,
  });
  const sy = shipyardById(shipyardId);
  if (sy) sy.yachts += 1;
  emit();
  return id;
}

/** Set (or clear) a yacht's D.gree Asset UUID — pasted from the core backend. */
export function setYachtAssetUuid(
  shipyardId: string,
  yachtId: string,
  uuid: string
) {
  const y = yachtById(shipyardId, yachtId);
  if (!y) return;
  y.assetUuid = uuid.trim() || undefined;
  emit();
}

/** Identity fields edited together from the yacht-details card. */
export function setYachtDetails(
  shipyardId: string,
  yachtId: string,
  input: { assetUuid: string; mmsi: string; imo: string }
) {
  const y = yachtById(shipyardId, yachtId);
  if (!y) return;
  y.assetUuid = input.assetUuid.trim() || undefined;
  y.mmsi = input.mmsi.trim() || null;
  y.imo = input.imo.trim() || undefined;
  emit();
}

/**
 * Move a yacht along its delivery lifecycle, stamping the relevant date. When
 * `date` is omitted, today is used (ISO yyyy-mm-dd).
 */
export function setYachtStage(
  shipyardId: string,
  yachtId: string,
  stage: YachtStage,
  date?: string
) {
  const y = yachtById(shipyardId, yachtId);
  if (!y) return;
  const stamp = date || new Date().toISOString();
  y.stage = stage;
  y.status = stage === "production" ? "production" : "delivered";
  if (stage === "production") {
    y.productionDate = y.productionDate || stamp;
    y.shipyardDeliveryDate = undefined;
    y.customerDeliveryDate = undefined;
  } else if (stage === "pre_delivery") {
    // keep an existing date (e.g. on revert); stamp today when first reached
    y.shipyardDeliveryDate = date || y.shipyardDeliveryDate || stamp;
    y.customerDeliveryDate = undefined;
  } else {
    y.shipyardDeliveryDate = y.shipyardDeliveryDate || stamp;
    y.customerDeliveryDate = date || y.customerDeliveryDate || stamp;
  }
  y.lastUpdate = "Just now";
  emit();
}

/** Set the exact set of yachts a team can access (within one shipyard). */
export function setTeamYachtLinks(
  shipyardId: string,
  teamId: string,
  yachtIds: string[]
) {
  const keep = new Set(yachtIds);
  state.teamYachtLinks = state.teamYachtLinks.filter(
    (l) => !(l.shipyardId === shipyardId && l.teamId === teamId)
  );
  keep.forEach((yachtId) =>
    state.teamYachtLinks.push({ shipyardId, teamId, yachtId })
  );
  emit();
}

/** Set the exact set of teams that can access a yacht (within one shipyard). */
export function setYachtTeamLinks(
  shipyardId: string,
  yachtId: string,
  teamIds: string[]
) {
  const keep = new Set(teamIds);
  state.teamYachtLinks = state.teamYachtLinks.filter(
    (l) => !(l.shipyardId === shipyardId && l.yachtId === yachtId)
  );
  keep.forEach((teamId) =>
    state.teamYachtLinks.push({ shipyardId, teamId, yachtId })
  );
  emit();
}

export function addGroupPerson(
  groupId: string,
  input: {
    name: string;
    handle?: string;
    brands: string;
    allBrands: boolean;
    status: MemberStatus;
  }
) {
  const list = (state.peopleByGroup[groupId] ??= []);
  const id = uniqueId(slugify(input.name), (i) => list.some((p) => p.id === i));
  const handle = input.handle?.trim() || handleFromName(input.name);
  list.push({
    id,
    name: input.name.trim(),
    handle,
    brands: input.brands,
    allBrands: input.allBrands,
    status: input.status,
  });
  // Also register in the shared directory so they become team candidates in
  // this group.
  registerPerson({
    id,
    name: input.name.trim(),
    handle,
    status: input.status,
    kind: "regular",
    groupId,
  });
  emit();
}

export function addTeamMember(
  teamId: string,
  shipyardId: string,
  input: { name: string; handle?: string; status: MemberStatus }
) {
  const list = (state.membersByTeam[teamId] ??= []);
  const id = uniqueId(slugify(input.name), (i) => list.some((m) => m.id === i));
  const handle = input.handle?.trim() || handleFromName(input.name);
  list.push({
    id,
    name: input.name.trim(),
    handle,
    status: input.status,
  });
  const team = teamById(shipyardId, teamId);
  if (team) team.memberCount += 1;
  // A freshly invited person joins the directory as a regular in this
  // shipyard's group, so they can be reused on other teams later.
  const sy = shipyardById(shipyardId);
  registerPerson({
    id,
    name: input.name.trim(),
    handle,
    status: input.status,
    kind: "regular",
    groupId: sy?.groupId || undefined,
  });
  emit();
}

/**
 * Power of attorney is the owner's to hold or to hand over, and only one person
 * on a yacht holds it — so this sets the holder rather than toggling a flag.
 * Delegating with no captain on the team yet leaves it with the owner; it isn't
 * dropped on the floor.
 */
export function setPoaDelegatedToCaptain(yachtId: string, delegate: boolean) {
  const list = state.ownerTeamByYacht[yachtId] ?? [];
  const owner = list.find((m) => m.role === "owner");
  const captain = list.find((m) => m.role === "captain");
  const holder = (delegate ? captain : owner) ?? owner;
  list.forEach((m) => {
    m.poa = m === holder ? true : undefined;
  });
  emit();
}

/** Edit one yacht-team member's access (role / power of attorney). */
export function updateOwnerTeamMember(
  yachtId: string,
  memberId: string,
  patch: { role?: YachtRole; poa?: boolean }
) {
  const m = (state.ownerTeamByYacht[yachtId] ?? []).find(
    (x) => x.id === memberId
  );
  if (!m) return;
  if (patch.role) m.role = patch.role;
  if (patch.poa !== undefined) m.poa = patch.poa || undefined;
  emit();
}

/** Revoke a person's access to this yacht by dropping them from its team. */
export function removeOwnerTeamMember(yachtId: string, memberId: string) {
  const list = state.ownerTeamByYacht[yachtId];
  if (!list) return;
  const i = list.findIndex((m) => m.id === memberId);
  if (i === -1) return;
  list.splice(i, 1);
  emit();
}

export function addOwnerTeamMember(
  yachtId: string,
  input: { name: string; handle?: string; role: YachtRole; poa: boolean }
) {
  const list = (state.ownerTeamByYacht[yachtId] ??= []);
  list.push({
    id: uniqueId(slugify(input.name), (i) => list.some((m) => m.id === i)),
    name: input.name.trim(),
    handle: input.handle?.trim() || handleFromName(input.name),
    role: input.role,
    poa: input.poa || undefined,
  });
  emit();
}
