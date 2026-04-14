import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Rides from "./pages/Rides";
import Drivers from "./pages/Drivers";
import Vehicles from "./pages/Vehicles";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import NewRide from "./pages/NewRide";
import EditRide from "./pages/EditRide";
import DriverProfile from "./pages/DriverProfile";
import SuperAdmin from "./pages/SuperAdmin";
import InviteAccept from "./pages/InviteAccept";
import Onboarding from "./pages/Onboarding";
import { useAuth } from "./context/AuthContext";

function PrivateRoute({ children }) {
  const { isAuth } = useAuth();
  return isAuth ? children : <Navigate to="/" replace />;
}

function PublicRoute({ children }) {
  const { isAuth } = useAuth();
  return isAuth ? <Navigate to="/dashboard" replace /> : children;
}

function SuperAdminRoute({ children }) {
  const { user, isAuth } = useAuth();
  if (!isAuth) return <Navigate to="/" replace />;
  if (!user) return null; // en cours de chargement
  return user.role === "superadmin" ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/rides" element={<PrivateRoute><Rides /></PrivateRoute>} />
        <Route path="/rides/new" element={<PrivateRoute><NewRide /></PrivateRoute>} />
        <Route path="/rides/:id/edit" element={<PrivateRoute><EditRide /></PrivateRoute>} />
        <Route path="/drivers" element={<PrivateRoute><Drivers /></PrivateRoute>} />
        <Route path="/drivers/:id" element={<PrivateRoute><DriverProfile /></PrivateRoute>} />
        <Route path="/vehicles" element={<PrivateRoute><Vehicles /></PrivateRoute>} />
        <Route path="/stats" element={<PrivateRoute><Stats /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/superadmin" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />
        <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
        <Route path="/invite/:token" element={<InviteAccept />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
