import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Rides = lazy(() => import("./pages/Rides"));
const Drivers = lazy(() => import("./pages/Drivers"));
const Vehicles = lazy(() => import("./pages/Vehicles"));
const Stats = lazy(() => import("./pages/Stats"));
const Settings = lazy(() => import("./pages/Settings"));
const NewRide = lazy(() => import("./pages/NewRide"));
const EditRide = lazy(() => import("./pages/EditRide"));
const DriverProfile = lazy(() => import("./pages/DriverProfile"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const InviteAccept = lazy(() => import("./pages/InviteAccept"));
const Onboarding = lazy(() => import("./pages/Onboarding"));

function PrivateRoute({ children }) {
  const { isAuth, booted } = useAuth();
  if (!booted) return null;
  return isAuth ? children : <Navigate to="/" replace />;
}

function PublicRoute({ children }) {
  const { isAuth, booted } = useAuth();
  if (!booted) return null;
  return isAuth ? <Navigate to="/dashboard" replace /> : children;
}

function SuperAdminRoute({ children }) {
  const { user, isAuth, booted } = useAuth();
  if (!booted) return null;
  if (!isAuth) return <Navigate to="/" replace />;
  if (!user) return null;
  return user.role === "superadmin" ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
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
      </Suspense>
    </BrowserRouter>
  );
}
