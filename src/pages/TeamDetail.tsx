import { useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Plus, ChevronRight, Link as LinkIcon, ShieldCheck } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Badge, Button, Card, SearchInput, Avatar } from "../components/ui";
import { CreateUserDrawer, fullName } from "../components/drawers";
import {
  useStore,
  shipyardById,
  teamById,
  membersInTeam,
  addTeamMember,
} from "../store";
import type { MemberStatus } from "../data/mock";

const statusTone: Record<MemberStatus, "success" | "brand" | "danger"> = {
  active: "success",
  invited: "brand",
  suspended: "danger",
};

const statusLabel: Record<MemberStatus, string> = {
  active: "Active",
  invited: "Invited",
  suspended: "Suspended",
};

export default function TeamDetail() {
  useStore();
  const { shipyardId = "", teamId = "" } = useParams();
  const navigate = useNavigate();

  const [personOpen, setPersonOpen] = useState(false);

  const shipyard = shipyardById(shipyardId);
  const team = teamById(shipyardId, teamId);
  if (!shipyard || !team) return <Navigate to="/" replace />;

  const members = membersInTeam(teamId);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Access management", to: "/" },
          { label: shipyard.name, to: `/shipyards/${shipyardId}` },
          { label: "Teams", to: `/shipyards/${shipyardId}` },
          { label: team.name },
        ]}
        title={team.name}
        badge={<Badge tone="success">{team.memberCount} members</Badge>}
        subtitle={`${team.description} · ${shipyard.name}`}
        actions={
          <Button onClick={() => setPersonOpen(true)}>
            <Plus className="size-4" />
            Add person
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Members */}
        <div>
          <div className="mb-4">
            <SearchInput placeholder="Search members" />
          </div>
          <Card>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted-2">
                  <th className="px-5 py-3 font-medium">Member</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="w-10 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr
                    key={m.id}
                    className="cursor-pointer border-b border-line-soft/60 transition-colors last:border-0 hover:bg-hover/40"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} />
                        <div className="leading-tight">
                          <div className="font-medium text-white">{m.name}</div>
                          <div className="text-xs text-ink-4">{m.handle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTone[m.status]} dot>
                        {statusLabel[m.status]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right text-muted">
                      <ChevronRight className="ml-auto size-4" />
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-sm text-muted">
                      No members yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs text-muted">
              <span>
                Showing {members.length} of {team.memberCount} members
              </span>
              <div className="flex items-center gap-1">
                {["1", "2", "3"].map((p, i) => (
                  <span
                    key={p}
                    className={`flex size-6 items-center justify-center rounded text-xs ${
                      i === 0
                        ? "bg-brand font-medium text-white"
                        : "text-ink-3 hover:bg-hover"
                    }`}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Linked yachts */}
        <aside>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-2">
            Linked yachts
          </h3>
          <Card className="mb-3 p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-white">
                  SL50-171 · CONTIGO
                </div>
                <div className="text-xs text-ink-4">Sanlorenzo · 50 Steel</div>
              </div>
              <button className="text-xs font-medium text-ink-4 hover:text-danger">
                Unlink
              </button>
            </div>
            <div className="mt-3">
              <Badge tone="success" dot>
                Access via owner consent
              </Badge>
            </div>
          </Card>

          <button
            onClick={() => navigate(`/shipyards/${shipyardId}`)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-3 text-sm font-medium text-ink-4 transition-colors hover:border-brand/60 hover:text-ink-2"
          >
            <LinkIcon className="size-4" />
            Link a yacht
          </button>

          <p className="mt-3 flex gap-2 text-xs leading-relaxed text-muted">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-nav-section" />
            The shipyard sees this yacht only while the owner&apos;s PoA
            consents to data access.
          </p>
        </aside>
      </div>

      <CreateUserDrawer
        open={personOpen}
        onClose={() => setPersonOpen(false)}
        assignValue={`${shipyard.name} · ${team.name}`}
        roleOptions={[
          { value: "member", label: "Member" },
          { value: "lead", label: "Team lead" },
        ]}
        onCreate={(r) =>
          addTeamMember(teamId, shipyardId, {
            name: fullName(r),
            status: "invited",
          })
        }
      />
    </>
  );
}
