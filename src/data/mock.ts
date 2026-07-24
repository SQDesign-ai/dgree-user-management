// -------------------------------------------------------------------------
// Mock data for the D.gree Yachting access-management prototype.
// All ids are stable slugs so they can be used directly in routes.
// -------------------------------------------------------------------------

export type YachtStatus = "delivered" | "production";
// Delivery lifecycle: production → pre_delivery (to brand) → delivered (to
// customer). Drives which teams can access the vessel.
export type YachtStage = "production" | "pre_delivery" | "delivered";
export type MemberStatus = "active" | "invited" | "suspended";
// The owner-team has three departments.
export type YachtRole = "owner" | "captain" | "crew" | "guest";
export type AccessStatus = "active" | "expired" | "pending";

// "regular" people belong to a single account (home accountId) and can be linked
// into any team/brand *within that account*. "sail-adv" people belong to the
// global SailADV org and can be linked across multiple accounts & brands.
export type PersonKind = "regular" | "sail-adv";

export interface Account {
  id: string;
  name: string;
}

export interface Brand {
  id: string;
  name: string;
  accountId: string;
  users: number;
  yachts: number;
  teams: number;
}

// A person granted access at the account level, reaching one or more brands
// (brands) and every yacht under them.
export interface AccountPerson {
  id: string;
  name: string;
  handle: string;
  brands: string; // display label, e.g. "All 3 brands" or "Sanlorenzo, Bluegame"
  allBrands: boolean;
  status: MemberStatus;
}

export interface Team {
  id: string;
  brandId: string;
  name: string;
  memberCount: number;
  assignedBoats: number;
}

export interface Member {
  id: string;
  name: string;
  handle: string;
  status: MemberStatus;
  kind?: PersonKind; // undefined ⇒ regular; "sail-adv" is badged in the UI
}

// A person in the shared directory. Team membership references these by id, so
// one person can be linked into many teams (and, for regulars, many brands
// within their home account; for sail-adv, across accounts).
export interface Person {
  id: string;
  name: string;
  handle: string;
  status: MemberStatus;
  kind: PersonKind;
  accountId?: string; // home account for regulars; undefined for sail-adv
}

export interface Yacht {
  id: string;
  brandId: string;
  code: string;
  name?: string;
  status: YachtStatus;
  stage?: YachtStage; // delivery lifecycle; falls back to status when absent
  productionDate?: string; // ISO yyyy-mm-dd — entered production
  brandDeliveryDate?: string; // ISO yyyy-mm-dd — delivered to brand
  customerDeliveryDate?: string; // ISO yyyy-mm-dd — delivered to customer
  mmsi: string | null;
  imo?: string; // IMO number — assigned to larger/commercial hulls, so optional
  lastUpdate: string;
  assetUuid?: string; // D.gree Asset UUID — pasted in; issued by the core backend
}

// A many-to-many access link between a team and a yacht, always within the
// same brand. Editable from both the team page and the yacht page.
export interface TeamYachtLink {
  brandId: string;
  teamId: string;
  yachtId: string;
}

export interface OwnerTeamMember {
  id: string;
  name: string;
  handle: string;
  role: YachtRole;
  poa?: boolean;
  /**
   * Which version of each document this person accepted, captured at first
   * sign-in. Undefined until they do — an invited person who has never signed
   * in has accepted nothing, and an older version means they accepted a
   * document that has since changed.
   */
  tcVersion?: string;
  privacyVersion?: string;
}

/** The documents currently in force — what a new sign-in would accept. */
export const CURRENT_TC_VERSION = "v2.1";
export const CURRENT_PRIVACY_VERSION = "v1.4";

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

export const accounts: Account[] = [
  { id: "sanlorenzo", name: "Sanlorenzo" },
  { id: "azimut-benetti", name: "Azimut-Benetti" },
  { id: "cantiere-del-pardo", name: "Cantiere del Pardo" },
  { id: "triodeniz", name: "Triodeniz" },
];

