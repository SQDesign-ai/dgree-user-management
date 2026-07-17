import { type ReactNode, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Plus, ChevronRight, Undo2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import {
  Badge,
  Button,
  Card,
  Avatar,
  StageBadge,
  Tag,
  tagColorFor,
  type TagColor,
} from "../components/ui";
import {
  CreateUserDrawer,
  AssignTeamsToYachtDrawer,
  YachtTeamMemberDrawer,
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
  setYachtDetails,
} from "../store";
import {
  CURRENT_TC_VERSION,
  CURRENT_PRIVACY_VERSION,
  yachtLabel,
  yachtStage,
  formatDay,
  sailAdvTeams,
  STAGE_ORDER,
  type Yacht,
  type YachtStage,
  type YachtRole,
  type OwnerTeamMember,
} from "../data/mock";

const roleLabel: Record<YachtRole, string> = {
  owner: "Owner",
  captain: "Captain",
  crew: "Crew",
  guest: "Guest",
};

// A role categorises a person — that's a Tag, not a semantic Badge. Colours are
// pinned rather than derived so each role reads the same everywhere.
const roleColor: Record<YachtRole, TagColor> = {
  owner: "blue",
  captain: "teal",
  crew: "mist",
  guest: "taupe",
};

const ROLE_FILTERS: { id: "all" | YachtRole; label: string }[] = [
  { id: "all", label: "All" },
  { id: "owner", label: "Owner" },
  { id: "captain", label: "Captain" },
  { id: "crew", label: "Crew" },
  { id: "guest", label: "Guest" },
];

/** Shipyard access runs for a year from the hand-over to the shipyard. */
function oneYearAfter(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return formatDay(d.toISOString());
}

// -------------------------------------------------------------------------
// Timeline — the page reads as the vessel's delivery process, newest first.
// Each moment owns the access that moment creates.
// -------------------------------------------------------------------------

function Moment({
  label,
  date,
  next = false,
  action,
  last = false,
  children,
}: {
  label: string;
  date?: string;
  /** The upcoming (not yet reached) moment: hollow dot, muted label. */
  next?: boolean;
  action?: ReactNode;
  last?: boolean;
  children?: ReactNode;
}) {
  return (
    <li className="relative pb-7 pl-8">
      {/* Spine: runs from this dot's centre to the next one's, so the line is
          continuous across moments (the dot paints over its top). */}
      {!last && (
        <span
          aria-hidden
          className="absolute -bottom-[10px] left-[5px] top-[10px] w-px bg-line"
        />
      )}
      <span
        aria-hidden
        className={`absolute left-0 top-1 size-3 rounded-full ${
          next ? "border-2 border-line-soft bg-page" : "bg-brand"
        }`}
      />
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`text-[13px] font-semibold ${
            next ? "text-ink-4" : "text-white"
          }`}
        >
          {label}
        </span>
        {date && <span className="text-[11px] text-ink-4">{date}</span>}
        {next && (
          <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold text-[#afcbff]">
            Next step
          </span>
        )}
        {action && <span className="ml-auto">{action}</span>}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </li>
  );
}

/** The access a moment grants: a titled card of team chips + a policy note. */
function TeamCard({
  title,
  badge,
  chips,
  note,
  onAssign,
}: {
  title: string;
  badge?: ReactNode;
  chips: string[];
  note: string;
  onAssign?: () => void;
}) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {badge}
        {onAssign && (
          <button
            onClick={onAssign}
            className="ml-auto text-[11px] font-semibold text-brand transition-colors hover:text-brand-hover"
          >
            Assign
          </button>
        )}
      </div>
      {/* Team names are categorical — Tag colours them deterministically, so a
          given team reads the same colour wherever it appears. */}
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <Tag key={c} color={tagColorFor(c)}>
            {c}
          </Tag>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-muted">{note}</p>
    </Card>
  );
}

