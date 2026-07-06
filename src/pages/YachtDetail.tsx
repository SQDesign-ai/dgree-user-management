import { useMemo, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Plus, ChevronRight } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Badge, Button, Card, Avatar } from "../components/ui";
import { CreateUserDrawer, fullName } from "../components/drawers";
import {
  useStore,
  shipyardById,
  yachtById,
  ownerTeamOfYacht,
  addOwnerTeamMember,
} from "../store";
import { yachtLabel, type YachtRole } from "../data/mock";

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

const ROLE_FILTERS: { id: "all" | YachtRole; label: string }[] = [
  { id: "all", label: "All" },
  { id: "owner", label: "Owner" },
  { id: "captain", label: "Captain" },
  { id: "crew", label: "Crew" },
  { id: "guest", label: "Guest" },
];

export default function YachtDetail() {
  useStore();
  const { shipyardId = "", yachtId = "" } = useParams();
  const [roleFilter, setRoleFilter] = useState<"all" | YachtRole>("all");

  const [personOpen, setPersonOpen] = useState(false);

  const shipyard = shipyardById(shipyardId);
  const yacht = yachtById(shipyardId, yachtId);
  if (!shipyard || !yacht) return <Navigate to="/" replace />;

  const team = ownerTeamOfYacht(yachtId);

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

      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
        Owner-team
      </div>

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
        <Button onClick={() => setPersonOpen(true)}>
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

      <CreateUserDrawer
        open={personOpen}
        onClose={() => setPersonOpen(false)}
        assignValue={`${yachtLabel(yacht)} · owner-team`}
        roleOptions={[
          { value: "owner", label: "Owner" },
          { value: "captain", label: "Captain" },
          { value: "crew", label: "Crew" },
          { value: "guest", label: "Guest" },
        ]}
        onCreate={(r) =>
          addOwnerTeamMember(yachtId, {
            name: fullName(r),
            role: r.role as YachtRole,
            poa: false,
          })
        }
      />
    </>
  );
}
