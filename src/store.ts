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
  accounts as seedAccounts,
  brands as seedBrands,
  teamsByBrand as seedTeams,
  membersByTeam as seedMembers,
  yachtsByBrand as seedYachts,
  ownerTeamByYacht as seedOwnerTeam,
  peopleByAccount as seedPeople,
  directoryPeople as seedDirectory,
  teamYachtLinks as seedLinks,
  type Account,
  type Brand,
  type Team,
  type Member,
  type Yacht,
  type OwnerTeamMember,
  type AccountPerson,
  type Person,
  type TeamYachtLink,
  type MemberStatus,
  type YachtRole,
  type YachtStage,
} from "./data/mock";

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

interface State {
  accounts: Account[];
  brands: Brand[];
  teamsByBrand: Record<string, Team[]>;
  membersByTeam: Record<string, Member[]>;
  yachtsByBrand: Record<string, Yacht[]>;
  ownerTeamByYacht: Record<string, OwnerTeamMember[]>;
  peopleByAccount: Record<string, AccountPerson[]>;
  people: Person[]; // shared directory (candidates for team membership)
  teamYachtLinks: TeamYachtLink[]; // many-to-many team↔yacht access
}

function seededState(): State {
  return {
    accounts: clone(seedAccounts),
    brands: clone(seedBrands),
    teamsByBrand: clone(seedTeams),
    membersByTeam: clone(seedMembers),
    yachtsByBrand: clone(seedYachts),
    ownerTeamByYacht: clone(seedOwnerTeam),
    peopleByAccount: clone(seedPeople),
    people: clone(seedDirectory),
    teamYachtLinks: clone(seedLinks),
  };
}

// ---- persistence (localStorage) -----------------------------------------
// Acts as a lightweight "DB": whatever you add is saved in the browser and
// survives reloads. Bump STORAGE_VERSION to invalidate old snapshots when the
// data shape changes. Clear it from the UI via resetStore().

const STORAGE_KEY = "dgree.access.v1";
// 8: accounts/brands rename — the state keys changed, so older snapshots
// would deserialise into a shape this code no longer reads.
const STORAGE_VERSION = 8;

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

export const getAccounts = () => state.accounts;
export const getBrands = () => state.brands;

export const accountById = (id: string) => state.accounts.find((g) => g.id === id);
export const brandById = (id: string) =>
  state.brands.find((s) => s.id === id);
export const brandsInAccount = (accountId: string) =>
  state.brands.filter((s) => s.accountId === accountId);
/** Brands not yet attached to any account — the pool for "Create account". */
export const unassignedBrands = () =>
  state.brands.filter((s) => !s.accountId);
export const peopleInAccount = (accountId: string) =>
  state.peopleByAccount[accountId] ?? [];
export const getDirectory = () => state.people;
export const personById = (id: string) =>
  state.people.find((p) => p.id === id);

/**
 * People who may be linked into a team in this account: regulars whose home account
 * matches, plus all SailADV people (who span accounts). A blank accountId (e.g. a
 * brand not yet assigned) yields SailADV people only.
 */
export const candidatePeopleForAccount = (accountId: string): Person[] =>
  state.people.filter(
    (p) => p.kind === "sail-adv" || (!!accountId && p.accountId === accountId)
  );

/**
 * People who may be linked into a team in this brand (its account's regulars +
 * all SailADV). Optionally excludes anyone already in `excludeTeamId`.
 */
export const candidatePeopleForBrand = (
  brandId: string,
  excludeTeamId?: string
): Person[] => {
  const sy = brandById(brandId);
  if (!sy) return [];
  const already = new Set(
    excludeTeamId ? membersInTeam(excludeTeamId).map((m) => m.id) : []
  );
  return candidatePeopleForAccount(sy.accountId).filter((p) => !already.has(p.id));
};

// ---- team ↔ yacht access links ------------------------------------------

export const yachtsForTeam = (brandId: string, teamId: string): Yacht[] => {
  const ids = new Set(
    state.teamYachtLinks
      .filter((l) => l.brandId === brandId && l.teamId === teamId)
      .map((l) => l.yachtId)
  );
  return yachtsInBrand(brandId).filter((y) => ids.has(y.id));
};

export const teamsForYacht = (brandId: string, yachtId: string): Team[] => {
  const ids = new Set(
    state.teamYachtLinks
      .filter((l) => l.brandId === brandId && l.yachtId === yachtId)
      .map((l) => l.teamId)
  );
  return teamsInBrand(brandId).filter((t) => ids.has(t.id));
};
export const teamsInBrand = (brandId: string) =>
  state.teamsByBrand[brandId] ?? [];
export const yachtsInBrand = (brandId: string) =>
  state.yachtsByBrand[brandId] ?? [];
export const membersInTeam = (teamId: string) =>
  state.membersByTeam[teamId] ?? [];
