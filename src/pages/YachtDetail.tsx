import { useMemo, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Plus, ChevronRight, Lock, ShieldCheck } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Badge, Button, Card, Avatar, StageBadge } from "../components/ui";
import {
  CreateUserDrawer,
  AssignTeamsToYachtDrawer,
  fullName,
} from "../components/drawers";
import {
  useStore,
  shipyardById,
  groupById,
  yachtById,
  ownerTeamOfYacht,
  teamsForYacht,
  addOwnerTeamMember,
  setYachtStage,
  setYachtAssetUuid,
} from "../store";
import { useExperience } from "../experience";
import {
  yachtLabel,
  yachtStage,
  formatStamp,
  stageAccessLabels,
  STAGE_ORDER,
  STAGE_META,
  type Yacht,
  type YachtStage,
  type YachtRole,
} from "../data/mock";

const roleTone: Record<YachtRole, "brand" | "neutral" | "outline"> = {
  owner: "brand",
  crew: "outline",
  guest: "outline",
};

const roleLabel: Record<YachtRole, string> = {
  owner: "Owner",
  crew: "Crew",
  guest: "Guest",
};

const ROLE_FILTERS: { id: "all" | YachtRole; label: string }[] = [
  { id: "all", label: "All" },
  { id: "owner", label: "Owner" },
  { id: "crew", label: "Crew" },
  { id: "guest", label: "Guest" },
];

/**
 * Delivery lifecycle card: delivery timestamps on the left, and the control
 * that moves the yacht to the next stage prominently in the middle. The access
 * policy and UUID render as separate cards beside it.
 */
