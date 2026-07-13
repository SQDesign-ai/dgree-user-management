import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Layout from "./components/Layout";
import ExperienceSelector from "./pages/ExperienceSelector";
import AccessManagement from "./pages/AccessManagement";
import FleetPage from "./pages/FleetPage";
import GroupDetail from "./pages/GroupDetail";
import ShipyardDetail from "./pages/ShipyardDetail";
import TeamDetail from "./pages/TeamDetail";
import YachtDetail from "./pages/YachtDetail";
import { useExperience } from "./experience";

function LayoutRoute() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function App() {
  const experience = useExperience();

  return (
    <Routes>
      <Route path="/experience" element={<ExperienceSelector />} />
      {experience === null ? (
        <Route path="*" element={<Navigate to="/experience" replace />} />
      ) : (
        <Route element={<LayoutRoute />}>
          <Route path="/" element={<AccessManagement />} />
          {experience === "split" && (
            <Route path="/fleet" element={<FleetPage />} />
          )}
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
      )}
    </Routes>
  );
}
