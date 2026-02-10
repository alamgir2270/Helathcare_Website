import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders } from "../../utils/auth";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [doctorStats, setDoctorStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [showPrescModal, setShowPrescModal] = useState(false);
  const [prescForm, setPrescForm] = useState({
    patient_id: "",
    medication_name: "",
    dosage: "",
    frequency: "",
    instructions: "",
    start_date: "",
    end_date: "",
  });
  const [prescLoading, setPrescLoading] = useState(false);

  useEffect(() => {
    fetchDoctorData();
  }, []);

  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      setError("");

      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const headers = getAuthHeaders();

      // Fetch doctor's appointments, patients, and prescriptions
      const [appointResponse, patientResponse, prescResponse] = await Promise.all([
        fetch(`${API_BASE}/api/appointments`, { headers }),
        fetch(`${API_BASE}/api/patients`, { headers }),
        fetch(`${API_BASE}/api/prescriptions`, { headers }),
      ]);

      let fetchedAppointments = [];
      if (appointResponse.ok) {
        const appointData = await appointResponse.json();
        fetchedAppointments = appointData.data || [];
        setAppointments(fetchedAppointments);
      }

      if (patientResponse.ok) {
        const patientData = await patientResponse.json();
        setPatients(patientData.data || []);
      }

      if (prescResponse.ok) {
        const prescData = await prescResponse.json();
        setPrescriptions(prescData.data || []);
      }

      // Calculate stats using freshly fetched data
      const today = new Date();
      const todayAppointments = fetchedAppointments.filter(
        (apt) => new Date(apt.start_time).toDateString() === today.toDateString()
      ).length;

      setDoctorStats({
        name: user.full_name || "Doctor",
        totalAppointments: fetchedAppointments.length,
        todayAppointments,
        totalPatients: patients.length,
        activePrescriptions: prescriptions.filter(
          (p) => new Date(p.issued_at) > new Date()
        ).length,
      });
      
      // Try to fetch current doctor's profile (for image_url etc.)
      try {
        const meResp = await fetch(`${API_BASE}/api/doctors/me`, { headers });
        if (meResp.ok) {
          const meData = await meResp.json();
          // attach to stats for rendering
          setDoctorStats((s) => ({ ...s, profile: meData.data }));
          // Initialize profile form with fetched data
          const pd = meData.data;
          setProfileForm({
            doctor_id: pd.doctor_id,
            specialty: pd.specialty || "",
            bio: pd.bio || "",
            available_hours: pd.available_hours || "",
            available_days: pd.available_days || "",
            image_url: pd.image_url || "",
          });
        }
      } catch (e) {
        console.warn("Could not fetch doctor profile:", e.message);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch doctor data");
      console.error("Doctor data error:", err);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const saveProfileChanges = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const headers = getAuthHeaders();
      const resp = await fetch(`${API_BASE}/api/doctors/${profileForm.doctor_id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(profileForm),
      });
      const data = await resp.json();
      if (resp.ok) {
        setEditingProfile(false);
        fetchDoctorData();
      } else {
        setError(data.message || "Failed to save profile");
      }
    } catch (err) {
      setError(err.message || "Error saving profile");
    }
  };

  const openPrescModal = () => {
    setPrescForm((f) => ({
      ...f,
      patient_id: patients[0]?.patient_id || "",
    }));
    setShowPrescModal(true);
  };

  const createPrescription = async () => {
    try {
      setPrescLoading(true);
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const headers = getAuthHeaders();
      const resp = await fetch(`${API_BASE}/api/prescriptions`, {
        method: "POST",
        headers,
        body: JSON.stringify(prescForm),
      });
      const data = await resp.json();
      if (resp.ok) {
        setShowPrescModal(false);
        fetchDoctorData();
      } else {
        setError(data.message || "Failed to create prescription");
      }
    } catch (e) {
      setError(e.message || "Error creating prescription");
    } finally {
      setPrescLoading(false);
    }
  };

  // Get today's appointments using start_time
  const todayAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.start_time);
    const today = new Date();
    return aptDate.toDateString() === today.toDateString();
  });

  // Get pending appointments (not completed)
  const pendingAppointments = appointments.filter(
    (apt) => apt.status !== "completed"
  );

  if (loading) {
    return <div style={styles.container}><p>Loading your dashboard...</p></div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1>👨‍⚕️ Welcome, Dr. {doctorStats?.name}</h1>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>Manage appointments and patient care</p>
        </div>
        <button onClick={logout} style={styles.logoutBtn}>Logout</button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          ⚠️ {error}
          <button onClick={fetchDoctorData} style={{ marginLeft: "1rem" }}>Retry</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={styles.tabNav}>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === "overview" && styles.activeTab) }}
          onClick={() => setActiveTab("overview")}
        >
          📋 Overview
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === "appointments" && styles.activeTab) }}
          onClick={() => setActiveTab("appointments")}
        >
          📅 Appointments
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === "patients" && styles.activeTab) }}
          onClick={() => setActiveTab("patients")}
        >
          🧑‍⚕️ Patients
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === "prescriptions" && styles.activeTab) }}
          onClick={() => setActiveTab("prescriptions")}
        >
          💊 Prescriptions
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div>
          {/* Profile Card - FEATURED FIRST */}
          <div style={{ ...styles.section, backgroundColor: "#e3f2fd", borderLeft: "5px solid #2196f3", marginBottom: "2rem" }}>
            <h2>👨‍⚕️ Professional Profile</h2>
            {doctorStats?.profile ? (
              <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
                {/* Profile Image */}
                <div style={{ textAlign: "center" }}>
                  {doctorStats.profile.image_url ? (
                    <img
                      src={doctorStats.profile.image_url}
                      alt="Profile"
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 12,
                        objectFit: "cover",
                        border: "3px solid #2196f3",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 120,
                        height: 120,
                        backgroundColor: "#ccc",
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#666",
                        fontSize: "3rem",
                      }}
                    >
                      👨‍⚕️
                    </div>
                  )}
                  <button
                    onClick={() => setEditingProfile(!editingProfile)}
                    style={{
                      marginTop: "1rem",
                      padding: "0.5rem 1rem",
                      backgroundColor: "#2196f3",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    {editingProfile ? "Cancel" : "Edit Profile"}
                  </button>
                </div>

                {/* Profile Details */}
                <div style={{ flex: 1 }}>
                  {!editingProfile ? (
                    /* View Mode */
                    <div>
                      <p style={{ margin: "0.5rem 0" }}>
                        <strong>Name:</strong> {user.full_name || "N/A"}
                      </p>
                      <p style={{ margin: "0.5rem 0" }}>
                        <strong>Email:</strong> {user.email || "N/A"}
                      </p>
                      <p style={{ margin: "0.5rem 0" }}>
                        <strong>Phone:</strong> {user.phone || "N/A"}
                      </p>
                      <p style={{ margin: "0.5rem 0" }}>
                        <strong>Specialty:</strong> {doctorStats.profile.specialty || "N/A"}
                      </p>
                      <p style={{ margin: "0.5rem 0" }}>
                        <strong>Available Days:</strong> {doctorStats.profile.available_days || "N/A"}
                      </p>
                      <p style={{ margin: "0.5rem 0" }}>
                        <strong>Available Hours:</strong> {doctorStats.profile.available_hours || "N/A"}
                      </p>
                      {doctorStats.profile.bio && (
                        <p style={{ margin: "0.5rem 0" }}>
                          <strong>Bio:</strong> {doctorStats.profile.bio}
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Edit Mode */
                    <div>
                      <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem" }}>
                          Specialty
                        </label>
                        <input
                          type="text"
                          value={profileForm.specialty || ""}
                          onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                            fontSize: "1rem",
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem" }}>
                          Available Days (e.g. Mon,Tue,Wed,Thu,Fri)
                        </label>
                        <input
                          type="text"
                          value={profileForm.available_days || ""}
                          onChange={(e) => setProfileForm({ ...profileForm, available_days: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                            fontSize: "1rem",
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem" }}>
                          Available Hours (e.g. 09:00-17:00)
                        </label>
                        <input
                          type="text"
                          value={profileForm.available_hours || ""}
                          onChange={(e) => setProfileForm({ ...profileForm, available_hours: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                            fontSize: "1rem",
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem" }}>
                          Bio
                        </label>
                        <textarea
                          value={profileForm.bio || ""}
                          onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                            fontSize: "1rem",
                            minHeight: "80px",
                            fontFamily: "Arial, sans-serif",
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem" }}>
                          Profile Picture URL
                        </label>
                        <input
                          type="text"
                          value={profileForm.image_url || ""}
                          onChange={(e) => setProfileForm({ ...profileForm, image_url: e.target.value })}
                          placeholder="Paste image URL here"
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                            fontSize: "1rem",
                          }}
                        />
                      </div>

                      <button
                        onClick={saveProfileChanges}
                        style={{
                          padding: "0.75rem 1.5rem",
                          backgroundColor: "#4caf50",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "1rem",
                          marginRight: "0.5rem",
                        }}
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setEditingProfile(false)}
                        style={{
                          padding: "0.75rem 1.5rem",
                          backgroundColor: "#999",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "1rem",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p>Loading profile...</p>
            )}
          </div>

          {/* Stats Cards */}
          <div style={styles.cardsGrid}>
            <StatCard
              icon="📅"
              label="Total Appointments"
              value={doctorStats?.totalAppointments || 0}
              color="#3498db"
            />
            <StatCard
              icon="🕐"
              label="Today's Appointments"
              value={doctorStats?.todayAppointments || 0}
              color="#f39c12"
            />
            <StatCard
              icon="🧑‍⚕️"
              label="Active Patients"
              value={doctorStats?.totalPatients || 0}
              color="#2ecc71"
            />
            <StatCard
              icon="💊"
              label="Active Prescriptions"
              value={doctorStats?.activePrescriptions || 0}
              color="#e74c3c"
            />
          </div>

          {/* Today's Appointments */}
          {todayAppointments.length > 0 && (
            <div style={styles.section}>
              <h2>📅 Today's Appointments ({todayAppointments.length})</h2>
              {todayAppointments.map((apt, idx) => (
                <AppointmentCard key={idx} appointment={apt} />
              ))}
            </div>
          )}

          {/* Pending Appointments */}
          {pendingAppointments.length > 0 && (
            <div style={styles.section}>
              <h2>⏳ Pending Appointments</h2>
              {pendingAppointments.slice(0, 3).map((apt, idx) => (
                <AppointmentCard key={idx} appointment={apt} />
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div style={styles.section}>
            <h2>⚡ Quick Actions</h2>
            <div style={styles.actionGrid}>
              <ActionButton icon="📝" label="Write Prescription" color="#3498db" onClick={openPrescModal} />
              <ActionButton icon="📋" label="View Patient History" color="#2ecc71" />
              <ActionButton icon="📊" label="Patient Reports" color="#e74c3c" />
              <ActionButton icon="💬" label="Send Message" color="#f39c12" />
            </div>
          </div>
        </div>
      )}

      {/* Appointments Tab */}
      {activeTab === "appointments" && (
        <div style={styles.section}>
          <h2>📅 All Appointments</h2>
          {appointments.length > 0 ? (
            <div>
              {appointments.map((apt, idx) => (
                <AppointmentCard key={idx} appointment={apt} detailed />
              ))}
            </div>
          ) : (
            <p style={styles.emptyState}>No appointments found.</p>
          )}
        </div>
      )}

      {/* Patients Tab */}
      {activeTab === "patients" && (
        <div style={styles.section}>
          <h2>🧑‍⚕️ My Patients</h2>
          {patients.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Email</th>
                  <th>Date of Birth</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient, idx) => (
                  <tr key={idx}>
                    <td>{patient.User?.full_name || "N/A"}</td>
                    <td>{patient.User?.email || "N/A"}</td>
                    <td>{patient.dob || "N/A"}</td>
                    <td>{patient.User?.phone || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={styles.emptyState}>No patients found.</p>
          )}
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === "prescriptions" && (
        <div style={styles.section}>
          <h2>💊 Prescriptions</h2>
          {prescriptions.length > 0 ? (
            <div>
              {prescriptions.map((presc, idx) => (
                <PrescriptionCard key={idx} prescription={presc} />
              ))}
            </div>
          ) : (
            <p style={styles.emptyState}>No prescriptions found.</p>
          )}
        </div>
      )}

      {/* Prescription Modal */}
      {showPrescModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <h3 style={{ marginTop: 0 }}>Write Prescription</h3>
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.25rem" }}>Patient</label>
              <select
                value={prescForm.patient_id}
                onChange={(e) => setPrescForm({ ...prescForm, patient_id: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ddd" }}
              >
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.User?.full_name || p.User?.email}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.25rem" }}>Medication Name</label>
              <input
                type="text"
                value={prescForm.medication_name}
                onChange={(e) => setPrescForm({ ...prescForm, medication_name: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ddd" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.25rem" }}>Dosage</label>
                <input
                  type="text"
                  value={prescForm.dosage}
                  onChange={(e) => setPrescForm({ ...prescForm, dosage: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ddd" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.25rem" }}>Frequency</label>
                <input
                  type="text"
                  value={prescForm.frequency}
                  onChange={(e) => setPrescForm({ ...prescForm, frequency: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ddd" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.25rem" }}>Instructions</label>
              <textarea
                value={prescForm.instructions}
                onChange={(e) => setPrescForm({ ...prescForm, instructions: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ddd", minHeight: "80px" }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowPrescModal(false)}
                style={{ padding: "0.5rem 1rem", backgroundColor: "#999", color: "white", border: "none", borderRadius: "4px" }}
              >
                Cancel
              </button>
              <button
                onClick={createPrescription}
                disabled={prescLoading}
                style={{ padding: "0.5rem 1rem", backgroundColor: "#3498db", color: "white", border: "none", borderRadius: "4px" }}
              >
                {prescLoading ? "Saving..." : "Save Prescription"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button onClick={fetchDoctorData} style={styles.refreshBtn}>
        🔄 Refresh Data
      </button>
    </div>
  );
};

// Component: Stat Card
const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...styles.card, borderLeft: `5px solid ${color}` }}>
    <p style={{ fontSize: "2rem", margin: "0 0 0.5rem 0" }}>{icon}</p>
    <p style={styles.cardLabel}>{label}</p>
    <p style={styles.cardValue}>{value}</p>
  </div>
);

// Component: Appointment Card
const AppointmentCard = ({ appointment, detailed }) => (
  <div style={styles.itemCard}>
    <div style={styles.itemHeader}>
      <div>
        <h3 style={styles.itemTitle}>
          {appointment.Patient?.User?.full_name || "Patient"}
        </h3>
        <p style={styles.itemMeta}>
          📅 {new Date(appointment.start_time).toLocaleDateString()} at{" "}
          {new Date(appointment.start_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      <span
        style={{
          ...styles.badge,
          backgroundColor:
            appointment.status === "completed"
              ? "#2ecc71"
              : appointment.status === "scheduled"
              ? "#3498db"
              : "#e74c3c",
        }}
      >
        {appointment.status}
      </span>
    </div>
    {(detailed || appointment.notes) && (
      <p style={styles.itemDescription}>{appointment.notes || "No notes"}</p>
    )}
  </div>
);

// Component: Prescription Card
const PrescriptionCard = ({ prescription }) => {
  const isActive = new Date(prescription.end_date) > new Date();

  return (
    <div style={styles.itemCard}>
      <div style={styles.itemHeader}>
        <div>
          <h3 style={styles.itemTitle}>
            {prescription.Patient?.User?.full_name || "Patient"} - {prescription.medication_name}
          </h3>
          <p style={styles.itemMeta}>
            Dosage: {prescription.dosage} | Frequency: {prescription.frequency}
          </p>
          <p style={styles.itemMeta}>
            {new Date(prescription.start_date).toLocaleDateString()} -{" "}
            {new Date(prescription.end_date).toLocaleDateString()}
          </p>
        </div>
        <span
          style={{
            ...styles.badge,
            backgroundColor: isActive ? "#2ecc71" : "#95a5a6",
          }}
        >
          {isActive ? "Active" : "Completed"}
        </span>
      </div>
    </div>
  );
};

// Component: Action Button
const ActionButton = ({ icon, label, color, onClick }) => (
  <button onClick={onClick} style={{ ...styles.actionBtn, backgroundColor: color, color: "white" }}>
    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{icon}</div>
    {label}
  </button>
);

const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1200,
    padding: "1rem",
  },
  modal: {
    width: "100%",
    maxWidth: 720,
    backgroundColor: "white",
    borderRadius: 8,
    padding: "1rem 1.25rem",
    boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
    maxHeight: "90vh",
    overflowY: "auto",
  },
};

const styles = {
  container: {
    padding: "2rem",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  logoutBtn: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  errorBox: {
    backgroundColor: "#ffe6e6",
    color: "#c0392b",
    padding: "1rem",
    borderRadius: "4px",
    marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tabNav: {
    display: "flex",
    gap: "1rem",
    marginBottom: "2rem",
    borderBottom: "2px solid #ecf0f1",
  },
  tabBtn: {
    padding: "1rem 1.5rem",
    backgroundColor: "transparent",
    border: "none",
    color: "#666",
    cursor: "pointer",
    fontSize: "1rem",
    borderBottom: "3px solid transparent",
    transition: "all 0.3s",
  },
  activeTab: {
    color: "#3498db",
    borderBottomColor: "#3498db",
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
    margin: "0",
  },
  cardValue: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#333",
    margin: "0.5rem 0 0 0",
  },
  section: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    marginBottom: "2rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  itemCard: {
    backgroundColor: "#f9f9f9",
    padding: "1.5rem",
    borderRadius: "6px",
    marginBottom: "1rem",
    borderLeft: "4px solid #3498db",
  },
  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1rem",
  },
  itemTitle: {
    margin: "0 0 0.5rem 0",
    color: "#333",
    fontSize: "1.1rem",
  },
  itemMeta: {
    margin: "0.25rem 0",
    color: "#666",
    fontSize: "0.9rem",
  },
  itemDescription: {
    color: "#555",
    fontSize: "0.95rem",
    marginTop: "0.5rem",
  },
  badge: {
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    color: "white",
    fontSize: "0.85rem",
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "1rem",
  },
  actionBtn: {
    padding: "1.5rem",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    transition: "transform 0.2s",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "1rem",
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
  emptyState: {
    textAlign: "center",
    color: "#999",
    padding: "2rem",
    fontSize: "1.1rem",
  },
};

export default DoctorDashboard;

// Small component to update doctor's image via image URL
const DoctorImageUpdater = ({ doctorId, onSaved }) => {
  const [url, setUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  if (!doctorId) return null;

  const save = async () => {
    setLoading(true);
    setMsg("");
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const headers = getAuthHeaders();
      const resp = await fetch(`${API_BASE}/api/doctors/${doctorId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ image_url: url }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setMsg("Saved");
        onSaved?.();
      } else {
        setMsg(data.message || "Failed to save");
      }
    } catch (e) {
      setMsg(e.message || "Error saving");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <input placeholder="Paste image URL" value={url} onChange={(e) => setUrl(e.target.value)} style={{ width: 260, padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
      <button onClick={save} disabled={loading} style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 6, backgroundColor: '#3498db', color: 'white', border: 'none' }}>{loading ? 'Saving...' : 'Save'}</button>
      {msg && <div style={{ marginTop: 6, color: msg === 'Saved' ? 'green' : 'red' }}>{msg}</div>}
    </div>
  );
};
