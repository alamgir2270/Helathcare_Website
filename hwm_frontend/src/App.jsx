import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Dashboards
import AdminDashboard from "./pages/admin/dashboard";
import DoctorDashboard from "./pages/doctor/dashboard";
import PatientDashboard from "./pages/patient/dashboard";

// Route guards
import PrivateRoute from "./routes/PrivateRoute";
import RoleRoute from "./routes/RoleRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* ===== Public Routes ===== */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ===== Protected / Role-based Routes ===== */}
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute>
              <RoleRoute role="admin">
                <AdminDashboard />
              </RoleRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/doctor/dashboard"
          element={
            <PrivateRoute>
              <RoleRoute role="doctor">
                <DoctorDashboard />
              </RoleRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/patient/dashboard"
          element={
            <PrivateRoute>
              <RoleRoute role="patient">
                <PatientDashboard />
              </RoleRoute>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
