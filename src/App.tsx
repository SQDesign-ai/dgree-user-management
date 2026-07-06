import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import AccessManagement from "./pages/AccessManagement";
import GroupDetail from "./pages/GroupDetail";
import ShipyardDetail from "./pages/ShipyardDetail";
import TeamDetail from "./pages/TeamDetail";
import YachtDetail from "./pages/YachtDetail";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<AccessManagement />} />
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
      </Routes>
    </Layout>
  );
}
