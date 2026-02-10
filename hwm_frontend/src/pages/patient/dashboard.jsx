import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders } from "../../utils/auth";
import DoctorSelector from "../../components/DoctorSelector";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showDoctorSelector, setShowDoctorSelector] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});

  useEffect(() => {
    console.log("📊 PatientDashboard mounted");
    const token = localStorage.getItem("token");
    console.log("token:", token ? "✓ Found" : "✗ Not found");
    console.log("user:", user);
    (async () => {
      // Ensure patient profile exists on first load
      try {
        const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const headers = getAuthHeaders();
        await fetch(`${API_BASE}/api/patients/ensure`, { method: "POST", headers });
      } catch (e) {
        console.warn("Could not ensure patient profile:", e.message);
      }
      fetchPatientData();
    })();
  }, []);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      setError("");

      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const headers = getAuthHeaders();

      // Fetch patient info and related data
      const [appointResponse, prescResponse, labResponse, historyResponse] =
        await Promise.all([
          fetch(`${API_BASE}/api/appointments`, { headers }).catch(e => {
            console.warn("⚠️ Appointments endpoint error:", e.message);
            return { ok: false };
          }),
          fetch(`${API_BASE}/api/prescriptions`, { headers }).catch(e => {
            console.warn("⚠️ Prescriptions endpoint error:", e.message);
            return { ok: false };
          }),
          fetch(`${API_BASE}/api/lab-results`, { headers }).catch(e => {
            console.warn("⚠️ Lab results endpoint error:", e.message);
            return { ok: false };
          }),
          fetch(`${API_BASE}/api/medical-history`, { headers }).catch(e => {
            console.warn("⚠️ Medical history endpoint error:", e.message);
            return { ok: false };
          }),
        ]);

      if (appointResponse.ok) {
        try {
          const appointData = await appointResponse.json();
          setAppointments(appointData.data || []);
          console.log("✓ Appointments loaded:", appointData.data?.length || 0);
        } catch (e) {
          console.warn("Failed to parse appointments:", e);
        }
      }

      if (prescResponse.ok) {
        try {
          const prescData = await prescResponse.json();
          setPrescriptions(prescData.data || []);
          console.log("✓ Prescriptions loaded:", prescData.data?.length || 0);
        } catch (e) {
          console.warn("Failed to parse prescriptions:", e);
        }
      }

      if (labResponse.ok) {
        try {
          const labData = await labResponse.json();
          setLabResults(labData.data || []);
          console.log("✓ Lab results loaded:", labData.data?.length || 0);
        } catch (e) {
          console.warn("Failed to parse lab results:", e);
        }
      }

      if (historyResponse.ok) {
        try {
          const histData = await historyResponse.json();
          setMedicalHistory(histData.data || []);
          console.log("✓ Medical history loaded:", histData.data?.length || 0);
        } catch (e) {
          console.warn("Failed to parse medical history:", e);
        }
      }

      // Optionally fetch patient profile fields if backend returned them earlier
      try {
        const meResp = await fetch(`${API_BASE}/api/patients/me`, { headers });
        if (meResp.ok) {
          const meData = await meResp.json();
          const pd = meData.data || {};
          setPatientData(pd);
          setProfileForm({
            dob: pd.dob || "",
            gender: pd.gender || "",
            address: pd.address || "",
            insurance_info: pd.insurance_info || "",
            image_url: pd.image_url || "",
            mobile: pd.User?.phone || "",
            patient_id: pd.patient_id,
          });
          console.log("✓ Patient profile loaded from API", pd.patient_id);
        } else {
          setPatientData({ name: user.full_name || "Patient", email: user.email || "N/A" });
          console.log("✓ Patient profile set from user object");
        }
      } catch (e) {
        console.warn("Could not load patient profile:", e.message);
        setPatientData({ name: user.full_name || "Patient", email: user.email || "N/A" });
      }
    } catch (err) {
      console.error("Patient data error:", err);
      setError(err.message || "Failed to fetch patient data");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const initProfileFormFromData = (pd) => {
    if (!pd) return;
    setProfileForm({
      dob: pd.dob || "",
      gender: pd.gender || "",
      address: pd.address || "",
      insurance_info: pd.insurance_info || "",
      image_url: pd.image_url || "",
      mobile: pd.User?.phone || "",
      patient_id: pd.patient_id,
    });
  };

  const cancelEditProfile = () => {
    // revert profileForm to original patientData values
    initProfileFormFromData(patientData || {});
    setEditingProfile(false);
  };

  // Debug: Log component state
  if (typeof window !== 'undefined') {
    console.clear();
    console.log("=== PATIENT DASHBOARD DEBUG ===");
    console.log("Loading:", loading);
    console.log("User:", user);
    console.log("PatientData:", patientData);
    console.log("Appointments:", appointments);
    console.log("===============================");
  }

  // Get upcoming appointments (next 7 days) using start_time
  const upcomingAppointments = appointments
    .filter((apt) => new Date(apt.start_time) > new Date())
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .slice(0, 3);

  // Get active prescriptions using issued_at
  const activePrescriptions = prescriptions
    .filter((presc) => new Date(presc.issued_at) > new Date())
    .slice(0, 3);

  // Get recent lab results
  const recentLabResults = labResults
    .sort((a, b) => new Date(b.test_date) - new Date(a.test_date))
    .slice(0, 3);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ fontSize: "1.2rem", color: "#666" }}>⏳ Loading your health information...</p>
          <p style={{ color: "#999", marginTop: "1rem" }}>This may take a few seconds</p>
        </div>
      </div>
    );
  }

  console.log("🟢 PatientDashboard rendering with data:", { patientData, user, appointmentsCount: appointments.length });

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1>👋 Welcome, {patientData?.name}</h1>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>Your Health Dashboard</p>
        </div>
        <button onClick={logout} style={styles.logoutBtn}>Logout</button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          ⚠️ {error}
          <button onClick={fetchPatientData} style={{ marginLeft: "1rem" }}>Retry</button>
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
          style={{ ...styles.tabBtn, ...(activeTab === "prescriptions" && styles.activeTab) }}
          onClick={() => setActiveTab("prescriptions")}
        >
          💊 Prescriptions
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === "labResults" && styles.activeTab) }}
          onClick={() => setActiveTab("labResults")}
        >
          🧪 Lab Results
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div>
          {/* Profile Card - FEATURED FIRST */}
          <div style={{ ...styles.section, backgroundColor: "#e3f2fd", borderLeft: "5px solid #2196f3", marginBottom: "2rem" }}>
            <h2>👤 Your Health Profile</h2>
            {patientData ? (
              <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
                {/* Profile Image */}
                <div style={{ textAlign: "center" }}>
                  {patientData.image_url ? (
                    <img src={patientData.image_url} alt="Profile" style={{ width: 120, height: 120, borderRadius: 12, objectFit: "cover", border: "3px solid #2196f3" }} />
                  ) : (
                    <div style={{ width: 120, height: 120, backgroundColor: "#ccc", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: "3rem" }}>👤</div>
                  )}
                  {!editingProfile ? (
                    <button onClick={() => { initProfileFormFromData(patientData); setEditingProfile(true); }} style={{ marginTop: 8, padding: "6px 12px", backgroundColor: "#2196f3", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>Edit</button>
                  ) : (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                      <input value={profileForm.image_url || ""} onChange={(e) => setProfileForm({ ...profileForm, image_url: e.target.value })} placeholder="Image URL" style={{ width: 120, padding: 4, fontSize: "0.8rem" }} />
                      <button onClick={async () => {
                        try {
                          const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
                          const headers = getAuthHeaders();
                          const resp = await fetch(`${API_BASE}/api/patients/${profileForm.patient_id}`, {
                            method: "PATCH",
                            headers,
                            body: JSON.stringify({ image_url: profileForm.image_url }),
                          });
                          if (resp.ok) {
                            const data = await resp.json();
                            setPatientData(data.data);
                            setEditingProfile(false);
                          }
                        } catch (e) {
                          alert(e.message);
                        }
                      }} style={{ padding: "4px 8px", backgroundColor: "#4caf50", color: "white", border: "none", borderRadius: 4, fontSize: "0.8rem" }}>Save</button>
                    </div>
                  )}
                </div>

                {/* Profile Details */}
                <div style={{ flex: 1 }}>
                  {!editingProfile ? (
                    <div>
                      <p style={{ margin: "0 0 0.5rem 0" }}><strong>Name:</strong> {patientData.User?.full_name || patientData.name}</p>
                      <p style={{ margin: "0 0 0.5rem 0" }}><strong>Email:</strong> {patientData.User?.email || patientData.email}</p>
                      <p style={{ margin: "0 0 0.5rem 0" }}><strong>Mobile:</strong> {patientData.User?.phone || user.phone || "Not set"}</p>
                      <p style={{ margin: "0 0 0.5rem 0" }}><strong>DOB:</strong> {patientData.dob || "Not set"}</p>
                      <p style={{ margin: "0 0 0.5rem 0" }}><strong>Gender:</strong> {patientData.gender || "Not set"}</p>
                      <p style={{ margin: "0 0 0.5rem 0" }}><strong>Address:</strong> {patientData.address || "Not set"}</p>
                      <button onClick={() => { initProfileFormFromData(patientData); setEditingProfile(true); }} style={{ marginTop: "1rem", padding: "0.5rem 1rem", backgroundColor: "#2196f3", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>✏️ Edit Profile</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Date of Birth</label>
                        <input value={profileForm.dob || ""} onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })} placeholder="YYYY-MM-DD" type="date" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Gender</label>
                        <select value={profileForm.gender || ""} onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}>
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Address</label>
                        <input value={profileForm.address || ""} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} placeholder="Address" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Mobile (will update your profile)</label>
                        <input type="tel" value={profileForm.mobile || ""} onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })} placeholder="+1 555 555 5555" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }} />
                        <p style={{ fontSize: "0.8rem", color: "#666", marginTop: 6 }}>This will update your primary contact number (include country code)</p>
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Insurance Info</label>
                        <textarea value={profileForm.insurance_info || ""} onChange={(e) => setProfileForm({ ...profileForm, insurance_info: e.target.value })} placeholder="Insurance details" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd", minHeight: 60 }} />
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={async () => {
                          try {
                            const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
                            const headers = getAuthHeaders();
                            // send mobile as phone so backend can persist to User if supported
                            const payload = { ...profileForm, phone: profileForm.mobile || undefined };
                            const resp = await fetch(`${API_BASE}/api/patients/${profileForm.patient_id}`, {
                              method: "PATCH",
                              headers,
                              body: JSON.stringify(payload),
                            });
                            const data = await resp.json();
                            if (resp.ok) {
                              // update local User.phone for immediate UI feedback
                              if (profileForm.mobile) {
                                data.data.User = data.data.User || {};
                                data.data.User.phone = profileForm.mobile;
                              }
                              setPatientData(data.data);
                              setEditingProfile(false);
                            } else {
                              alert(data.message || "Failed to save");
                            }
                          } catch (e) {
                            alert(e.message || "Error saving");
                          }
                        }} style={{ padding: "0.5rem 1rem", backgroundColor: "#4caf50", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>✓ Save Changes</button>
                        <button onClick={cancelEditProfile} style={{ padding: "0.5rem 1rem", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>✗ Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p>Loading profile...</p>
            )}
          </div>

          {/* Quick Stats */}
          <div style={styles.cardsGrid}>
            <StatCard
              icon="📅"
              label="Upcoming Appointments"
              value={upcomingAppointments.length}
              color="#3498db"
            />
            <StatCard
              icon="💊"
              label="Active Prescriptions"
              value={activePrescriptions.length}
              color="#2ecc71"
            />
            <StatCard
              icon="🧪"
              label="Recent Lab Results"
              value={recentLabResults.length}
              color="#e74c3c"
            />
            <StatCard
              icon="⚕️"
              label="Health Status"
              value="Good"
              color="#f39c12"
            />
          </div>

          {/* Upcoming Appointments Preview */}
          {upcomingAppointments.length > 0 && (
            <div style={styles.section}>
              <h2>📅 Upcoming Appointments</h2>
              {upcomingAppointments.map((apt, idx) => (
                <AppointmentCard key={idx} appointment={apt} />
              ))}
            </div>
          )}

          {/* Active Prescriptions Preview */}
          {activePrescriptions.length > 0 && (
            <div style={styles.section}>
              <h2>💊 Active Prescriptions</h2>
              {activePrescriptions.map((presc, idx) => (
                <PrescriptionCard key={idx} prescription={presc} />
              ))}
            </div>
          )}

          {/* Recent Lab Results Preview */}
          {recentLabResults.length > 0 && (
            <div style={styles.section}>
              <h2>🧪 Recent Lab Results</h2>
              {recentLabResults.map((lab, idx) => (
                <LabResultCard key={idx} result={lab} />
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div style={styles.section}>
            <h2>⚡ Quick Actions</h2>
            <div style={styles.actionGrid}>
              <ActionButton
                icon="📅"
                label="Book Appointment"
                color="#3498db"
                onClick={() => setShowDoctorSelector(true)}
              />
              <ActionButton icon="💬" label="Message Doctor" color="#2ecc71" />
              <ActionButton icon="📊" label="View Medical History" color="#e74c3c" />
              <ActionButton icon="⚙️" label="Update Profile" color="#f39c12" />
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
              <button
                onClick={() => setShowDoctorSelector(true)}
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#3498db",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                }}
              >
                + Book Another Appointment
              </button>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <p style={styles.emptyState}>No appointments scheduled yet.</p>
              <button
                onClick={() => setShowDoctorSelector(true)}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#3498db",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  marginTop: "1rem",
                }}
              >
                📅 Book Your First Appointment
              </button>
            </div>
          )}
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === "prescriptions" && (
        <div style={styles.section}>
          <h2>💊 All Prescriptions</h2>
          {prescriptions.length > 0 ? (
            <div>
              {prescriptions.map((presc, idx) => (
                <PrescriptionCard key={idx} prescription={presc} detailed />
              ))}
            </div>
          ) : (
            <p style={styles.emptyState}>No prescriptions on file.</p>
          )}
        </div>
      )}

      {/* Lab Results Tab */}
      {activeTab === "labResults" && (
        <div style={styles.section}>
          <h2>🧪 Lab Results</h2>
          {labResults.length > 0 ? (
            <div>
              {labResults.map((lab, idx) => (
                <LabResultCard key={idx} result={lab} detailed />
              ))}
            </div>
          ) : (
            <p style={styles.emptyState}>No lab results on file.</p>
          )}
        </div>
      )}

      {/* Refresh Button */}
      <button onClick={fetchPatientData} style={styles.refreshBtn}>
        🔄 Refresh Data
      </button>

      {/* Doctor Selector Modal */}
      {showDoctorSelector && (
        <DoctorSelector
          onClose={() => setShowDoctorSelector(false)}
          onBookingSuccess={() => {
            // Refresh appointments after successful booking
            setTimeout(() => fetchPatientData(), 1000);
          }}
        />
      )}
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
          Dr. {appointment.doctor?.User?.full_name || "Doctor"}
        </h3>
        <p style={styles.itemMeta}>
          📅 {new Date(appointment.start_time).toLocaleDateString()} at{" "}
          {new Date(appointment.start_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      <span style={{
        ...styles.badge,
        backgroundColor: appointment.status === "completed" ? "#2ecc71" : "#3498db",
      }}>
        {appointment.status}
      </span>
    </div>
    {(detailed || appointment.notes) && (
      <p style={styles.itemDescription}>{appointment.notes || "No notes provided"}</p>
    )}
  </div>
);

// Component: Prescription Card
const PrescriptionCard = ({ prescription, detailed }) => {
  const endDate = prescription.end_date || prescription.end_at || new Date();
  const isActive = new Date(endDate) > new Date();

  return (
    <div style={styles.itemCard}>
      <div style={styles.itemHeader}>
        <div>
          <h3 style={styles.itemTitle}>💊 {prescription.medication_name}</h3>
          <p style={styles.itemMeta}>
            Dosage: {prescription.dosage} | Frequency: {prescription.frequency}
          </p>
          <p style={styles.itemMeta}>
            {new Date(prescription.start_date).toLocaleDateString()} -{" "}
            {new Date(endDate).toLocaleDateString()}
          </p>
        </div>
        <span style={{
          ...styles.badge,
          backgroundColor: isActive ? "#2ecc71" : "#95a5a6",
        }}>
          {isActive ? "Active" : "Completed"}
        </span>
      </div>
      {detailed && prescription.instructions && (
        <p style={styles.itemDescription}>{prescription.instructions}</p>
      )}
    </div>
  );
};

// Component: Lab Result Card
const LabResultCard = ({ result, detailed }) => (
  <div style={styles.itemCard}>
    <div style={styles.itemHeader}>
      <div>
        <h3 style={styles.itemTitle}>🧪 {result.test_type}</h3>
        <p style={styles.itemMeta}>
          📅 {new Date(result.test_date).toLocaleDateString()}
        </p>
        {result.reference_range && (
          <p style={styles.itemMeta}>Reference Range: {result.reference_range}</p>
        )}
      </div>
      <span style={{
        ...styles.badge,
        backgroundColor:
          result.result_status === "normal" ? "#2ecc71" :
          result.result_status === "abnormal" ? "#e74c3c" : "#f39c12",
      }}>
        {result.result_status}
      </span>
    </div>
    {detailed && result.result_value && (
      <p style={styles.itemDescription}>Result: {result.result_value}</p>
    )}
  </div>
);

// Component: Action Button
const ActionButton = ({ icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    style={{
      ...styles.actionBtn,
      backgroundColor: color,
      color: "white",
      cursor: onClick ? "pointer" : "not-allowed",
      opacity: onClick ? 1 : 0.6,
    }}
    onMouseEnter={(e) => {
      if (onClick) {
        e.target.style.transform = "scale(1.05)";
        e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
      }
    }}
    onMouseLeave={(e) => {
      e.target.style.transform = "scale(1)";
      e.target.style.boxShadow = "none";
    }}
  >
    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{icon}</div>
    {label}
  </button>
);

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
    transition: "transform 0.2s, box-shadow 0.2s",
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

export default PatientDashboard;