/** What the next moment will create, plus the control that gets you there. */
function NextStepCard({
  hint,
  actionLabel,
  onAdvance,
}: {
  hint: string;
  actionLabel: string;
  onAdvance: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-line-soft bg-page/40 px-5 py-6">
      <p className="text-[11px] text-muted">{hint}</p>
      <Button onClick={onAdvance}>{actionLabel}</Button>
    </div>
  );
}

function RevertButton({ to, onClick }: { to: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-hover hover:text-ink-3"
    >
      <Undo2 className="size-3" />
      Revert to {to}
    </button>
  );
}

/**
 * Which version of a document someone accepted, captured at first sign-in.
 *
 * Three states worth telling apart: accepted the current version; accepted an
 * older one (they agreed to something that has since changed); or nothing at
 * all — an invited person who has never signed in.
 */
function DocVersion({
  accepted,
  current,
}: {
  accepted?: string;
  current: string;
}) {
  if (!accepted) return <span className="text-sm text-muted">—</span>;
  const stale = accepted !== current;
  return (
    <span
      className={`text-sm ${stale ? "text-warn" : "text-ink-3"}`}
      title={stale ? `Accepted ${accepted}; current is ${current}` : undefined}
    >
      {accepted}
    </span>
  );
}

// -------------------------------------------------------------------------
// Yacht team — created the moment the yacht reaches the customer.
// -------------------------------------------------------------------------