export const ownerTeamOfYacht = (yachtId: string) =>
  state.ownerTeamByYacht[yachtId] ?? [];
export const teamById = (brandId: string, teamId: string) =>
  teamsInBrand(brandId).find((t) => t.id === teamId);
export const yachtById = (brandId: string, yachtId: string) =>
  yachtsInBrand(brandId).find((y) => y.id === yachtId);

export interface AccountWithBrands extends Account {
  brands: Brand[];
  yachts: number;
  users: number;
}

export const getAccountsWithBrands = (): AccountWithBrands[] =>
  state.accounts.map((g) => {
    const inAccount = brandsInAccount(g.id);
    return {
      ...g,
      brands: inAccount,
      yachts: inAccount.reduce((n, s) => n + s.yachts, 0),
      users: inAccount.reduce((n, s) => n + s.users, 0),
    };
  });

export const getTotals = () => ({
  brands: state.brands.length,
  accounts: state.accounts.length,
  yachts: Math.max(
    67,
    state.brands.reduce((n, s) => n + s.yachts, 0)
  ),
});

// ---- mutations -----------------------------------------------------------

/** Insert into the shared directory if not already present; returns the id. */
function registerPerson(p: Person): string {
  if (!state.people.some((x) => x.id === p.id)) state.people.push(p);
  return p.id;
}

/** Link an existing directory person into a team (no-op if already a member). */
function linkPersonToTeam(teamId: string, brandId: string, personId: string) {
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
  const team = teamById(brandId, teamId);
  if (team) team.memberCount += 1;
}

export function addAccount(
  name: string,
  opts?: { brandIds?: string[] }
): string {
  const id = uniqueId(slugify(name), (i) => !!accountById(i));
  state.accounts.push({ id, name: name.trim() });
  // Attach any selected unassigned brands to the new account.
  (opts?.brandIds ?? []).forEach((sid) => {
    const sy = brandById(sid);
    if (sy && !sy.accountId) sy.accountId = id;
  });
  emit();
  return id;
}

/** Add an existing directory person to an existing team. */
export function addExistingTeamMember(
  teamId: string,
  brandId: string,
  personId: string
) {
  linkPersonToTeam(teamId, brandId, personId);
  emit();
}

const STANDARD_DEPARTMENTS = [
  "Tech Dep",
  "Customer Care",
  "Warranty Dep",
];

export function addBrand(
  accountId: string,
  name: string,
  opts?: { standardDepartments?: boolean }
): string {
  const id = uniqueId(slugify(name), (i) => !!brandById(i));
  const brand: Brand = {
    id,
    name: name.trim(),
    accountId,
    users: 0,
    yachts: 0,
    teams: 0,
  };
  state.brands.push(brand);
  state.teamsByBrand[id] = [];
  state.yachtsByBrand[id] = [];

  if (opts?.standardDepartments) {
    STANDARD_DEPARTMENTS.forEach((n) => {
      state.teamsByBrand[id].push({
        id: slugify(n),
        brandId: id,
        name: n,
        memberCount: 0,
        assignedBoats: 0,
      });
    });
    brand.teams = STANDARD_DEPARTMENTS.length;
  }

  emit();
  return id;
}

export function addTeam(
  brandId: string,
  input: { name: string; memberIds?: string[] }
): string {
  const id = uniqueId(
    slugify(input.name),
    (i) => !!teamById(brandId, i)
  );
  const list = (state.teamsByBrand[brandId] ??= []);
  list.push({
    id,
    brandId,
    name: input.name.trim(),
    memberCount: 0,
    assignedBoats: 0,
  });
  const sy = brandById(brandId);
  if (sy) sy.teams += 1;
  // Link any pre-selected existing people as founding members.
  (input.memberIds ?? []).forEach((pid) =>
    linkPersonToTeam(id, brandId, pid)
  );
  emit();
  return id;
}

export function addYacht(
  brandId: string,
  input: {
    code: string;
    name?: string;
    mmsi?: string;
    stage?: YachtStage;
    brandDeliveryDate?: string;
    customerDeliveryDate?: string;
    assetUuid?: string;
  }
): string {
  const id = uniqueId(slugify(input.code), (i) => !!yachtById(brandId, i));
  const mmsi = input.mmsi?.trim() || null;
  const stage = input.stage ?? "production";
  const today = new Date().toISOString();
  const list = (state.yachtsByBrand[brandId] ??= []);
  list.push({
    id,
    brandId,
    code: input.code.trim(),
    name: input.name?.trim() || undefined,
    status: stage === "production" ? "production" : "delivered",
    stage,
    productionDate: today,
    brandDeliveryDate: input.brandDeliveryDate || undefined,
    customerDeliveryDate: input.customerDeliveryDate || undefined,
    mmsi,
    lastUpdate: "Just now",
    assetUuid: input.assetUuid?.trim() || undefined,
  });
  const sy = brandById(brandId);
  if (sy) sy.yachts += 1;
  emit();
  return id;
}