export const brands: Brand[] = [
  { id: "sanlorenzo", name: "Sanlorenzo", accountId: "sanlorenzo", users: 22, yachts: 43, teams: 3 },
  { id: "benetti-yachts", name: "Benetti Yachts", accountId: "azimut-benetti", users: 8, yachts: 17, teams: 3 },
  { id: "grand-soleil-yachts", name: "Grand Soleil Yachts", accountId: "cantiere-del-pardo", users: 0, yachts: 1, teams: 3 },
  { id: "pardo-production-site", name: "Pardo Production Site", accountId: "cantiere-del-pardo", users: 0, yachts: 1, teams: 3 },
  { id: "bluegame", name: "Bluegame", accountId: "sanlorenzo", users: 0, yachts: 1, teams: 3 },
  { id: "triodeniz", name: "Triodeniz", accountId: "triodeniz", users: 3, yachts: 0, teams: 3 },
  { id: "van-dutch", name: "Van Dutch", accountId: "cantiere-del-pardo", users: 0, yachts: 0, teams: 3 },
  { id: "pardo-yachts", name: "Pardo Yachts", accountId: "cantiere-del-pardo", users: 0, yachts: 0, teams: 3 },
  { id: "nautor", name: "Nautor", accountId: "sanlorenzo", users: 0, yachts: 0, teams: 3 },
];

// Account-level people (keyed by account id).
export const peopleByAccount: Record<string, AccountPerson[]> = {
  sanlorenzo: [
    { id: "l-ferrari", name: "Luca Ferrari", handle: "@l_ferrari", brands: "All 3 brands", allBrands: true, status: "active" },
    { id: "m-bruno", name: "Marta Bruno", handle: "@m_bruno", brands: "All 3 brands", allBrands: true, status: "active" },
    { id: "d-costa", name: "Davide Costa", handle: "@d_costa", brands: "Sanlorenzo, Bluegame", allBrands: false, status: "invited" },
  ],
};

// Shared people directory. Seeds the pool that "Create team" picks from.
// Regulars are scoped to a home account; sail-adv people are global and can be
// added to teams in any account/brand.
export const directoryPeople: Person[] = [
  // Sanlorenzo account-level people (also shown on the account People tab).
  { id: "l-ferrari", name: "Luca Ferrari", handle: "@l_ferrari", status: "active", kind: "regular", accountId: "sanlorenzo" },
  { id: "m-bruno", name: "Marta Bruno", handle: "@m_bruno", status: "active", kind: "regular", accountId: "sanlorenzo" },
  { id: "d-costa", name: "Davide Costa", handle: "@d_costa", status: "invited", kind: "regular", accountId: "sanlorenzo" },
  // Sanlorenzo Tech Dep members (also seeded into the tech-dep team).
  { id: "a-franzi", name: "Alessandro Franzi", handle: "@a_franzi", status: "active", kind: "regular", accountId: "sanlorenzo" },
  { id: "a-gatto", name: "Alberto Gatto", handle: "@a_gatto", status: "active", kind: "regular", accountId: "sanlorenzo" },
  { id: "a-guido", name: "Andrea Guido", handle: "@a_guido", status: "active", kind: "regular", accountId: "sanlorenzo" },
  { id: "a-mdshah", name: "Alam MDShah", handle: "@a_mdshah", status: "active", kind: "regular", accountId: "sanlorenzo" },
  { id: "a-sansica", name: "Antonio Sansica", handle: "@a_sansica", status: "active", kind: "regular", accountId: "sanlorenzo" },
  { id: "a-venturi", name: "Alberto Venturi", handle: "@a.venturi", status: "active", kind: "regular", accountId: "sanlorenzo" },
  { id: "a-castagno", name: "Andrea Castagno", handle: "@a_castagno", status: "active", kind: "regular", accountId: "sanlorenzo" },
  { id: "b-gerceker", name: "berkay gerceker", handle: "@b_gerceker", status: "invited", kind: "regular", accountId: "sanlorenzo" },
  // A couple of regulars in other accounts so their pickers aren't sail-adv-only.
  { id: "f-romano", name: "Francesca Romano", handle: "@f_romano", status: "active", kind: "regular", accountId: "azimut-benetti" },
  { id: "g-esposito", name: "Giorgio Esposito", handle: "@g_esposito", status: "active", kind: "regular", accountId: "cantiere-del-pardo" },
  // SailADV org — global people who can span accounts & brands.
  { id: "sa-ricci", name: "Elena Ricci", handle: "@e_ricci", status: "active", kind: "sail-adv" },
  { id: "sa-greco", name: "Matteo Greco", handle: "@m_greco", status: "active", kind: "sail-adv" },
  { id: "sa-rizzo", name: "Chiara Rizzo", handle: "@c_rizzo", status: "active", kind: "sail-adv" },
  { id: "sa-moretti", name: "Stefano Moretti", handle: "@s_moretti", status: "active", kind: "sail-adv" },
  { id: "sa-galli", name: "Valentina Galli", handle: "@v_galli", status: "invited", kind: "sail-adv" },
];

