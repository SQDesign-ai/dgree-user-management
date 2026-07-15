import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Search, Plus } from "lucide-react";
import { Card, StageBadge, Button } from "./ui";
import { AddYachtDrawer } from "./drawers";
import {
  useStore,
  getShipyards,
  getGroups,
  yachtsInShipyard,
} from "../store";
import {
  yachtLabel,
  yachtStage,
  formatStamp,
  STAGE_ORDER,
  STAGE_META,
  type Yacht,
  type YachtStage,
} from "../data/mock";

interface Row {
  yacht: Yacht;
  shipyardId: string;
  shipyardName: string;
  groupId: string;
  groupName: string;
  stage: YachtStage;
}

/** Flat list of every yacht across all shipyards, with account + brand context. */
function useAllYachts(): Row[] {
  const shipyards = getShipyards();
  const groups = getGroups();
  return shipyards.flatMap((s) => {
    const group = groups.find((g) => g.id === s.groupId);
    return yachtsInShipyard(s.id).map((y) => ({
      yacht: y,
      shipyardId: s.id,
      shipyardName: s.name,
      groupId: s.groupId,
      groupName: group?.name ?? "—",
      stage: yachtStage(y),
    }));
  });
}

export function AllYachtsPanel() {
  useStore();
  const navigate = useNavigate();
  const rows = useAllYachts();
  const groups = getGroups();

  const [account, setAccount] = useState("all");
  const [status, setStatus] = useState<"all" | YachtStage>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (account !== "all" && r.groupId !== account) return false;
      if (status !== "all" && r.stage !== status) return false;
      if (q) {
        const hay = `${r.yacht.code} ${r.yacht.name ?? ""} ${
          r.yacht.mmsi ?? ""
        } ${r.yacht.assetUuid ?? ""} ${r.shipyardName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, account, status, query]);

  const control =
    "rounded-lg border border-line bg-surface/60 px-3 py-2 text-sm text-ink outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20";

  return (
    <>
      {/* Control row — filters left, search + add button right. */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          className={`${control} ${account === "all" ? "text-muted" : ""}`}
        >
          <option value="all">All accounts</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id} className="text-ink">
              {g.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "all" | YachtStage)}
          className={`${control} ${status === "all" ? "text-muted" : ""}`}
        >
          <option value="all">All statuses</option>
          {STAGE_ORDER.map((s) => (
            <option key={s} value={s} className="text-ink">
              {STAGE_META[s].short}
            </option>
          ))}
        </select>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search yachts, MMSI, UUID…"
              className={`${control} w-full pl-9`}
            />
          </div>
          <AddYachtButton />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted-2">
                <th className="px-5 py-3 font-medium">Yacht</th>
                <th className="px-5 py-3 font-medium">Account</th>
                <th className="px-5 py-3 font-medium">Brand</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Customer delivery</th>
                <th className="w-10 px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={`${r.shipyardId}-${r.yacht.id}`}
                  onClick={() =>
                    navigate(`/shipyards/${r.shipyardId}/yachts/${r.yacht.id}`)
                  }
                  className="cursor-pointer border-b border-line-soft/60 transition-colors last:border-0 hover:bg-hover/40"
                >
                  <td className="px-5 py-4 font-semibold text-white">
                    {yachtLabel(r.yacht)}
                  </td>
                  <td className="px-5 py-4 text-ink-2">{r.groupName}</td>
                  <td className="px-5 py-4 text-ink-2">{r.shipyardName}</td>
                  <td className="px-5 py-4">
                    <StageBadge stage={r.stage} />
                  </td>
                  <td className="px-5 py-4 text-ink-2">
                    {r.yacht.customerDeliveryDate
                      ? formatStamp(r.yacht.customerDeliveryDate)
                      : "—"}
                  </td>
                  <td className="px-5 py-4 text-right text-muted">
                    <ChevronRight className="ml-auto size-4" />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-muted"
                  >
                    No yachts match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line px-5 py-3 text-xs text-muted">
          {filtered.length} {filtered.length === 1 ? "yacht" : "yachts"}
          {filtered.length !== rows.length ? ` of ${rows.length}` : ""}
        </div>
      </Card>
    </>
  );
}

/** Header action: opens the Add-yacht (sync by UUID) drawer. */
export function AddYachtButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add yacht
      </Button>
      <AddYachtDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
