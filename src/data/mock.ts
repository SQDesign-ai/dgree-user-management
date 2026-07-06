// -------------------------------------------------------------------------
// Mock data for the D.gree Yachting access-management prototype.
// All ids are stable slugs so they can be used directly in routes.
// -------------------------------------------------------------------------

export type YachtStatus = "delivered" | "production";
export type MemberStatus = "active" | "invited" | "suspended";
export type YachtRole = "owner" | "captain" | "crew" | "guest";
export type AccessStatus = "active" | "expired" | "pending";

export interface Group {
  id: string;
  name: string;
}

export interface Shipyard {
  id: string;
  name: string;
  groupId: string;
  users: number;
  yachts: number;
  teams: number;
}

// A person granted access at the group level, reaching one or more brands
// (shipyards) and every yacht under them.
export interface GroupPerson {
  id: string;
  name: string;
  handle: string;
  brands: string; // display label, e.g. "All 3 brands" or "Sanlorenzo, Bluegame"
  allBrands: boolean;
  status: MemberStatus;
}

export interface Team {
  id: string;
  shipyardId: string;
  name: string;
  description: string;
  memberCount: number;
  assignedBoats: number;
}

export interface Member {
  id: string;
  name: string;
  handle: string;
  status: MemberStatus;
}

export interface Yacht {
  id: string;
  shipyardId: string;
  code: string;
  name?: string;
  status: YachtStatus;
  mmsi: string | null;
  lastUpdate: string;
}

export interface OwnerTeamMember {
  id: string;
  name: string;
  handle: string;
  role: YachtRole;
  poa?: boolean;
}

export interface DataAccessGrant {
  id: string;
  party: string;
  partyRole: string;
  window: string;
  source: string;
  status: AccessStatus;
  actions: ("extend" | "revoke" | "regrant")[];
}

// Global org that owns the sail-adv (advisory) teams shown on the second tab.
export interface SailAdvTeam {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  scope: string;
}

export const groups: Group[] = [
  { id: "sanlorenzo", name: "Sanlorenzo" },
  { id: "azimut-benetti", name: "Azimut-Benetti" },
  { id: "cantiere-del-pardo", name: "Cantiere del Pardo" },
  { id: "triodeniz", name: "Triodeniz" },
];

export const shipyards: Shipyard[] = [
  { id: "sanlorenzo", name: "Sanlorenzo", groupId: "sanlorenzo", users: 22, yachts: 43, teams: 3 },
  { id: "benetti-yachts", name: "Benetti Yachts", groupId: "azimut-benetti", users: 8, yachts: 17, teams: 3 },
  { id: "grand-soleil-yachts", name: "Grand Soleil Yachts", groupId: "cantiere-del-pardo", users: 0, yachts: 1, teams: 3 },
  { id: "pardo-production-site", name: "Pardo Production Site", groupId: "cantiere-del-pardo", users: 0, yachts: 1, teams: 3 },
  { id: "bluegame", name: "Bluegame", groupId: "sanlorenzo", users: 0, yachts: 1, teams: 3 },
  { id: "triodeniz", name: "Triodeniz", groupId: "triodeniz", users: 3, yachts: 0, teams: 3 },
  { id: "van-dutch", name: "Van Dutch", groupId: "cantiere-del-pardo", users: 0, yachts: 0, teams: 3 },
  { id: "pardo-yachts", name: "Pardo Yachts", groupId: "cantiere-del-pardo", users: 0, yachts: 0, teams: 3 },
  { id: "nautor", name: "Nautor", groupId: "sanlorenzo", users: 0, yachts: 0, teams: 3 },
];

// Group-level people (keyed by group id).
export const peopleByGroup: Record<string, GroupPerson[]> = {
  sanlorenzo: [
    { id: "l-ferrari", name: "Luca Ferrari", handle: "@l_ferrari", brands: "All 3 brands", allBrands: true, status: "active" },
    { id: "m-bruno", name: "Marta Bruno", handle: "@m_bruno", brands: "All 3 brands", allBrands: true, status: "active" },
    { id: "d-costa", name: "Davide Costa", handle: "@d_costa", brands: "Sanlorenzo, Bluegame", allBrands: false, status: "invited" },
  ],
};

export const sailAdvTeams: SailAdvTeam[] = [
  { id: "sail-adv-ops", name: "Fleet Operations", description: "Cross-shipyard operations desk", memberCount: 12, scope: "All groups" },
  { id: "sail-adv-support", name: "Owner Support", description: "Concierge & owner relations", memberCount: 7, scope: "All groups" },
  { id: "sail-adv-data", name: "Data & Analytics", description: "Telemetry and reporting", memberCount: 4, scope: "All groups" },
];

export const teamsByShipyard: Record<string, Team[]> = {
  sanlorenzo: [
    { id: "tech-dep", shipyardId: "sanlorenzo", name: "Tech Dep", description: "Technical department", memberCount: 21, assignedBoats: 43 },
    { id: "customer-care", shipyardId: "sanlorenzo", name: "Customer Care", description: "Customer support", memberCount: 0, assignedBoats: 43 },
    { id: "warranty-dep", shipyardId: "sanlorenzo", name: "Warranty Dep", description: "Warranty & after-sales", memberCount: 0, assignedBoats: 43 },
  ],
};

