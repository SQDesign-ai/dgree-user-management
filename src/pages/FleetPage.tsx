import { PageHeader } from "../components/PageHeader";
import { AllYachtsPanel, AddYachtButton } from "../components/AllYachtsPanel";
import { useStore, getTotals } from "../store";

export default function FleetPage() {
  useStore();
  const totals = getTotals();
  return (
    <>
      <PageHeader
        title="Fleet management"
        subtitle={`${totals.yachts} yachts across ${totals.groups} accounts`}
        actions={<AddYachtButton />}
      />
      <AllYachtsPanel />
    </>
  );
}
