// -------------------------------------------------------------------------
// Feature flags.
//
// Accounts are created in-app (the "Add account" button on the Accounts tab).
// Shipyards and yachts are still provisioned at the DB/backend level, so those
// in-app create flows stay hidden (yachts can be synced by UUID from the fleet
// view). The drawers and store mutations are intact; flip a flag to re-expose
// its "Add/Create" button.
// -------------------------------------------------------------------------
export const FEATURES = {
  createGroup: true,
  createShipyard: false,
  createYacht: false,
} as const;