function YachtTeamCard({
  yachtId,
  onAddPerson,
  onOpenMember,
}: {
  yachtId: string;
  onAddPerson: () => void;
  onOpenMember: (m: OwnerTeamMember) => void;
}) {
  const team = ownerTeamOfYacht(yachtId);
  const [roleFilter, setRoleFilter] = useState<"all" | YachtRole>("all");

  // Computed every render on purpose: the store mutates these arrays in place
  // and re-renders via emit(), so `team` keeps the same reference and a useMemo
  // keyed on it would serve stale results after an edit or removal.
  const filtered =
    roleFilter === "all" ? team : team.filter((m) => m.role === roleFilter);

  const counts = team.reduce<Record<string, number>>((acc, m) => {
    acc[m.role] = (acc[m.role] ?? 0) + 1;
    return acc;
  }, {});
  const summary = (["owner", "captain", "crew", "guest"] as YachtRole[])
    .filter((r) => counts[r])
    .map((r) => `${counts[r]} ${roleLabel[r]}`)
    .join(", ");

  return (
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-white">Yacht team</h3>
        <Button onClick={onAddPerson}>
          <Plus className="size-4" />
          Add person
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[11px] text-muted">Filter:</span>
        {ROLE_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setRoleFilter(f.id)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
              roleFilter === f.id
                ? "bg-brand text-white"
                : "border border-line text-ink-3 hover:bg-hover"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-2/60 text-left text-[10px] uppercase tracking-wider text-muted-2">
              <th className="px-4 py-2.5 font-semibold">User</th>
              <th className="px-4 py-2.5 font-semibold">Role</th>
              <th className="px-4 py-2.5 font-semibold">T&amp;C</th>
              <th className="px-4 py-2.5 font-semibold">Privacy</th>
              <th className="w-10 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr
                key={m.id}
                onClick={() => onOpenMember(m)}
                className="cursor-pointer border-b border-line-soft/60 transition-colors last:border-0 hover:bg-hover/40"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} />
                    <div className="leading-tight">
                      <div className="font-medium text-white">{m.name}</div>
                      <div className="text-xs text-ink-4">{m.handle}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Tag color={roleColor[m.role]}>{roleLabel[m.role]}</Tag>
                    {m.poa && <Tag color="violet">PoA</Tag>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <DocVersion
                    accepted={m.tcVersion}
                    current={CURRENT_TC_VERSION}
                  />
                </td>
                <td className="px-4 py-3">
                  <DocVersion
                    accepted={m.privacyVersion}
                    current={CURRENT_PRIVACY_VERSION}
                  />
                </td>
                <td className="px-4 py-3 text-right text-muted">
                  <ChevronRight className="ml-auto size-4" />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-xs text-muted"
                >
                  No one with this role yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-muted">
        {team.length} {team.length === 1 ? "member" : "members"}
        {summary && ` · ${summary}`}
      </p>
    </Card>
  );
}

// -------------------------------------------------------------------------
// Yacht details — the vessel's identity, editable as one block.
// -------------------------------------------------------------------------

const input =
  "w-full rounded-lg border border-line bg-page px-2.5 py-1.5 text-xs text-ink-2 placeholder:text-muted outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20";

function Field({
  label,
  badge,
  children,
}: {
  label: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[5px]">
      <div className="flex min-h-[18px] items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-2">
          {label}
        </span>
        {badge}
      </div>
      {children}
    </div>
  );
}

function YachtDetailsCard({
  shipyardId,
  yacht,
}: {
  shipyardId: string;
  yacht: Yacht;
}) {
  const [editing, setEditing] = useState(false);
  const [uuid, setUuid] = useState("");
  const [mmsi, setMmsi] = useState("");
  const [imo, setImo] = useState("");

  function start() {
    setUuid(yacht.assetUuid ?? "");
    setMmsi(yacht.mmsi ?? "");
    setImo(yacht.imo ?? "");
    setEditing(true);
  }

  function save() {
    setYachtDetails(shipyardId, yacht.id, { assetUuid: uuid, mmsi, imo });
    setEditing(false);
  }

  return (
    // self-start so the card hugs its content instead of stretching to the
    // height of the timeline beside it.
    <Card className="flex flex-col gap-[14px] self-start px-5 py-[18px]">
      <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-2">
        Yacht details
      </span>

      <div className="h-px bg-line" />

      <Field
        label="D.gree Asset UUID"
        badge={
          yacht.assetUuid ? (
            <Badge tone="success">Bound</Badge>
          ) : (
            <Badge tone="neutral">Unbound</Badge>
          )
        }
      >
        {editing ? (
          <input
            value={uuid}
            onChange={(e) => setUuid(e.target.value)}
            placeholder="Paste the UUID issued by D.gree core"
            className={`${input} font-mono`}
          />
        ) : (
          <p className="break-all font-mono text-xs text-ink-3">
            {yacht.assetUuid ?? "—"}
          </p>
        )}
      </Field>

      <Field label="MMSI">
        {editing ? (
          <input
            value={mmsi}
            onChange={(e) => setMmsi(e.target.value)}
            placeholder="e.g. 256962000"
            className={input}
          />
        ) : (
          <p className="text-xs text-ink-3">{yacht.mmsi ?? "—"}</p>
        )}
      </Field>

      <Field label="IMO">
        {editing ? (
          <input
            value={imo}
            onChange={(e) => setImo(e.target.value)}
            placeholder="e.g. 9876543"
            className={input}
          />
        ) : (
          <p className="text-xs text-ink-3">{yacht.imo ?? "—"}</p>
        )}
      </Field>

      <div className="flex items-center justify-end gap-2">
        {/* secondary, not ghost: the DS's ghost is borderless and would read
            as a text link again. */}
        {editing ? (
          <>
            <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={save}>
              Save
            </Button>
          </>
        ) : (
          <Button variant="secondary" size="sm" onClick={start}>
            Edit
          </Button>
        )}
      </div>
    </Card>
  );
}

// -------------------------------------------------------------------------

export default function YachtDetail() {
  useStore();
  const { shipyardId = "", yachtId = "" } = useParams();
  const [personOpen, setPersonOpen] = useState(false);
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [member, setMember] = useState<OwnerTeamMember | null>(null);

  const shipyard = shipyardById(shipyardId);
  const yacht = yachtById(shipyardId, yachtId);
  if (!shipyard || !yacht) return <Navigate to="/" replace />;

  const group = groupById(shipyard.groupId);
  const accessTeams = teamsForYacht(shipyardId, yachtId);
  const stage = yachtStage(yacht);
  const idx = STAGE_ORDER.indexOf(stage);
  const next = STAGE_ORDER[idx + 1] as YachtStage | undefined;

  const nextStep =
    next === "pre_delivery"
      ? {
          label: "Delivery to shipyard",
          hint: "The shipyard teams that get access will appear here.",
          action: "Deliver to shipyard",
        }
      : next === "delivered"
      ? {
          label: "Delivery to customer",
          hint: "The yacht team is created at this moment — you then add owner, captain, crew and guests.",
          action: "Deliver to customer",
        }
      : null;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "D.gree fleet", to: "/fleet" }, { label: yachtLabel(yacht) }]}
        title={yachtLabel(yacht)}
        subtitle={
          <span className="flex flex-wrap items-center gap-2.5">
            <StageBadge stage={stage} />
            <span className="text-xs text-ink-4">
              {group?.name ?? "—"} account · {shipyard.name}
            </span>
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ol className="min-w-0">
          {nextStep && next && (
            <Moment label={nextStep.label} next>
              <NextStepCard
                hint={nextStep.hint}
                actionLabel={nextStep.action}
                onAdvance={() => setYachtStage(shipyardId, yachtId, next)}
              />
            </Moment>
          )}

          {stage === "delivered" && (
            <Moment
              label="Yacht delivered to customer"
              date={formatDay(yacht.customerDeliveryDate)}
              action={
                <RevertButton
                  to="pre-delivery"
                  onClick={() =>
                    setYachtStage(shipyardId, yachtId, "pre_delivery")
                  }
                />
              }
            >
              <YachtTeamCard
                yachtId={yachtId}
                onAddPerson={() => setPersonOpen(true)}
                onOpenMember={setMember}
              />
            </Moment>
          )}

          {idx >= 1 && (
            <Moment
              label="Yacht delivered to shipyard"
              date={formatDay(yacht.shipyardDeliveryDate)}
              action={
                stage === "pre_delivery" ? (
                  <RevertButton
                    to="production"
                    onClick={() =>
                      setYachtStage(shipyardId, yachtId, "production")
                    }
                  />
                ) : undefined
              }
            >
              <TeamCard
                title={`Shipyard · ${shipyard.name}`}
                chips={accessTeams.map((t) => t.name)}
                note={`Access ends ${oneYearAfter(
                  yacht.shipyardDeliveryDate
                )} — one year after shipyard delivery.`}
                onAssign={() => setTeamsOpen(true)}
              />
            </Moment>
          )}

          <Moment
            label="Yacht created"
            date={formatDay(yacht.productionDate)}
            last
          >
            <TeamCard
              title="D.gree team"
              badge={<Badge tone="neutral">Default</Badge>}
              chips={sailAdvTeams.map((t) => `SailADV · ${t.name}`)}
              note="Always has access — D.gree operates the platform."
            />
          </Moment>
        </ol>

        <YachtDetailsCard shipyardId={shipyardId} yacht={yacht} />
      </div>

      <CreateUserDrawer
        open={personOpen}
        onClose={() => setPersonOpen(false)}
        assignValue={`${yachtLabel(yacht)} · yacht team`}
        roleOptions={ROLE_FILTERS.filter((r) => r.id !== "all").map((r) => ({
          value: r.id,
          label: r.label,
        }))}
        // Naming an attorney is the owner's decision, not the admin's — it
        // belongs to their first sign-in and their own settings, not to the
        // invite that creates them.
        onCreate={(r) =>
          addOwnerTeamMember(yachtId, {
            name: fullName(r),
            role: r.role as YachtRole,
            poa: false,
          })
        }
      />

      <YachtTeamMemberDrawer
        open={member !== null}
        onClose={() => setMember(null)}
        yachtId={yachtId}
        yachtName={yachtLabel(yacht)}
        member={member}
      />

      <AssignTeamsToYachtDrawer
        open={teamsOpen}
        onClose={() => setTeamsOpen(false)}
        shipyardId={shipyardId}
        shipyardName={shipyard.name}
        yachtId={yachtId}
        yachtName={yachtLabel(yacht)}
      />
    </>
  );
}