/** Set (or clear) a yacht's D.gree Asset UUID — pasted from the core backend. */
export function setYachtAssetUuid(
  brandId: string,
  yachtId: string,
  uuid: string
) {
  const y = yachtById(brandId, yachtId);
  if (!y) return;
  y.assetUuid = uuid.trim() || undefined;
  emit();
}

/** Identity fields edited together from the yacht-details card. */
export function setYachtDetails(
  brandId: string,
  yachtId: string,
  input: { assetUuid: string; mmsi: string; imo: string }
) {
  const y = yachtById(brandId, yachtId);
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
  brandId: string,
  yachtId: string,
  stage: YachtStage,
  date?: string
) {
  const y = yachtById(brandId, yachtId);
  if (!y) return;
  const stamp = date || new Date().toISOString();
  y.stage = stage;
  y.status = stage === "production" ? "production" : "delivered";
  if (stage === "production") {
    y.productionDate = y.productionDate || stamp;
    y.brandDeliveryDate = undefined;
    y.customerDeliveryDate = undefined;
  } else if (stage === "pre_delivery") {
    // keep an existing date (e.g. on revert); stamp today when first reached
    y.brandDeliveryDate = date || y.brandDeliveryDate || stamp;
    y.customerDeliveryDate = undefined;
  } else {
    y.brandDeliveryDate = y.brandDeliveryDate || stamp;
    y.customerDeliveryDate = date || y.customerDeliveryDate || stamp;
  }
  y.lastUpdate = "Just now";
  emit();
}

/** Set the exact set of yachts a team can access (within one brand). */
export function setTeamYachtLinks(
  brandId: string,
  teamId: string,
  yachtIds: string[]
) {
  const keep = new Set(yachtIds);
  state.teamYachtLinks = state.teamYachtLinks.filter(
    (l) => !(l.brandId === brandId && l.teamId === teamId)
  );
  keep.forEach((yachtId) =>
    state.teamYachtLinks.push({ brandId, teamId, yachtId })
  );
  emit();
}

/** Set the exact set of teams that can access a yacht (within one brand). */
export function setYachtTeamLinks(
  brandId: string,
  yachtId: string,
  teamIds: string[]
) {
  const keep = new Set(teamIds);
  state.teamYachtLinks = state.teamYachtLinks.filter(
    (l) => !(l.brandId === brandId && l.yachtId === yachtId)
  );
  keep.forEach((teamId) =>
    state.teamYachtLinks.push({ brandId, teamId, yachtId })
  );
  emit();
}

export function addAccountPerson(
  accountId: string,
  input: {
    name: string;
    handle?: string;
    brands: string;
    allBrands: boolean;
    status: MemberStatus;
  }
) {
  const list = (state.peopleByAccount[accountId] ??= []);
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
  // this account.
  registerPerson({
    id,
    name: input.name.trim(),
    handle,
    status: input.status,
    kind: "regular",
    accountId,
  });
  emit();
}

export function addTeamMember(
  teamId: string,
  brandId: string,
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
  const team = teamById(brandId, teamId);
  if (team) team.memberCount += 1;
  // A freshly invited person joins the directory as a regular in this
  // brand's account, so they can be reused on other teams later.
  const sy = brandById(brandId);
  registerPerson({
    id,
    name: input.name.trim(),
    handle,
    status: input.status,
    kind: "regular",
    accountId: sy?.accountId || undefined,
  });
  emit();
}

/**
 * Power of attorney is what an owner grants, not something they hold — it is
 * the authority to act on the owner's behalf, so it always sits with someone
 * else. Any member can hold it whatever their role, including one who has been
 * invited but never signed in, and an owner can grant it to several people at
 * once.
 *
 * Takes the full set of holders, so granting and withdrawing are the same call.
 */
export function setPoaHolders(yachtId: string, memberIds: string[]) {
  const list = state.ownerTeamByYacht[yachtId] ?? [];
  list.forEach((m) => {
    m.poa = memberIds.includes(m.id) && m.role !== "owner" ? true : undefined;
  });
  emit();
}

/**
 * Record what someone accepted at sign-in. Stores the version rather than a
 * yes/no, so a later document change is visible as a version behind rather than
 * silently reading as "accepted".
 */
export function acceptDocuments(
  yachtId: string,
  memberId: string,
  input: { tcVersion: string; privacyVersion: string }
) {
  const m = (state.ownerTeamByYacht[yachtId] ?? []).find(
    (x) => x.id === memberId
  );
  if (!m) return;
  m.tcVersion = input.tcVersion;
  m.privacyVersion = input.privacyVersion;
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
