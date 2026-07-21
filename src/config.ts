// -------------------------------------------------------------------------
// Feature flags.
//
// Accounts are created in-app (the "Add account" button on the Accounts tab).
// Brands and yachts are still provisioned at the DB/backend level, so those
// in-app create flows stay hidden (yachts can be synced by UUID from the fleet
// view). The drawers and store mutations are intact; flip a flag to re-expose
// its "Add/Create" button.
// -------------------------------------------------------------------------
export const FEATURES = {
  createAccount: true,
  createBrand: false,
  createYacht: false,
} as const;

// -------------------------------------------------------------------------
// The activation flow is played against one real yacht team, so every person
// you can sign in as exists in the data and carries their own consent state.
// -------------------------------------------------------------------------
export const ACTIVATION_YACHT_ID = "sl50-171";
export const ACTIVATION_YACHT_NAME = "SL50-171 · CONTIGO";
