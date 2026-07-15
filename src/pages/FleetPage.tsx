import { PageHeader } from "../components/PageHeader";
import { AllYachtsPanel } from "../components/AllYachtsPanel";
import { useStore, getTotals } from "../store";

export default function FleetPage() {
  useStore();
  const totals = getTotals();
  return (
    <>
      <PageHeader
        title="D.gree fleet"
        subtitle={`${totals.yachts} yachts across ${totals.groups} accounts`}
      />
      <AllYachtsPanel />
    </>
  );
}
