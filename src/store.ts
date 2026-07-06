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
  type Group,
  type Shipyard,
  type Team,
  type Member,
  type Yacht,
  type OwnerTeamMember,
  type GroupPerson,
  type MemberStatus,
  type YachtRole,
  type YachtStatus,
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
  };
}

// ---- persistence (localStorage) -----------------------------------------
// Acts as a lightweight "DB": whatever you add is saved in the browser and
// survives reloads. Bump STORAGE_VERSION to invalidate old snapshots when the
// data shape changes. Clear it from the UI via resetStore().

const STORAGE_KEY = "dgree.access.v1";
const STORAGE_VERSION = 1;

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
export const peopleInGroup = (groupId: string) =>
  state.peopleByGroup[groupId] ?? [];
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

export function addGroup(name: string): string {
  const id = uniqueId(slugify(name), (i) => !!groupById(i));
  state.groups.push({ id, name: name.trim() });
  emit();
  return id;
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
  input: { name: string; description: string }
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
  emit();
  return id;
}

export function addYacht(
  shipyardId: string,
  input: {
    code: string;
    name?: string;
    mmsi?: string;
    status?: YachtStatus;
  }
): string {
  const id = uniqueId(slugify(input.code), (i) => !!yachtById(shipyardId, i));
  const mmsi = input.mmsi?.trim() || null;
  const list = (state.yachtsByShipyard[shipyardId] ??= []);
  list.push({
    id,
    shipyardId,
    code: input.code.trim(),
    name: input.name?.trim() || undefined,
    status: input.status ?? (mmsi ? "delivered" : "production"),
    mmsi,
    lastUpdate: "Just now",
  });
  const sy = shipyardById(shipyardId);
  if (sy) sy.yachts += 1;
  emit();
  return id;
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
  list.push({
    id: uniqueId(slugify(input.name), (i) => list.some((p) => p.id === i)),
    name: input.name.trim(),
    handle: input.handle?.trim() || handleFromName(input.name),
    brands: input.brands,
    allBrands: input.allBrands,
    status: input.status,
  });
  emit();
}

export function addTeamMember(
  teamId: string,
  shipyardId: string,
  input: { name: string; handle?: string; status: MemberStatus }
) {
  const list = (state.membersByTeam[teamId] ??= []);
  list.push({
    id: uniqueId(slugify(input.name), (i) => list.some((m) => m.id === i)),
    name: input.name.trim(),
    handle: input.handle?.trim() || handleFromName(input.name),
    status: input.status,
  });
  const team = teamById(shipyardId, teamId);
  if (team) team.memberCount += 1;
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
