import { useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Plus, ChevronRight, ChevronLeft } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Badge, Button, Card, SearchInput, Tabs } from "../components/ui";
import {
  shipyardById,
  groupById,
  teamsByShipyard,
  yachtsByShipyard,
  yachtLabel,
} from "../data/mock";

export default function ShipyardDetail() {
  const { shipyardId = "" } = useParams();
  const [tab, setTab] = useState("teams");
  const navigate = useNavigate();

  const shipyard = shipyardById(shipyardId);
  if (!shipyard) return <Navigate to="/" replace />;
  const group = groupById(shipyard.groupId);
  const teams = teamsByShipyard[shipyardId] ?? [];
  const yachts = yachtsByShipyard[shipyardId] ?? [];

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Access management", to: "/" },
          { label: "Shipyards", to: "/" },
        ]}
        title={shipyard.name}
        badge={
          group && (
            <button onClick={() => navigate(`/groups/${group.id}`)}>
              <Badge tone="brand">{group.name} Group</Badge>
            </button>
          )
        }
      />

      <div className="mb-5">
        <Tabs
          tabs={[
            { id: "teams", label: "Teams" },
            { id: "yachts", label: "Yachts" },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === "teams" ? (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <SearchInput placeholder="Search teams" />
            <Button>
              <Plus className="size-4" />
              Create team
            </Button>
          </div>
          <Card>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted-2">
                  <th className="px-5 py-3 font-medium">Team</th>
                  <th className="px-5 py-3 font-medium">Members</th>
                  <th className="px-5 py-3 font-medium">Assigned boats</th>
                  <th className="w-10 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {teams.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() =>
                      navigate(`/shipyards/${shipyardId}/teams/${t.id}`)
                    }
                    className="cursor-pointer border-b border-line-soft/60 transition-colors last:border-0 hover:bg-hover/40"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{t.name}</div>
                      <div className="text-xs text-ink-4">{t.description}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 text-ink-2">
                        <span
                          className={`size-1.5 rounded-full ${
                            t.memberCount > 0 ? "bg-success" : "bg-muted"
                          }`}
                        />
                        {t.memberCount} members
                      </span>
                    </td>
                    <td className="px-5 py-4 text-ink-2">{t.assignedBoats}</td>
                    <td className="px-5 py-4 text-right text-muted">
                      <ChevronRight className="ml-auto size-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <SearchInput placeholder="Search yachts" />
            <Button>
              <Plus className="size-4" />
              Create yacht
            </Button>
          </div>
          <Card>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted-2">
                  <th className="px-5 py-3 font-medium">Yacht</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">MMSI</th>
                  <th className="px-5 py-3 font-medium">Last update</th>
                  <th className="w-10 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {yachts.map((y) => (
                  <tr
                    key={y.id}
                    onClick={() =>
                      navigate(`/shipyards/${shipyardId}/yachts/${y.id}`)
                    }
                    className="cursor-pointer border-b border-line-soft/60 transition-colors last:border-0 hover:bg-hover/40"
                  >
                    <td className="px-5 py-4 font-semibold text-white">
                      {yachtLabel(y)}
                    </td>
                    <td className="px-5 py-4">
                      {y.status === "delivered" ? (
                        <Badge tone="success" dot>
                          Delivered
                        </Badge>
                      ) : (
                        <Badge tone="warn" dot>
                          In production
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-4 text-ink-2">{y.mmsi ?? "—"}</td>
                    <td className="px-5 py-4 text-ink-2">{y.lastUpdate}</td>
                    <td className="px-5 py-4 text-right text-muted">
                      <ChevronRight className="ml-auto size-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs text-muted">
              <span>
                Showing {yachts.length} of {shipyard.yachts} yachts
              </span>
              <div className="flex items-center gap-1">
                <button className="flex size-6 items-center justify-center rounded text-muted hover:text-ink-2">
                  <ChevronLeft className="size-4" />
                </button>
                <span className="flex size-6 items-center justify-center rounded bg-brand text-xs font-medium text-white">
                  1
                </span>
                <span className="flex size-6 items-center justify-center rounded text-ink-3 hover:bg-hover">
                  2
                </span>
                <span className="px-1 text-muted">…</span>
                <span className="flex size-6 items-center justify-center rounded text-ink-3 hover:bg-hover">
                  5
                </span>
                <button className="flex size-6 items-center justify-center rounded text-ink-3 hover:text-white">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
