import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders, clearAuth } from "../../utils/auth";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [appointmentStats, setAppointmentStats] = useState(null);
  const [doctorPerformance, setDoctorPerformance] = useState([]);
  const [revenueStats, setRevenueStats] = useState(null);
  const [prescriptionStats, setPrescriptionStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const headers = getAuthHeaders();

      // If there is no Authorization header, user is not authenticated
      if (!headers.Authorization) {
        clearAuth();
        navigate('/login', { state: { message: 'Please sign in.' } });
        return;
      }

      // Define endpoints to call
      const endpoints = [
        "/api/analytics/dashboard",
        "/api/analytics/appointments/stats",
        "/api/analytics/doctors/performance",
        "/api/analytics/revenue",
        "/api/analytics/prescriptions/stats",
      ];

      // Fire requests in parallel and log request details
      const fetchPromises = endpoints.map((ep) => {
        const url = `${API_BASE}${ep}`;
        console.debug("Analytics request ->", { url, headers });
        return fetch(url, { headers });
      });

      const responses = await Promise.all(fetchPromises);

      // If any unauthorized, clear and redirect
      if (responses.some((r) => r.status === 401)) {
        clearAuth();
        navigate('/login', { state: { message: 'Session expired — please sign in as admin.' } });
        return;
      }

      // Parse each response robustly and log
      const parsed = [];
      for (let i = 0; i < responses.length; i++) {
        const res = responses[i];
        const url = `${API_BASE}${endpoints[i]}`;
        const text = await res.text();
        console.debug("Analytics response ->", { url, status: res.status, body: text });

        if (!res.ok) {
          const msg = `Analytics endpoint ${endpoints[i]} failed: ${res.status} ${text}`;
          throw new Error(msg);
        }

        // Try parse JSON, fallback to raw text
        try {
          parsed.push(JSON.parse(text));
        } catch (e) {
          parsed.push({ data: text });
        }
      }

      const [dashData, appointData, doctorData, revenueData, prescData] = parsed;

      setStats(dashData.data?.overview || {});
      setAppointmentStats(dashData.data?.appointmentStats || {});
      setDoctorPerformance((doctorData && doctorData.data) || []);
      setRevenueStats((revenueData && revenueData.data) || {});
      setPrescriptionStats((prescData && prescData.data) || {});
    } catch (err) {
      setError(err.message || "Failed to fetch analytics");
      console.error("Analytics error:", err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) {
    return <div style={styles.container}><p>Loading analytics...</p></div>;
  }

  if (error) {
    return (
      <div style={styles.container}>
        <p style={{ color: "red" }}>Error: {error}</p>
        <button onClick={fetchAnalytics}>Retry</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>📊 Admin Dashboard</h1>
        <button onClick={logout} style={styles.logoutBtn}>Logout</button>
      </div>

      {/* Overview Cards */}
      <div style={styles.cardsGrid}>
        <StatCard label="Total Users" value={stats?.totalUsers || 0} color="#3498db" />
        <StatCard label="Total Doctors" value={stats?.totalDoctors || 0} color="#2ecc71" />
        <StatCard label="Total Patients" value={stats?.totalPatients || 0} color="#e74c3c" />
        <StatCard label="Total Appointments" value={stats?.totalAppointments || 0} color="#f39c12" />
        <StatCard label="Total Revenue" value={`$${(stats?.totalRevenue || 0).toFixed(2)}`} color="#9b59b6" />
        <StatCard label="Avg Rating" value={(stats?.averageRating || 0).toFixed(1)} color="#1abc9c" icon="⭐" />
      </div>

      {/* Appointment Statistics */}
      {appointmentStats && (
        <div style={styles.section}>
          <h2>📅 Appointment Statistics</h2>
          <div style={styles.statsGrid}>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Scheduled</p>
              <p style={styles.statValue}>{appointmentStats.scheduled}</p>
            </div>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Completed</p>
              <p style={styles.statValue}>{appointmentStats.completed}</p>
            </div>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Cancelled</p>
              <p style={styles.statValue}>{appointmentStats.cancelled}</p>
            </div>
            <div style={styles.stat}>
              <p style={styles.statLabel}>No-Show</p>
              <p style={styles.statValue}>{appointmentStats.noShow}</p>
            </div>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Completion Rate</p>
              <p style={styles.statValue}>{appointmentStats.completionRate}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Statistics */}
      {prescriptionStats && prescriptionStats.totalPrescriptions !== undefined && (
        <div style={styles.section}>
          <h2>💊 Prescription Statistics</h2>
          <div style={styles.statsGrid}>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Total Prescriptions</p>
              <p style={styles.statValue}>{prescriptionStats.totalPrescriptions}</p>
            </div>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Active</p>
              <p style={styles.statValue}>{prescriptionStats.activePrescriptions}</p>
            </div>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Completed</p>
              <p style={styles.statValue}>{prescriptionStats.completedPrescriptions}</p>
            </div>
          </div>
          {prescriptionStats.topMedications && prescriptionStats.topMedications.length > 0 && (
            <div>
              <h3>Top 5 Medications</h3>
              <ul style={styles.list}>
                {prescriptionStats.topMedications.slice(0, 5).map((med, idx) => (
                  <li key={idx}>{med.medication_name} - {med.count} prescriptions</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Revenue Statistics */}
      {revenueStats && revenueStats.totalRevenue !== undefined && (
        <div style={styles.section}>
          <h2>💰 Revenue Statistics</h2>
          <div style={styles.statsGrid}>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Total Revenue</p>
              <p style={styles.statValue}>${(revenueStats.totalRevenue || 0).toFixed(2)}</p>
            </div>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Total Bills</p>
              <p style={styles.statValue}>{revenueStats.totalBills}</p>
            </div>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Average Bill</p>
              <p style={styles.statValue}>${(revenueStats.averageBillAmount || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Performance */}
      {doctorPerformance.length > 0 && (
        <div style={styles.section}>
          <h2>👨‍⚕️ Doctor Performance</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Specialty</th>
                <th>Total Appointments</th>
                <th>Completed</th>
                <th>Completion Rate</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {doctorPerformance.map((doc, idx) => (
                <tr key={idx}>
                  <td>{doc.name || "N/A"}</td>
                  <td>{doc.specialty}</td>
                  <td>{doc.totalAppointments}</td>
                  <td>{doc.completedAppointments}</td>
                  <td>{doc.completionRate}%</td>
                  <td>⭐ {doc.averageRating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button onClick={fetchAnalytics} style={styles.refreshBtn}>🔄 Refresh Data</button>
    </div>
  );
};

const StatCard = ({ label, value, color, icon }) => (
  <div style={{ ...styles.card, borderLeft: `5px solid ${color}` }}>
    <p style={styles.cardLabel}>{icon} {label}</p>
    <p style={styles.cardValue}>{value}</p>
  </div>
);

const styles = {
  container: {
    padding: "2rem",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
    backgroundColor: "white",
    padding: "1rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
    marginBottom: "2rem",
  },
  card: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  cardLabel: {
    fontSize: "0.9rem",
    color: "#666",
    marginBottom: "0.5rem",
  },
  cardValue: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#333",
  },
  section: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    marginBottom: "2rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "1rem",
    marginBottom: "1rem",
  },
  stat: {
    backgroundColor: "#f9f9f9",
    padding: "1rem",
    borderRadius: "4px",
    textAlign: "center",
  },
  statLabel: {
    fontSize: "0.85rem",
    color: "#666",
    marginBottom: "0.5rem",
  },
  statValue: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#333",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "1rem",
  },
  list: {
    listStyle: "none",
    padding: "1rem",
    backgroundColor: "#f9f9f9",
    borderRadius: "4px",
  },
  logoutBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  refreshBtn: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
  },
};

export default AdminDashboard;
