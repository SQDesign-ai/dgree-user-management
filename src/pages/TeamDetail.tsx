import { useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Plus, ChevronRight, ShieldCheck } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Badge, Button, Card, SearchInput, Avatar } from "../components/ui";
import { PeopleCount } from "@sqdesign-ai/dgree-ds-react";
import {
  AddTeamPeopleDrawer,
} from "../components/drawers";
import {
  useStore,
  brandById,
  accountById,
  teamById,
  membersInTeam,
  yachtsForTeam,
} from "../store";
import {
  yachtLabel,
  yachtStage,
  STAGE_META,
  type MemberStatus,
} from "../data/mock";

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
  const { brandId = "", teamId = "" } = useParams();
  const navigate = useNavigate();

  const [personOpen, setPersonOpen] = useState(false);

  const brand = brandById(brandId);
  const team = teamById(brandId, teamId);
  if (!brand || !team) return <Navigate to="/" replace />;

  const account = accountById(brand.accountId);
  const members = membersInTeam(teamId);
  const linkedYachts = yachtsForTeam(brandId, teamId);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Access management", to: "/" },
          ...(account
            ? [{ label: `${account.name} Account`, to: `/accounts/${account.id}` }]
            : []),
          { label: brand.name, to: `/brands/${brandId}` },
          { label: team.name },
        ]}
        title={team.name}
        // A headcount, not a status — this was a green "success" badge.
        badge={<PeopleCount value={team.memberCount}>members</PeopleCount>}
        subtitle={brand.name}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Members */}
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
            <SearchInput placeholder="Search members" />
            <Button onClick={() => setPersonOpen(true)}>
              <Plus className="size-4" />
              Add person
            </Button>
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
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">
                              {m.name}
                            </span>
                            {m.kind === "sail-adv" && (
                              <Badge tone="brand">SailADV</Badge>
                            )}
                          </div>
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
          {/* Read-only here: a yacht's access is granted from the yacht, so
              this shows what the team can reach without offering to change it. */}
          <div className="mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-2">
              Linked yachts ({linkedYachts.length})
            </h3>
          </div>

          {linkedYachts.map((y) => (
            <Card key={y.id} className="mb-3 p-4">
              <div className="flex items-start justify-between">
                <button
                  onClick={() =>
                    navigate(`/brands/${brandId}/yachts/${y.id}`)
                  }
                  className="text-left"
                >
                  <div className="font-semibold text-white">
                    {yachtLabel(y)}
                  </div>
                  <div className="text-xs text-ink-4">
                    {brand.name} · {STAGE_META[yachtStage(y)].short}
                  </div>
                </button>
              </div>
              <div className="mt-3">
                <Badge tone="success" dot>
                  Access via owner consent
                </Badge>
              </div>
            </Card>
          ))}

          <p className="mt-3 flex gap-2 text-xs leading-relaxed text-muted">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-nav-section" />
            The brand sees a yacht only while the owner&apos;s PoA consents to
            data access.
          </p>
        </aside>
      </div>

      <AddTeamPeopleDrawer
        open={personOpen}
        onClose={() => setPersonOpen(false)}
        brandId={brandId}
        teamId={teamId}
        teamName={team.name}
      />

    </>
  );
}
