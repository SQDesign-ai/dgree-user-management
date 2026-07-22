import { useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Plus, ChevronRight, ChevronLeft, Users } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import {
  Badge,
  Button,
  Card,
  SearchInput,
  Tabs,
  StageBadge,
  Avatar,
} from "../components/ui";
import { CreateTeamDrawer, CreateYachtDrawer } from "../components/drawers";
import {
  useStore,
  brandById,
  accountById,
  teamsInBrand,
  yachtsInBrand,
} from "../store";
import { yachtLabel, yachtStage, formatDay } from "../data/mock";
import { FEATURES } from "../config";

export default function BrandDetail() {
  useStore();
  const { brandId = "" } = useParams();
  const [tab, setTab] = useState("teams");
  const [teamOpen, setTeamOpen] = useState(false);
  const [yachtOpen, setYachtOpen] = useState(false);
  const navigate = useNavigate();

  const brand = brandById(brandId);
  if (!brand) return <Navigate to="/access" replace />;
  const account = accountById(brand.accountId);
  const teams = teamsInBrand(brandId);
  const yachts = yachtsInBrand(brandId);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Access management", to: "/access" },
          ...(account
            ? [{ label: `${account.name} Account`, to: `/accounts/${account.id}` }]
            : []),
          { label: brand.name },
        ]}
        title={brand.name}
        badge={
          account && (
            <button onClick={() => navigate(`/accounts/${account.id}`)}>
              <Badge tone="brand">{account.name} Account</Badge>
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
          <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
            <SearchInput placeholder="Search teams" />
            <Button onClick={() => setTeamOpen(true)}>
              <Plus className="size-4" />
              Create team
            </Button>
          </div>
          {teams.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted">
              No teams yet.
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((t) => (
                <Card
                  key={t.id}
                  className="cursor-pointer p-5 transition-colors hover:bg-hover/30"
                >
                  <button
                    onClick={() =>
                      navigate(`/brands/${brandId}/teams/${t.id}`)
                    }
                    className="w-full text-left"
                  >
                    <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-brand/15 text-brand">
                      <Users className="size-5" />
                    </div>
                    <div className="font-semibold text-white">{t.name}</div>
                    <div className="mt-4 flex items-center justify-between border-t border-line-soft/60 pt-3">
                      <Badge tone="brand">{t.assignedBoats} boats</Badge>
                      <span className="flex items-center gap-1.5 text-xs text-ink-4">
                        <Avatar name={t.name} size={18} />
                        {t.memberCount} members
                      </span>
                    </div>
                  </button>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
            <SearchInput placeholder="Search yachts" />
            {FEATURES.createYacht && (
              <Button onClick={() => setYachtOpen(true)}>
                <Plus className="size-4" />
                Create yacht
              </Button>
            )}
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted-2">
                  <th className="px-5 py-3 font-medium">Yacht</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Last update</th>
                  <th className="px-5 py-3 font-medium">Brand delivery</th>
                  <th className="px-5 py-3 font-medium">Customer delivery</th>
                  <th className="w-10 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {yachts.map((y) => (
                  <tr
                    key={y.id}
                    onClick={() =>
                      navigate(`/brands/${brandId}/yachts/${y.id}`)
                    }
                    className="cursor-pointer border-b border-line-soft/60 transition-colors last:border-0 hover:bg-hover/40"
                  >
                    <td className="px-5 py-4 font-semibold text-white">
                      {yachtLabel(y)}
                    </td>
                    <td className="px-5 py-4">
                      <StageBadge stage={yachtStage(y)} />
                    </td>
                    <td className="px-5 py-4 text-ink-2">{y.lastUpdate}</td>
                    <td className="px-5 py-4 text-ink-2">
                      {formatDay(y.brandDeliveryDate)}
                    </td>
                    <td className="px-5 py-4 text-ink-2">
                      {formatDay(y.customerDeliveryDate)}
                    </td>
                    <td className="px-5 py-4 text-right text-muted">
                      <ChevronRight className="ml-auto size-4" />
                    </td>
                  </tr>
                ))}
                {yachts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-muted">
                      No yachts yet.
                    </td>
                  </tr>
                )}
              </tbody>
              </table>
            </div>
            {yachts.length > 0 && (
              <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs text-muted">
                <span>
                  Showing {yachts.length} of {brand.yachts} yachts
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
                  <button className="flex size-6 items-center justify-center rounded text-ink-3 hover:text-white">
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      <CreateTeamDrawer
        open={teamOpen}
        brandId={brandId}
        onClose={() => setTeamOpen(false)}
      />
      <CreateYachtDrawer
        open={yachtOpen}
        brandId={brandId}
        onClose={() => setYachtOpen(false)}
      />
    </>
  );
}
