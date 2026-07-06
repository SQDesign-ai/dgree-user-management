import { useMemo, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Plus, ChevronRight, ShieldCheck } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Badge, Button, Card, Tabs, Avatar } from "../components/ui";
import {
  shipyardById,
  yachtById,
  ownerTeamByYacht,
  dataAccessByYacht,
  yachtLabel,
  type YachtRole,
  type AccessStatus,
  type DataAccessGrant,
} from "../data/mock";

const roleTone: Record<YachtRole, "brand" | "neutral" | "outline"> = {
  owner: "brand",
  captain: "neutral",
  crew: "outline",
  guest: "outline",
};

const roleLabel: Record<YachtRole, string> = {
  owner: "Owner",
  captain: "Captain",
  crew: "Crew",
  guest: "Guest",
};

const accessTone: Record<AccessStatus, "success" | "neutral" | "warn"> = {
  active: "success",
  expired: "neutral",
  pending: "warn",
};

const ROLE_FILTERS: { id: "all" | YachtRole; label: string }[] = [
  { id: "all", label: "All" },
  { id: "owner", label: "Owner" },
  { id: "captain", label: "Captain" },
  { id: "crew", label: "Crew" },
  { id: "guest", label: "Guest" },
];

export default function YachtDetail() {
  const { shipyardId = "", yachtId = "" } = useParams();
  const [tab, setTab] = useState("owner-team");
  const [roleFilter, setRoleFilter] = useState<"all" | YachtRole>("all");

  const shipyard = shipyardById(shipyardId);
  const yacht = yachtById(shipyardId, yachtId);
  if (!shipyard || !yacht) return <Navigate to="/" replace />;

  const team = ownerTeamByYacht[yachtId] ?? [];
  const grants = dataAccessByYacht[yachtId] ?? [];

  const filteredTeam = useMemo(
    () => (roleFilter === "all" ? team : team.filter((m) => m.role === roleFilter)),
    [team, roleFilter]
  );

  const roleSummary = useMemo(() => {
    const counts = team.reduce<Record<string, number>>((acc, m) => {
      acc[m.role] = (acc[m.role] ?? 0) + 1;
      return acc;
    }, {});
    return (["owner", "captain", "crew", "guest"] as YachtRole[])
      .filter((r) => counts[r])
      .map((r) => `${counts[r]} ${roleLabel[r]}`)
      .join(", ");
  }, [team]);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Access management", to: "/" },
          { label: shipyard.name, to: `/shipyards/${shipyardId}` },
          { label: "Yachts", to: `/shipyards/${shipyardId}` },
          { label: yachtLabel(yacht) },
        ]}
        title={yachtLabel(yacht)}
        badge={
          yacht.status === "delivered" ? (
            <Badge tone="success" dot>
              Delivered
            </Badge>
          ) : (
            <Badge tone="warn" dot>
              In production
            </Badge>
          )
        }
        subtitle={yacht.mmsi ? `MMSI ${yacht.mmsi}` : "MMSI not assigned"}
      />

      <div className="mb-5">
        <Tabs
          tabs={[
            { id: "owner-team", label: "Owner-team" },
            { id: "data-access", label: "Data access" },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === "owner-team" ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="mr-1 text-xs text-muted">Filter:</span>
              {ROLE_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setRoleFilter(f.id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    roleFilter === f.id
                      ? "bg-brand text-white"
                      : "border border-line text-ink-3 hover:bg-hover"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <Button>
              <Plus className="size-4" />
              Add person
            </Button>
          </div>

          <Card>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted-2">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="w-10 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredTeam.map((m) => (
                  <tr
                    key={m.id}
                    className="cursor-pointer border-b border-line-soft/60 transition-colors last:border-0 hover:bg-hover/40"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} />
                        <div className="leading-tight">
                          <div className="font-medium text-white">{m.name}</div>
                          <div className="text-xs text-ink-4">{m.handle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Badge tone={roleTone[m.role]}>{roleLabel[m.role]}</Badge>
                        {m.poa && <Badge tone="success">PoA</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right text-muted">
                      <ChevronRight className="ml-auto size-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-line px-5 py-3 text-xs text-muted">
              {team.length} members · {roleSummary}
            </div>
          </Card>
        </>
      ) : (
        <DataAccess grants={grants} />
      )}
    </>
  );
}

function DataAccess({ grants }: { grants: DataAccessGrant[] }) {
  return (
    <>
      <p className="-mt-3 mb-4 text-sm text-ink-4">Third-party data access</p>

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="rounded-xl border border-line bg-surface/70 px-4 py-2.5">
          <span className="text-xs text-muted">Shipyard delivery</span>
          <span className="ml-3 text-sm font-semibold text-ink">27 Jun 2024</span>
        </div>
        <div className="rounded-xl border border-line bg-surface/70 px-4 py-2.5">
          <span className="text-xs text-muted">Owner delivery</span>
          <span className="ml-3 text-sm font-semibold text-ink">14 Mar 2026</span>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-2">
          Third-party access · Whitelist
        </h3>
        <Button>
          <Plus className="size-4" />
          Grant access
        </Button>
      </div>

      <Card>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted-2">
              <th className="px-5 py-3 font-medium">Party</th>
              <th className="px-5 py-3 font-medium">Access window</th>
              <th className="px-5 py-3 font-medium">Source</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {grants.map((g) => {
              const expired = g.status === "expired";
              return (
                <tr
                  key={g.id}
                  className="border-b border-line-soft/60 last:border-0"
                >
                  <td className="px-5 py-4">
                    <div
                      className={`font-semibold ${
                        expired ? "text-ink-4" : "text-white"
                      }`}
                    >
                      {g.party}
                    </div>
                    <div className="text-xs text-ink-4">{g.partyRole}</div>
                  </td>
                  <td
                    className={`px-5 py-4 ${
                      expired ? "text-muted" : "text-ink-2"
                    }`}
                  >
                    {g.window}
                  </td>
                  <td className="px-5 py-4 text-ink-4">{g.source}</td>
                  <td className="px-5 py-4">
                    <Badge tone={accessTone[g.status]} dot>
                      {g.status === "active"
                        ? "Active"
                        : g.status === "expired"
                          ? "Expired"
                          : "Pending"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-3 text-sm font-medium">
                      {g.actions.map((a) => (
                        <button
                          key={a}
                          className={
                            a === "revoke"
                              ? "text-ink-3 hover:text-danger"
                              : "text-brand hover:text-brand-hover"
                          }
                        >
                          {a === "extend"
                            ? "Extend"
                            : a === "revoke"
                              ? "Revoke"
                              : "Re-grant"}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <p className="mt-3 flex gap-2 text-xs leading-relaxed text-muted">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-nav-section" />
        Shipyard&apos;s automatic access runs from shipyard delivery until the
        earlier of shipyard delivery + 1 year or owner delivery. After that, the
        owner — or captain under PoA — grants access here.
      </p>
    </>
  );
}
