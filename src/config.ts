// -------------------------------------------------------------------------
// Feature flags.
//
// Creating groups, shipyards and yachts is currently done at the DB/backend
// level, not in the customer platform — so the in-app create flows are hidden.
// The drawers and store mutations are left intact; flip a flag to true to
// re-expose the corresponding "Add/Create" button.
// -------------------------------------------------------------------------
export const FEATURES = {
  createGroup: false,
  createShipyard: false,
  createYacht: false,
} as const;
