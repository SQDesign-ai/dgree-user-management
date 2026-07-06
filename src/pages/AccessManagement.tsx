import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronRight, Users } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Badge, Button, Card, SearchInput, Tabs, Avatar } from "../components/ui";
import {
  shipyards,
  groups,
  groupById,
  sailAdvTeams,
  totals,
} from "../data/mock";

export default function AccessManagement() {
  const [tab, setTab] = useState("shipyards");
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const navigate = useNavigate();

  const filtered = useMemo(
    () =>
      shipyards.filter((s) => {
        const matchesQuery = s.name
          .toLowerCase()
          .includes(query.trim().toLowerCase());
        const matchesGroup = groupFilter === "all" || s.groupId === groupFilter;
        return matchesQuery && matchesGroup;
      }),
    [query, groupFilter]
  );

  return (
    <>
      <PageHeader
        title="Access management"
        subtitle={`${totals.shipyards} shipyards across ${totals.groups} groups · ${totals.yachts} yachts`}
      />

      <div className="mb-5">
        <Tabs
          tabs={[
            { id: "shipyards", label: "Shipyards" },
            { id: "sail-adv", label: "Sail ADV teams" },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === "shipyards" ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="rounded-lg border border-line bg-surface-3 px-3 py-2 text-sm text-ink-2 outline-none focus:border-brand/60"
              >
                <option value="all">All groups</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-1 items-center justify-end gap-3">
              <div className="w-full max-w-xs">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search shipyards"
                  className="w-full rounded-lg border border-line bg-surface/60 px-3 py-2 text-sm text-ink placeholder:text-muted outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <Button>
                <Plus className="size-4" />
                Add shipyard
              </Button>
            </div>
          </div>

          <Card>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted-2">
                  <th className="px-5 py-3 font-medium">Shipyard</th>
                  <th className="px-5 py-3 font-medium">Group</th>
                  <th className="px-5 py-3 font-medium">Users</th>
                  <th className="px-5 py-3 font-medium">Yachts</th>
                  <th className="w-10 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const group = groupById(s.groupId);
                  return (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/shipyards/${s.id}`)}
                      className="cursor-pointer border-b border-line-soft/60 transition-colors last:border-0 hover:bg-hover/40"
                    >
                      <td className="px-5 py-3.5 font-medium text-white">
                        {s.name}
                      </td>
                      <td className="px-5 py-3.5">
                        {group && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/groups/${group.id}`);
                            }}
                          >
                            <Badge tone="outline">{group.name}</Badge>
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-2 text-ink-2">
                          <span
                            className={`size-1.5 rounded-full ${
                              s.users > 0 ? "bg-success" : "bg-muted"
                            }`}
                          />
                          {s.users}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-ink-2">{s.yachts}</td>
                      <td className="px-5 py-3.5 text-right text-muted">
                        <ChevronRight className="ml-auto size-4" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs text-muted">
              <span>{filtered.length} shipyards</span>
              <span>Across {totals.groups} groups</span>
            </div>
          </Card>
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <SearchInput placeholder="Search Sail ADV teams" />
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
                <div className="mt-4 flex items-center justify-between border-t border-line-soft/60 pt-3">
                  <Badge tone="brand">{t.scope}</Badge>
                  <span className="flex items-center gap-1.5 text-xs text-ink-4">
                    <Avatar name={t.name} size={18} />
                    {t.memberCount} members
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}
