import { useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Plus, ChevronRight } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Badge, Button, Card, SearchInput, Tabs } from "../components/ui";
import { groupById, shipyards } from "../data/mock";

export default function GroupDetail() {
  const { groupId = "" } = useParams();
  const [tab, setTab] = useState("shipyards");
  const navigate = useNavigate();

  const group = groupById(groupId);
  if (!group) return <Navigate to="/" replace />;

  const groupShipyards = shipyards.filter((s) => s.groupId === groupId);
  const totalUsers = groupShipyards.reduce((n, s) => n + s.users, 0);
  const totalYachts = groupShipyards.reduce((n, s) => n + s.yachts, 0);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Access management", to: "/" },
          { label: "Groups" },
        ]}
        title={group.name}
        badge={<Badge tone="brand">Group</Badge>}
        subtitle={`${groupShipyards.length} shipyards · ${totalUsers} users · ${totalYachts} yachts`}
        actions={
          <Button variant="secondary">
            <Plus className="size-4" />
            Add shipyard
          </Button>
        }
      />

      <div className="mb-5">
        <Tabs
          tabs={[
            { id: "shipyards", label: "Shipyards" },
            { id: "settings", label: "Group settings" },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === "shipyards" ? (
        <>
          <div className="mb-4">
            <SearchInput placeholder="Search shipyards" />
          </div>
          <Card>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted-2">
                  <th className="px-5 py-3 font-medium">Shipyard</th>
                  <th className="px-5 py-3 font-medium">Users</th>
                  <th className="px-5 py-3 font-medium">Yachts</th>
                  <th className="w-10 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {groupShipyards.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/shipyards/${s.id}`)}
                    className="cursor-pointer border-b border-line-soft/60 transition-colors last:border-0 hover:bg-hover/40"
                  >
                    <td className="px-5 py-3.5 font-medium text-white">
                      {s.name}
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
                ))}
              </tbody>
            </table>
          </Card>
        </>
      ) : (
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-white">Group settings</h3>
          <p className="mt-1 max-w-lg text-sm text-ink-4">
            Group-level policies apply to every shipyard below. Changes here
            cascade to all {groupShipyards.length} shipyards in {group.name}.
          </p>
          <dl className="mt-5 grid max-w-lg grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
            {[
              ["Default data retention", "12 months"],
              ["Owner consent required", "Yes"],
              ["Auto-access on delivery", "+1 year"],
              ["Third-party sharing", "Whitelist only"],
            ].map(([k, v]) => (
              <div key={k} className="bg-surface px-4 py-3">
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="mt-0.5 text-sm font-medium text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}
    </>
  );
}