function DeliveryCard({
  shipyardId,
  yacht,
}: {
  shipyardId: string;
  yacht: Yacht;
}) {
  const stage = yachtStage(yacht);
  const idx = STAGE_ORDER.indexOf(stage);
  const next = STAGE_ORDER[idx + 1] as YachtStage | undefined;
  const prev = STAGE_ORDER[idx - 1] as YachtStage | undefined;
  const advanceLabel =
    next === "pre_delivery"
      ? "Deliver to shipyard"
      : next === "delivered"
      ? "Deliver to customer"
      : null;

  return (
    <Card className="p-5">
      {/* Header: status + the control that moves the yacht along */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-2">
            Delivery status
          </span>
          <StageBadge stage={stage} />
        </div>
        <div className="flex items-center gap-4">
          {prev && (
            <button
              onClick={() => setYachtStage(shipyardId, yacht.id, prev)}
              className="text-xs font-medium text-muted transition-colors hover:text-ink-3"
            >
              ↩ revert to {STAGE_META[prev].short}
            </button>
          )}
          {advanceLabel && next ? (
            <Button
              onClick={() => setYachtStage(shipyardId, yacht.id, next)}
              className="px-6 py-2.5"
            >
              {advanceLabel}
            </Button>
          ) : (
            <span className="text-sm font-semibold text-success">
              Fully delivered
            </span>
          )}
        </div>
      </div>

      {/* Delivery timestamps */}
      <div className="space-y-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-2">
            Customer delivery
          </div>
          <div
            className={`mt-0.5 text-lg font-semibold ${
              idx >= 2 ? "text-white" : "text-muted"
            }`}
          >
            {idx >= 2 ? formatStamp(yacht.customerDeliveryDate) : "Pending"}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-2">
            Shipyard delivery
          </div>
          <div
            className={`mt-0.5 text-lg font-semibold ${
              idx >= 1 ? "text-white" : "text-muted"
            }`}
          >
            {idx >= 1 ? formatStamp(yacht.shipyardDeliveryDate) : "Pending"}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function YachtDetail() {
  useStore();
  const { shipyardId = "", yachtId = "" } = useParams();
  const navigate = useNavigate();
  const [roleFilter, setRoleFilter] = useState<"all" | YachtRole>("all");

  const [personOpen, setPersonOpen] = useState(false);
  const [teamsOpen, setTeamsOpen] = useState(false);

  const shipyard = shipyardById(shipyardId);
  const yacht = yachtById(shipyardId, yachtId);
  if (!shipyard || !yacht) return <Navigate to="/" replace />;

  const group = groupById(shipyard.groupId);
  const team = ownerTeamOfYacht(yachtId);
  const accessTeams = teamsForYacht(shipyardId, yachtId);
  const stage = yachtStage(yacht);
  const canOwnerTeam = stage === "delivered"; // owner team unlocks at delivery
  const experience = useExperience();
  // A yacht lives under the fleet; in split mode the breadcrumb roots there.
  const rootCrumb =
    experience === "split"
      ? { label: "Fleet management", to: "/fleet" }
      : { label: "Access management", to: "/" };

  const filteredTeam = useMemo(
    () => (roleFilter === "all" ? team : team.filter((m) => m.role === roleFilter)),
    [team, roleFilter]
  );

  const roleSummary = useMemo(() => {
    const counts = team.reduce<Record<string, number>>((acc, m) => {
      acc[m.role] = (acc[m.role] ?? 0) + 1;
      return acc;
    }, {});
    return (["owner", "crew", "guest"] as YachtRole[])
      .filter((r) => counts[r])
      .map((r) => `${counts[r]} ${roleLabel[r]}`)
      .join(", ");
  }, [team]);

  return (
    <>
      <PageHeader
        crumbs={
          experience === "split"
            ? [rootCrumb, { label: yachtLabel(yacht) }]
            : [
                rootCrumb,
                ...(group
                  ? [
                      {
                        label: `${group.name} Account`,
                        to: `/groups/${group.id}`,
                      },
                    ]
                  : []),
                { label: shipyard.name, to: `/shipyards/${shipyardId}` },
                { label: yachtLabel(yacht) },
              ]
        }
        title={yachtLabel(yacht)}
        badge={<StageBadge stage={stage} />}
        subtitle={yacht.mmsi ? `MMSI ${yacht.mmsi}` : "MMSI not assigned"}
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <DeliveryCard shipyardId={shipyardId} yacht={yacht} />

        <div className="grid gap-4">
          {/* Asset UUID (editable) + bound status */}
          <Card className="p-4">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label
                htmlFor="asset-uuid"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-2"
              >
                D.gree Asset UUID
              </label>
              {yacht.assetUuid ? (
                <Badge tone="success">Bound</Badge>
              ) : (
                <Badge tone="neutral">Unbound</Badge>
              )}
            </div>
            <input
              id="asset-uuid"
              key={yachtId}
              defaultValue={yacht.assetUuid ?? ""}
              onBlur={(e) =>
                setYachtAssetUuid(shipyardId, yachtId, e.target.value)
              }
              placeholder="Paste the UUID issued by D.gree core"
              className="w-full rounded-lg border border-line bg-[#0e2149] px-3 py-2 font-mono text-sm text-ink-2 placeholder:font-sans placeholder:text-muted outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
            />
          </Card>

          {/* Teams with access — stage policy chips + any assigned teams */}
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-2">
                Teams with access
              </div>
              <button
                onClick={() => setTeamsOpen(true)}
                className="text-xs font-medium text-brand hover:text-brand-hover"
              >
                Assign
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {stageAccessLabels(stage, shipyard.name).map((label) => (
                <Badge key={label} tone="brand">
                  {label}
                </Badge>
              ))}
              {accessTeams.map((t) => (
                <button
                  key={t.id}
                  onClick={() =>
                    navigate(`/shipyards/${shipyardId}/teams/${t.id}`)
                  }
                >
                  <Badge tone="neutral">{t.name}</Badge>
                </button>
              ))}
            </div>
            {stage === "delivered" ? (
              <p className="mt-2.5 flex gap-2 text-xs leading-relaxed text-muted">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-nav-section" />
                Until the owner&apos;s PoA enables 3rd-party data sharing.
              </p>
            ) : (
              <p className="mt-2.5 text-xs leading-relaxed text-muted">
                Owner-team is created once the yacht is delivered to the
                customer.
              </p>
            )}
          </Card>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
        Owner-team
        {!canOwnerTeam && (
          <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-0.5 text-[10px] normal-case tracking-normal text-muted">
            <Lock className="size-3" />
            Unlocks when delivered to customer
          </span>
        )}
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
        {canOwnerTeam ? (
          <Button onClick={() => setPersonOpen(true)}>
            <Plus className="size-4" />
            Add person
          </Button>
        ) : (
          <button
            disabled
            title="The owner team can be created once the yacht is delivered to the customer."
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-line px-3.5 py-2 text-sm font-medium text-muted opacity-60"
          >
            <Lock className="size-4" />
            Add person
          </button>
        )}
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

      <AssignTeamsToYachtDrawer
        open={teamsOpen}
        onClose={() => setTeamsOpen(false)}
        shipyardId={shipyardId}
        yachtId={yachtId}
        yachtName={yachtLabel(yacht)}
      />
    </>
  );
}
