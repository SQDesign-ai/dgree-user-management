import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronRight, Users } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Button, Card, SearchInput, Tabs } from "../components/ui";
import { PeopleCount } from "@sqdesign-ai/dgree-ds-react";
import { CreateGroupDrawer, CreateShipyardDrawer } from "../components/drawers";
import { sailAdvTeams } from "../data/mock";
import { FEATURES } from "../config";
import {
  useStore,
  getGroupsWithShipyards,
  getTotals,
  type GroupWithShipyards,
} from "../store";
import type { Shipyard } from "../data/mock";

function CountPill({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-0.5 text-xs">
      <span className={value > 0 ? "font-semibold text-ink-2" : "text-muted"}>
        {value}
      </span>
      <span className="text-muted">{label}</span>
    </span>
  );
}

function AccountCard({
  group,
  onAddShipyard,
}: {
  group: GroupWithShipyards;
  onAddShipyard: (groupId: string) => void;
}) {
  const navigate = useNavigate();
  // Users are counted per shipyard, so an account's headcount is the sum of
  // its own. This is the number the licence agreement is measured against.
  const users = group.shipyards.reduce(
    (n: number, s: Shipyard) => n + s.users,
    0
  );
  return (
    <Card className="mb-4 break-inside-avoid">
      <button
        onClick={() => navigate(`/groups/${group.id}`)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-hover/30"
      >
        <span className="font-semibold text-white">{group.name} account</span>
        <span className="flex items-center gap-3">
          <PeopleCount value={users} />
          <span className="text-xs text-muted">
            {group.shipyards.length}{" "}
            {group.shipyards.length === 1 ? "shipyard" : "shipyards"}
          </span>
        </span>
      </button>

      <div className="border-t border-line-soft/60">
        {group.shipyards.map((s: Shipyard) => (
          <button
            key={s.id}
            onClick={() => navigate(`/shipyards/${s.id}`)}
            className="flex w-full items-center justify-between gap-3 border-b border-line-soft/40 px-5 py-3 text-left transition-colors last:border-0 hover:bg-hover/40"
          >
            <span className="min-w-0 truncate font-medium text-white">
              {s.name}
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <CountPill value={s.yachts} label="yachts" />
              <CountPill value={s.teams} label="teams" />
              <ChevronRight className="size-4 text-muted" />
            </span>
          </button>
        ))}
        {group.shipyards.length === 0 && (
          <div className="px-5 py-4 text-xs text-muted">No shipyards yet.</div>
        )}
      </div>

      {FEATURES.createShipyard && (
        <button
          onClick={() => onAddShipyard(group.id)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-line-soft/60 py-2.5 text-xs font-medium text-brand transition-colors hover:bg-brand/5"
        >
          <Plus className="size-3.5" />
          Add shipyard
        </button>
      )}
    </Card>
  );
}

function AccountsPanel() {
  const [query, setQuery] = useState("");
  const [groupOpen, setGroupOpen] = useState(false);
  const [shipyardForGroup, setShipyardForGroup] = useState<string | null>(null);

  const groups = getGroupsWithShipyards();
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        shipyards: g.shipyards.filter(
          (s) =>
            s.name.toLowerCase().includes(q) || g.name.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.shipyards.length > 0 || g.name.toLowerCase().includes(q));
  }, [query, groups]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        <div className="w-full max-w-xs">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search accounts & shipyards"
            className="w-full rounded-lg border border-line bg-surface/60 px-3 py-2 text-sm text-ink placeholder:text-muted outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
          />
        </div>
        {FEATURES.createGroup && (
          <Button onClick={() => setGroupOpen(true)}>
            <Plus className="size-4" />
            Add account
          </Button>
        )}
      </div>

      <div className="gap-4 lg:columns-2">
        {filteredGroups.map((g) => (
          <AccountCard
            key={g.id}
            group={g}
            onAddShipyard={(id) => setShipyardForGroup(id)}
          />
        ))}
      </div>

      <CreateGroupDrawer open={groupOpen} onClose={() => setGroupOpen(false)} />
      <CreateShipyardDrawer
        open={!!shipyardForGroup}
        groupId={shipyardForGroup ?? undefined}
        onClose={() => setShipyardForGroup(null)}
      />
    </>
  );
}

function SailAdvPanel() {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        <SearchInput placeholder="Search SailADV teams" />
        <Button>
          <Plus className="size-4" />
          Add team
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sailAdvTeams.map((t) => (
          <Card key={t.id} className="p-5">
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-brand/15 text-brand">
              <Users className="size-5" />
            </div>
            <div className="font-semibold text-white">{t.name}</div>
            <div className="mt-0.5 text-sm text-ink-4">{t.description}</div>
            {/* A SailADV team carries a memberCount and no member list, so the
                people can be counted but not named — PeopleCount, not avatars. */}
            <div className="mt-4 flex items-center justify-end border-t border-line-soft/60 pt-3">
              <PeopleCount value={t.memberCount}>members</PeopleCount>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

export default function AccessManagement() {
  useStore();
  const [tab, setTab] = useState("accounts");
  const totals = getTotals();

  const tabs = [
    { id: "accounts", label: "Accounts" },
    { id: "sailadv", label: "SailADV" },
  ];

  const activeTab = tabs.some((t) => t.id === tab) ? tab : "accounts";

  return (
    <>
      <PageHeader
        title="Access management"
        subtitle={`${totals.shipyards} shipyards across ${totals.groups} accounts · ${totals.yachts} yachts`}
      />

      <div className="mb-5">
        <Tabs tabs={tabs} active={activeTab} onChange={setTab} />
      </div>

      {activeTab === "accounts" && <AccountsPanel />}
      {activeTab === "sailadv" && <SailAdvPanel />}
    </>
  );
}