export const sailAdvTeams: SailAdvTeam[] = [
  { id: "sail-adv-ops", name: "Fleet Operations", description: "Cross-brand operations desk", memberCount: 12, scope: "All accounts" },
  { id: "sail-adv-support", name: "Owner Support", description: "Concierge & owner relations", memberCount: 7, scope: "All accounts" },
  { id: "sail-adv-data", name: "Data & Analytics", description: "Telemetry and reporting", memberCount: 4, scope: "All accounts" },
];

export const teamsByBrand: Record<string, Team[]> = {
  sanlorenzo: [
    { id: "tech-dep", brandId: "sanlorenzo", name: "Tech Dep", memberCount: 21, assignedBoats: 43 },
    { id: "customer-care", brandId: "sanlorenzo", name: "Customer Care", memberCount: 2, assignedBoats: 43 },
    { id: "warranty-dep", brandId: "sanlorenzo", name: "Warranty Dep", memberCount: 0, assignedBoats: 43 },
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
  // A couple of Tech Dep people also sit in Customer Care, so the user-details
  // drawer has someone who is linked into more than one team.
  "customer-care": [
    { id: "a-franzi", name: "Alessandro Franzi", handle: "@a_franzi", status: "active" },
    { id: "a-gatto", name: "Alberto Gatto", handle: "@a_gatto", status: "active" },
  ],
};

export const yachtsByBrand: Record<string, Yacht[]> = {
  sanlorenzo: [
    { id: "sd118-129", brandId: "sanlorenzo", code: "SD118-129", name: "UNIQUE S", status: "delivered", stage: "delivered", productionDate: "2024-04-15", brandDeliveryDate: "2025-09-20T09:14:32Z", customerDeliveryDate: "2026-06-27T15:42:08Z", mmsi: "256834000", imo: "9874102", lastUpdate: "27 Jun 2026" },
    { id: "sl50-171", brandId: "sanlorenzo", code: "SL50-171", name: "CONTIGO", status: "delivered", stage: "delivered", productionDate: "2024-09-02", brandDeliveryDate: "2025-11-10T11:05:47Z", customerDeliveryDate: "2026-03-14T14:20:11Z", mmsi: "256962000", imo: "9876543", lastUpdate: "03 Jun 2026", assetUuid: "a3f9c1e0-7b42-4d18-9f6a-2c5e8b0d4471" },
    { id: "sp110-05", brandId: "sanlorenzo", code: "SP110-05", name: "SuperV", status: "delivered", stage: "delivered", productionDate: "2024-01-10", brandDeliveryDate: "2025-07-04T08:30:15Z", customerDeliveryDate: "2026-05-20T16:12:45Z", mmsi: "533133096", lastUpdate: "20 May 2026" },
    { id: "sd90-119", brandId: "sanlorenzo", code: "SD90-119", name: "MY SAL", status: "delivered", stage: "pre_delivery", productionDate: "2025-06-18", brandDeliveryDate: "2026-05-02T10:15:27Z", mmsi: "256498000", imo: "9812477", lastUpdate: "20 May 2026" },
    { id: "sx88-134", brandId: "sanlorenzo", code: "SX88-134", status: "delivered", stage: "delivered", productionDate: "2024-03-05", brandDeliveryDate: "2025-10-12T10:45:22Z", customerDeliveryDate: "2026-05-18T13:05:09Z", mmsi: "256004052", lastUpdate: "20 May 2026" },
    { id: "sl200-72", brandId: "sanlorenzo", code: "SL200-72", status: "delivered", stage: "delivered", productionDate: "2023-11-22", brandDeliveryDate: "2025-06-30T09:00:03Z", customerDeliveryDate: "2026-05-05T17:33:50Z", mmsi: "538072431", lastUpdate: "20 May 2026" },
    { id: "sl90a-877", brandId: "sanlorenzo", code: "SL90A-877", status: "production", stage: "production", productionDate: "2026-02-14", mmsi: null, lastUpdate: "28 May 2026" },
    { id: "sp92-16", brandId: "sanlorenzo", code: "SP92-16", status: "production", mmsi: null, lastUpdate: "28 May 2026" },
    { id: "sx88-164", brandId: "sanlorenzo", code: "SX88-164", status: "production", mmsi: null, lastUpdate: "20 May 2026" },
    { id: "sl96a-885", brandId: "sanlorenzo", code: "SL96A-885", status: "production", mmsi: null, lastUpdate: "20 May 2026" },
  ],
};

// Seed team↔yacht access links (Sanlorenzo Tech Dep works a few boats).
export const teamYachtLinks: TeamYachtLink[] = [
  { brandId: "sanlorenzo", teamId: "tech-dep", yachtId: "sl50-171" },
  { brandId: "sanlorenzo", teamId: "tech-dep", yachtId: "sd118-129" },
  { brandId: "sanlorenzo", teamId: "tech-dep", yachtId: "sp110-05" },
];

// Owner-team roster for a specific yacht (keyed by yacht id).
export const ownerTeamByYacht: Record<string, OwnerTeamMember[]> = {
  "sl50-171": [
    // The owner grants power of attorney; they never hold it themselves.
    { id: "m-rossi", name: "Marco Rossi", handle: "@m_rossi", role: "owner", tcVersion: "v2.1", privacyVersion: "v1.4" },
    { id: "l-bianchi", name: "Luca Bianchi", handle: "@l_bianchi", role: "captain", poa: true, tcVersion: "v2.1", privacyVersion: "v1.4" },
    // Accepted an earlier T&C — signed in before v2.1 went out.
    { id: "g-conti", name: "Giulia Conti", handle: "@g_conti", role: "crew", tcVersion: "v2.0", privacyVersion: "v1.4" },
    { id: "p-neri", name: "Paolo Neri", handle: "@p_neri", role: "crew", tcVersion: "v2.1", privacyVersion: "v1.4" },
    // Invited but never signed in, so has accepted nothing yet.
    { id: "s-marino", name: "Sofia Marino", handle: "@s_marino", role: "guest" },
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

export const accountById = (id: string) => accounts.find((g) => g.id === id);
export const brandById = (id: string) => brands.find((s) => s.id === id);
export const brandsInAccount = (accountId: string) =>
  brands.filter((s) => s.accountId === accountId);
export const peopleInAccount = (accountId: string) => peopleByAccount[accountId] ?? [];

export interface AccountWithBrands extends Account {
  brands: Brand[];
  yachts: number;
  users: number;
}

// Accounts joined with their brands + aggregate counts, for the main page.
export const accountsWithBrands: AccountWithBrands[] = accounts.map((g) => {
  const inAccount = brandsInAccount(g.id);
  return {
    ...g,
    brands: inAccount,
    yachts: inAccount.reduce((n, s) => n + s.yachts, 0),
    users: inAccount.reduce((n, s) => n + s.users, 0),
  };
});
export const teamById = (brandId: string, teamId: string) =>
  (teamsByBrand[brandId] ?? []).find((t) => t.id === teamId);
export const yachtById = (brandId: string, yachtId: string) =>
  (yachtsByBrand[brandId] ?? []).find((y) => y.id === yachtId);

export const totals = {
  brands: brands.length,
  accounts: accounts.length,
  // Fleet-wide figure shown in the header (includes yachts not enumerated
  // in the mock rows above); matches the design's summary count.
  yachts: 67,
};

export const yachtLabel = (y: Pick<Yacht, "code" | "name">) =>
  y.name ? `${y.code} · ${y.name}` : y.code;

// ---- delivery lifecycle --------------------------------------------------

export const STAGE_ORDER: YachtStage[] = [
  "production",
  "pre_delivery",
  "delivered",
];

export const STAGE_META: Record<
  YachtStage,
  { label: string; short: string; tone: "warn" | "brand" | "success" }
> = {
  production: { label: "In production", short: "In production", tone: "warn" },
  pre_delivery: {
    label: "Delivered to brand",
    short: "Pre-delivery",
    tone: "brand",
  },
  delivered: {
    label: "Delivered to customer",
    short: "Delivered",
    tone: "success",
  },
};

// Who can access the vessel at each stage (access policy shown on the yacht).
// The production-team chip is scoped to the actual brand name.
export const stageAccessLabels = (
  stage: YachtStage,
  brandName: string
): string[] => {
  if (stage === "production") return ["SailADV · Installation"];
  if (stage === "pre_delivery")
    return ["SailADV", `${brandName} · Production`];
  return ["Owner team", "SailADV"];
};

/** Resolve a yacht's lifecycle stage, falling back to legacy status. */
export const yachtStage = (y: Pick<Yacht, "stage" | "status">): YachtStage =>
  y.stage ?? (y.status === "delivered" ? "delivered" : "production");

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Format an ISO yyyy-mm-dd date as e.g. "14 Mar 2026" (no timezone math). */
export const formatDate = (iso?: string): string => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

/**
 * Date-only rendering of a delivery value, e.g. "14 Mar 2026" — accepts both a
 * plain yyyy-mm-dd and a full ISO timestamp (whose time component is dropped).
 */
export const formatDay = (iso?: string): string => {
  if (!iso) return "—";
  if (!iso.includes("T")) return formatDate(iso);
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return `${dt.getUTCDate()} ${MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
};
