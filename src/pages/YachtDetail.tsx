import { useMemo, useState, Fragment } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Plus, ChevronRight, Check, Lock, ShieldCheck, ArrowRight } from "lucide-react";
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
} from "../store";
import {
  yachtLabel,
  yachtStage,
  formatDate,
  STAGE_ORDER,
  STAGE_META,
  STAGE_ACCESS,
  type Yacht,
  type YachtStage,
  type YachtRole,
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

const ROLE_FILTERS: { id: "all" | YachtRole; label: string }[] = [
  { id: "all", label: "All" },
  { id: "owner", label: "Owner" },
  { id: "captain", label: "Captain" },
  { id: "crew", label: "Crew" },
  { id: "guest", label: "Guest" },
];

function stageDate(y: Yacht, s: YachtStage): string | undefined {
  if (s === "pre_delivery") return y.shipyardDeliveryDate;
  if (s === "delivered") return y.customerDeliveryDate;
  return undefined;
}

/**
 * Delivery lifecycle + access policy. Shows the stage timeline alongside the
 * teams that can see the vessel at the current stage, with buttons to advance.
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
      ? "Mark delivered to shipyard"
      : next === "delivered"
      ? "Mark delivered to customer"
      : null;

  return (
    <Card className="mb-6 p-5">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Stage timeline */}
        <div>
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
            Delivery status
          </div>
          <div className="flex items-start">
            {STAGE_ORDER.map((s, i) => {
              const done = i < idx;
              const current = i === idx;
              const d = stageDate(yacht, s);
              return (
                <Fragment key={s}>
                  {i > 0 && (
                    <div
                      className={`mt-3.5 h-0.5 flex-1 rounded ${
                        i <= idx ? "bg-brand/60" : "bg-line"
                      }`}
                    />
                  )}
                  <div className="flex w-28 shrink-0 flex-col items-center gap-1.5 text-center">
                    <span
                      className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${
                        current
                          ? "bg-brand text-white ring-4 ring-brand/20"
                          : done
                          ? "bg-brand text-white"
                          : "border border-line bg-white/[0.04] text-muted"
                      }`}
                    >
                      {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                    </span>
                    <span
                      className={`text-xs font-medium leading-tight ${
                        current || done ? "text-white" : "text-muted"
                      }`}
                    >
                      {STAGE_META[s].label}
                    </span>
                    <span className="text-[11px] text-ink-4">
                      {s === "production"
                        ? "Initial"
                        : d
                        ? formatDate(d)
                        : "—"}
                    </span>
                  </div>
                </Fragment>
              );
            })}
          </div>
        </div>

        {/* Access policy at the current stage */}
        <div className="lg:border-l lg:border-line lg:pl-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-2">
              Who can access now
            </span>
            <StageBadge stage={stage} />
          </div>
          <div className="flex flex-wrap gap-2">
            {STAGE_ACCESS[stage].map((label) => (
              <Badge key={label} tone="brand">
                {label}
              </Badge>
            ))}
          </div>
          {stage === "delivered" && (
            <p className="mt-2.5 flex gap-2 text-xs leading-relaxed text-muted">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-nav-section" />
              Until the owner&apos;s PoA enables 3rd-party data sharing.
            </p>
          )}

          <div className="mt-4 flex flex-col gap-2">
            {advanceLabel && next && (
              <Button
                onClick={() => setYachtStage(shipyardId, yacht.id, next)}
                className="justify-center"
              >
                {advanceLabel}
                <ArrowRight className="size-4" />
              </Button>
            )}
            {!next && (
              <div className="rounded-lg border border-success/25 bg-success/10 px-3 py-2 text-center text-xs font-medium text-success">
                Fully delivered to customer
              </div>
            )}
            {prev && (
              <button
                onClick={() => setYachtStage(shipyardId, yacht.id, prev)}
                className="text-center text-xs font-medium text-muted transition-colors hover:text-ink-3"
              >
                ↩ Revert to {STAGE_META[prev].short}
              </button>
            )}
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
          ...(group
            ? [{ label: `${group.name} Group`, to: `/groups/${group.id}` }]
            : []),
          { label: shipyard.name, to: `/shipyards/${shipyardId}` },
          { label: yachtLabel(yacht) },
        ]}
        title={yachtLabel(yacht)}
        badge={<StageBadge stage={stage} />}
        subtitle={yacht.mmsi ? `MMSI ${yacht.mmsi}` : "MMSI not assigned"}
      />

      <DeliveryCard shipyardId={shipyardId} yacht={yacht} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-2">
            D.gree Asset UUID
          </div>
          {yacht.assetUuid ? (
            <div className="break-all font-mono text-sm text-ink-2">
              {yacht.assetUuid}
            </div>
          ) : (
            <div className="text-sm text-muted">
              Not bound — paste the core UUID when editing this yacht.
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-2">
              Teams with access ({accessTeams.length})
            </div>
            <button
              onClick={() => setTeamsOpen(true)}
              className="text-xs font-medium text-brand hover:text-brand-hover"
            >
              Assign
            </button>
          </div>
          {accessTeams.length ? (
            <div className="flex flex-wrap gap-2">
              {accessTeams.map((t) => (
                <button
                  key={t.id}
                  onClick={() =>
                    navigate(`/shipyards/${shipyardId}/teams/${t.id}`)
                  }
                >
                  <Badge tone="brand">{t.name}</Badge>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted">No teams linked yet.</div>
          )}
        </Card>
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
