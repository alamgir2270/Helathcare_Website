import React, { useState, useEffect } from "react";
import BookingForm from "./BookingForm";

const DoctorSelector = ({ onClose, onBookingSuccess }) => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_BASE}/api/public/departments`);
      const json = await res.json();
      if (res.ok && json.success) {
        // Consolidate departments by name and combine doctors
        const deptMap = {};
        (json.data || []).forEach((dept) => {
          if (!deptMap[dept.name]) {
            deptMap[dept.name] = {
              department_id: dept.department_id,
              name: dept.name,
              description: dept.description,
              Doctors: [],
            };
          }
          // Add all doctors from this clinic's version of the department
          if (dept.Doctors && dept.Doctors.length > 0) {
            deptMap[dept.name].Doctors.push(...dept.Doctors);
          }
        });
        // Convert back to array
        const consolidatedDepts = Object.values(deptMap);
        setDepartments(consolidatedDepts);
      }
    } catch (e) {
      console.error("Failed to load departments:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.modal}>
        <div style={styles.modalContent}>
          <p>Loading doctors...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={{ margin: 0 }}>
            {showBookingForm ? "📅 Book Appointment" : "👨‍⚕️ Select Doctor"}
          </h2>
          <button
            onClick={onClose}
            style={styles.closeBtn}
          >
            ✕
          </button>
        </div>

        {/* Booking Form View */}
        {showBookingForm && selectedDoctor ? (
          <div>
            <button
              onClick={() => setShowBookingForm(false)}
              style={styles.backBtn}
            >
              ← Back to Doctor Selection
            </button>
            <BookingForm
              doctor={selectedDoctor}
              onClose={() => {
                setShowBookingForm(false);
                setSelectedDoctor(null);
              }}
              onSuccess={() => {
                setShowBookingForm(false);
                setSelectedDoctor(null);
                onBookingSuccess?.();
                onClose();
              }}
            />
          </div>
        ) : (
          /* Doctor Selection View */
          <div>
            {selectedDepartment ? (
              // Show doctors for selected department
              <div>
                <button
                  onClick={() => setSelectedDepartment(null)}
                  style={styles.backBtn}
                >
                  ← Back to Departments
                </button>

                <h3 style={{ marginTop: "1.5rem", marginBottom: "1rem", color: "#0d6efd" }}>
                  {selectedDepartment.name}
                </h3>
                <p style={{ color: "#666", marginBottom: "1.5rem" }}>
                  {selectedDepartment.description}
                </p>

                {selectedDepartment.Doctors && selectedDepartment.Doctors.length > 0 ? (
                  <div style={styles.doctorGrid}>
                    {selectedDepartment.Doctors.map((doctor) => (
                      <div
                        key={doctor.doctor_id}
                        style={styles.doctorCard}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
                        }}
                      >
                        <h4 style={{ margin: "0 0 0.5rem 0", color: "#333" }}>
                          👨‍⚕️ Dr. {doctor.User?.full_name}
                        </h4>
                        <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "0.9rem" }}>
                          <strong>Specialty:</strong> {doctor.specialty}
                        </p>
                        <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "0.9rem" }}>
                          <strong>Email:</strong> {doctor.User?.email}
                        </p>
                        <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "0.9rem" }}>
                          <strong>Hours:</strong> {doctor.available_hours}
                        </p>
                        {doctor.bio && (
                          <p style={{ margin: "0.5rem 0", color: "#555", fontSize: "0.85rem", fontStyle: "italic" }}>
                            "{doctor.bio}"
                          </p>
                        )}
                        {doctor.rating_cache && (
                          <p style={{ margin: "0.5rem 0", color: "#f39c12", fontSize: "0.9rem" }}>
                            <strong>⭐ Rating:</strong> {doctor.rating_cache}
                          </p>
                        )}
                        <button
                          onClick={() => {
                            setSelectedDoctor(doctor);
                            setShowBookingForm(true);
                          }}
                          style={styles.selectBtn}
                        >
                          Select Doctor
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#999", textAlign: "center" }}>No doctors available in this department.</p>
                )}
              </div>
            ) : (
              // Show all departments
              <div style={styles.departmentGrid}>
                {departments.map((dept) => (
                  <div
                    key={dept.department_id}
                    onClick={() => setSelectedDepartment(dept)}
                    style={styles.departmentCard}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#0d6efd";
                      e.currentTarget.style.backgroundColor = "#e7f1ff";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "transparent";
                      e.currentTarget.style.backgroundColor = "#f8f9fa";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <h3 style={{ margin: "0 0 0.5rem 0", color: "#0d6efd" }}>
                      {dept.name}
                    </h3>
                    <p style={{ margin: "0.5rem 0", color: "#666", fontSize: "0.9rem" }}>
                      {dept.description}
                    </p>
                    <p style={{ margin: "0.75rem 0 0 0", color: "#999", fontSize: "0.85rem", fontWeight: "600" }}>
                      {dept.Doctors?.length || 0} Doctor{dept.Doctors?.length !== 1 ? "s" : ""}
                    </p>
                    <button
                      style={styles.viewBtn}
                      onMouseEnter={(e) => (e.target.style.backgroundColor = "#0b5ed7")}
                      onMouseLeave={(e) => (e.target.style.backgroundColor = "#0d6efd")}
                    >
                      View Doctors →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "1rem",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
    width: "100%",
    maxWidth: "900px",
    maxHeight: "90vh",
    overflow: "auto",
    padding: "2rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
    borderBottom: "2px solid #f0f0f0",
    paddingBottom: "1rem",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    color: "#666",
  },
  backBtn: {
    padding: "0.7rem 1rem",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
    marginBottom: "1rem",
  },
  departmentGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "1.5rem",
  },
  departmentCard: {
    padding: "1.5rem",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    border: "2px solid transparent",
    cursor: "pointer",
    transition: "all 0.3s ease",
    borderLeft: "5px solid #0d6efd",
  },
  viewBtn: {
    marginTop: "1rem",
    padding: "0.6rem 1rem",
    backgroundColor: "#0d6efd",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
    width: "100%",
    transition: "background-color 0.3s",
  },
  doctorGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1.5rem",
    marginTop: "1rem",
  },
  doctorCard: {
    padding: "1.5rem",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    borderLeft: "4px solid #0d6efd",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  },
  selectBtn: {
    marginTop: "1rem",
    padding: "0.7rem 1rem",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
    width: "100%",
    fontWeight: "600",
    transition: "background-color 0.3s",
  },
};

export default DoctorSelector;