export const membersByTeam: Record<string, Member[]> = {
  "tech-dep": [
    { id: "a-franzi", name: "Alessandro Franzi", handle: "@a_franzi", status: "active" },
    { id: "a-gatto", name: "Alberto Gatto", handle: "@a_gatto", status: "active" },
    { id: "a-guido", name: "Andrea Guido", handle: "@a_guido", status: "active" },
    { id: "a-mdshah", name: "Alam MDShah", handle: "@a_mdshah", status: "active" },
    { id: "a-sansica", name: "Antonio Sansica", handle: "@a_sansica", status: "active" },
    { id: "a-venturi", name: "Alberto Venturi", handle: "@a.venturi", status: "active" },
    { id: "a-castagno", name: "Andrea Castagno", handle: "@a_castagno", status: "active" },
    { id: "b-gerceker", name: "berkay gerceker", handle: "@b_gerceker", status: "invited" },
  ],
};

export const yachtsByShipyard: Record<string, Yacht[]> = {
  sanlorenzo: [
    { id: "sd118-129", shipyardId: "sanlorenzo", code: "SD118-129", name: "UNIQUE S", status: "delivered", mmsi: "256834000", lastUpdate: "27 Jun 2026" },
    { id: "sl50-171", shipyardId: "sanlorenzo", code: "SL50-171", name: "CONTIGO", status: "delivered", mmsi: "256962000", lastUpdate: "03 Jun 2026" },
    { id: "sp110-05", shipyardId: "sanlorenzo", code: "SP110-05", name: "SuperV", status: "delivered", mmsi: "533133096", lastUpdate: "20 May 2026" },
    { id: "sd90-119", shipyardId: "sanlorenzo", code: "SD90-119", name: "MY SAL", status: "delivered", mmsi: "256498000", lastUpdate: "20 May 2026" },
    { id: "sx88-134", shipyardId: "sanlorenzo", code: "SX88-134", status: "delivered", mmsi: "256004052", lastUpdate: "20 May 2026" },
    { id: "sl200-72", shipyardId: "sanlorenzo", code: "SL200-72", status: "delivered", mmsi: "538072431", lastUpdate: "20 May 2026" },
    { id: "sl90a-877", shipyardId: "sanlorenzo", code: "SL90A-877", status: "production", mmsi: null, lastUpdate: "28 May 2026" },
    { id: "sp92-16", shipyardId: "sanlorenzo", code: "SP92-16", status: "production", mmsi: null, lastUpdate: "28 May 2026" },
    { id: "sx88-164", shipyardId: "sanlorenzo", code: "SX88-164", status: "production", mmsi: null, lastUpdate: "20 May 2026" },
    { id: "sl96a-885", shipyardId: "sanlorenzo", code: "SL96A-885", status: "production", mmsi: null, lastUpdate: "20 May 2026" },
  ],
};

// Owner-team roster for a specific yacht (keyed by yacht id).
export const ownerTeamByYacht: Record<string, OwnerTeamMember[]> = {
  "sl50-171": [
    { id: "m-rossi", name: "Marco Rossi", handle: "@m_rossi", role: "owner", poa: true },
    { id: "l-bianchi", name: "Luca Bianchi", handle: "@l_bianchi", role: "captain" },
    { id: "g-conti", name: "Giulia Conti", handle: "@g_conti", role: "crew" },
    { id: "p-neri", name: "Paolo Neri", handle: "@p_neri", role: "crew" },
    { id: "s-marino", name: "Sofia Marino", handle: "@s_marino", role: "crew" },
  ],
};

export const dataAccessByYacht: Record<string, DataAccessGrant[]> = {
  "sl50-171": [
    {
      id: "grant-cc",
      party: "Sanlorenzo",
      partyRole: "Customer Care",
      window: "14 Mar 2026 → 14 Mar 2027",
      source: "Granted by owner (M. Rossi)",
      status: "active",
      actions: ["extend", "revoke"],
    },
    {
      id: "grant-bv",
      party: "Bureau Veritas",
      partyRole: "Insurer · 3rd party",
      window: "01 Feb 2026 → 31 Jan 2027",
      source: "Granted by captain · PoA",
      status: "active",
      actions: ["extend", "revoke"],
    },
    {
      id: "grant-prod",
      party: "Sanlorenzo",
      partyRole: "Production",
      window: "27 Jun 2024 → 14 Mar 2026",
      source: "Auto on delivery (+1 yr)",
      status: "expired",
      actions: ["regrant"],
    },
  ],
};

// ---- lookups -------------------------------------------------------------

export const groupById = (id: string) => groups.find((g) => g.id === id);
export const shipyardById = (id: string) => shipyards.find((s) => s.id === id);
export const shipyardsInGroup = (groupId: string) =>
  shipyards.filter((s) => s.groupId === groupId);
export const peopleInGroup = (groupId: string) => peopleByGroup[groupId] ?? [];

export interface GroupWithShipyards extends Group {
  shipyards: Shipyard[];
  yachts: number;
  users: number;
}

// Groups joined with their shipyards + aggregate counts, for the main page.
export const groupsWithShipyards: GroupWithShipyards[] = groups.map((g) => {
  const inGroup = shipyardsInGroup(g.id);
  return {
    ...g,
    shipyards: inGroup,
    yachts: inGroup.reduce((n, s) => n + s.yachts, 0),
    users: inGroup.reduce((n, s) => n + s.users, 0),
  };
});
export const teamById = (shipyardId: string, teamId: string) =>
  (teamsByShipyard[shipyardId] ?? []).find((t) => t.id === teamId);
export const yachtById = (shipyardId: string, yachtId: string) =>
  (yachtsByShipyard[shipyardId] ?? []).find((y) => y.id === yachtId);

export const totals = {
  shipyards: shipyards.length,
  groups: groups.length,
  // Fleet-wide figure shown in the header (includes yachts not enumerated
  // in the mock rows above); matches the design's summary count.
  yachts: 67,
};

export const yachtLabel = (y: Pick<Yacht, "code" | "name">) =>
  y.name ? `${y.code} · ${y.name}` : y.code;
