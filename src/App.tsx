import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Layout from "./components/Layout";
import Start from "./pages/Start";
import Activation from "./pages/Activation";
import AccessManagement from "./pages/AccessManagement";
import FleetPage from "./pages/FleetPage";
import AccountDetail from "./pages/AccountDetail";
import BrandDetail from "./pages/BrandDetail";
import TeamDetail from "./pages/TeamDetail";
import YachtDetail from "./pages/YachtDetail";

function LayoutRoute() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function App() {
  // Two surfaces over one store: the admin (access management + fleet) and the
  // activation flow the people it invites go through. `/` picks between them.
  return (
    <Routes>
      <Route path="/" element={<Start />} />

      {/* Outside the layout, and deliberately not a gate: the prototype stays
          open, and this plays the sign-in flow for whichever person you pick. */}
      <Route path="/activation" element={<Activation />} />
      <Route path="/first-login" element={<Navigate to="/activation" replace />} />

      <Route element={<LayoutRoute />}>
        <Route path="/access" element={<AccessManagement />} />
        <Route path="/fleet" element={<FleetPage />} />
        <Route path="/accounts/:accountId" element={<AccountDetail />} />
        <Route path="/brands/:brandId" element={<BrandDetail />} />
        <Route
          path="/brands/:brandId/teams/:teamId"
          element={<TeamDetail />}
        />
        <Route
          path="/brands/:brandId/yachts/:yachtId"
          element={<YachtDetail />}
        />
        <Route path="*" element={<Navigate to="/access" replace />} />
      </Route>
    </Routes>
  );
}
