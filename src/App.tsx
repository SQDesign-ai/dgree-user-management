import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Layout from "./components/Layout";
import FirstLogin from "./pages/FirstLogin";
import AccessManagement from "./pages/AccessManagement";
import FleetPage from "./pages/FleetPage";
import GroupDetail from "./pages/GroupDetail";
import ShipyardDetail from "./pages/ShipyardDetail";
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
  // Single prototype, two-page layout: Access management + D.gree fleet.
  return (
    <Routes>
      {/* Outside the layout, and deliberately not a gate: the prototype stays
          open, and this plays the sign-in flow for whichever person you pick. */}
      <Route path="/first-login" element={<FirstLogin />} />

      <Route element={<LayoutRoute />}>
        <Route path="/" element={<AccessManagement />} />
        <Route path="/fleet" element={<FleetPage />} />
        <Route path="/groups/:groupId" element={<GroupDetail />} />
        <Route path="/shipyards/:shipyardId" element={<ShipyardDetail />} />
        <Route
          path="/shipyards/:shipyardId/teams/:teamId"
          element={<TeamDetail />}
        />
        <Route
          path="/shipyards/:shipyardId/yachts/:yachtId"
          element={<YachtDetail />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
