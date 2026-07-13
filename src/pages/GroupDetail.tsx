import { useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Plus, ChevronRight } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Badge, Button, Card, SearchInput, Tabs, Avatar } from "../components/ui";
import {
  CreateUserDrawer,
  CreateShipyardDrawer,
  fullName,
} from "../components/drawers";
import {
  useStore,
  groupById,
  shipyardsInGroup,
  peopleInGroup,
  addGroupPerson,
} from "../store";
import type { MemberStatus } from "../data/mock";
import { FEATURES } from "../config";

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

function ShipyardStat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div
        className={`text-2xl font-bold ${
          value > 0 ? "text-white" : "text-muted"
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

export default function GroupDetail() {
  useStore();
  const { groupId = "" } = useParams();
  const [tab, setTab] = useState("people");
  const [personOpen, setPersonOpen] = useState(false);
  const [shipyardOpen, setShipyardOpen] = useState(false);
  const navigate = useNavigate();

  const group = groupById(groupId);
  if (!group) return <Navigate to="/" replace />;

  const groupShipyards = shipyardsInGroup(groupId);
  const people = peopleInGroup(groupId);
  const totalYachts = groupShipyards.reduce((n, s) => n + s.yachts, 0);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Access management", to: "/" },
          { label: `${group.name} Account` },
        ]}
        title={group.name}
        badge={<Badge tone="brand">Account</Badge>}
        subtitle={`${groupShipyards.length} shipyards · ${totalYachts} yachts`}
      />

      <div className="mb-5">
        <Tabs
          tabs={[
            { id: "people", label: "People" },
            { id: "shipyards", label: "Shipyards" },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === "people" ? (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <SearchInput placeholder="Search people" />
            <Button onClick={() => setPersonOpen(true)}>
              <Plus className="size-4" />
              Add person
            </Button>
          </div>
          <Card>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted-2">
                  <th className="px-5 py-3 font-medium">Person</th>
                  <th className="px-5 py-3 font-medium">Access (brands)</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="w-10 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {people.map((p) => (
                  <tr
                    key={p.id}
                    className="cursor-pointer border-b border-line-soft/60 transition-colors last:border-0 hover:bg-hover/40"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.name} />
                        <div className="leading-tight">
                          <div className="font-medium text-white">{p.name}</div>
                          <div className="text-xs text-ink-4">{p.handle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={p.allBrands ? "success" : "outline"} dot>
                        {p.brands}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTone[p.status]} dot>
                        {statusLabel[p.status]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right text-muted">
                      <ChevronRight className="ml-auto size-4" />
                    </td>
                  </tr>
                ))}
                {people.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted">
                      No people with account-level access yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            People here have account-level access — reaching the brands shown and
            every yacht under them. Grant all brands (the whole account) or a
            subset.
          </p>
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <SearchInput placeholder="Search shipyards" />
            {FEATURES.createShipyard && (
              <Button onClick={() => setShipyardOpen(true)}>
                <Plus className="size-4" />
                Add shipyard
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groupShipyards.map((s) => (
              <Card
                key={s.id}
                className="cursor-pointer p-5 transition-colors hover:bg-hover/30"
              >
                <button
                  onClick={() => navigate(`/shipyards/${s.id}`)}
                  className="w-full text-left"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-semibold text-white">{s.name}</span>
                    <ChevronRight className="size-4 text-muted" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <ShipyardStat value={s.yachts} label="Yachts" />
                    <ShipyardStat value={s.teams} label="Teams" />
                    <ShipyardStat value={s.users} label="Users" />
                  </div>
                </button>
              </Card>
            ))}
          </div>
        </>
      )}

      <CreateUserDrawer
        open={personOpen}
        onClose={() => setPersonOpen(false)}
        assignLabel="Assign to"
        assignValue={`${group.name} · all brands`}
        roleOptions={[
          { value: "admin", label: "Account admin" },
          { value: "manager", label: "Manager" },
          { value: "viewer", label: "Viewer" },
        ]}
        onCreate={(r) =>
          addGroupPerson(groupId, {
            name: fullName(r),
            allBrands: true,
            brands: `All ${groupShipyards.length} brands`,
            status: "invited",
          })
        }
      />

      <CreateShipyardDrawer
        open={shipyardOpen}
        groupId={groupId}
        onClose={() => setShipyardOpen(false)}
      />
    </>
  );
}
