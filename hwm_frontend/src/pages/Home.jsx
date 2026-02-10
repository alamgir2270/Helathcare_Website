import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BookingForm from "../components/BookingForm";
import "./home.css";

const Home = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [selectedDepartmentInModal, setSelectedDepartmentInModal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
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
        } else {
          console.warn("Departments API returned no data", json);
        }
      } catch (e) {
        console.warn("Failed to load departments", e.message || e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleViewProfile = (doctor) => {
    const token = localStorage.getItem("token");
    // If not authenticated, ask user to login or signup before viewing full profile
    if (!token) {
      if (window.confirm("You must be logged in to view full profiles. Log in now?")) {
        navigate("/login");
      } else {
        navigate("/signup");
      }
      return;
    }

    // Navigate to the doctor's public profile page (by id)
    // Frontend route should handle `/doctors/:id`; adjust if your route differs
    navigate(`/doctors/${doctor.doctor_id}`);
  };

  return (
    <div className="hw-home">
      <header className="hw-header">
        <div className="hw-container hw-nav">
          <div className="hw-brand">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect width="24" height="24" rx="4" fill="#0d6efd" />
              <path d="M7 12h10M12 7v10" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hw-title">Healthcare Management</span>
          </div>
          <nav className="hw-links" aria-label="Main navigation">
            <Link to="/login" className="hw-link">Login</Link>
            <Link to="/signup" className="hw-link hw-cta">Sign up</Link>
          </nav>
        </div>
      </header>

      <main className="hw-main">
        <section className="hw-hero hw-container">
          <div className="hw-hero-left">
            <h1 className="hw-hero-title">Streamlined care, intelligent workflows</h1>
            <p className="hw-lead">Manage patients, appointments, prescriptions and more — securely and efficiently. Tailored for clinics, hospitals and private practices.</p>
            <div className="hw-hero-cta">
              <Link to="/signup" className="hw-btn primary">Get started</Link>
              <Link to="/login" className="hw-btn ghost">Have an account?</Link>
            </div>
          </div>
          <div className="hw-hero-right" aria-hidden>
            <svg className="hw-illustration" viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="640" height="512" rx="20" fill="#f1f5f9" />
              <g transform="translate(80,80)" fill="#0d6efd">
                <circle cx="200" cy="104" r="64" opacity="0.95" />
                <rect x="56" y="208" width="288" height="24" rx="12" fill="#60a5fa" />
              </g>
            </svg>
          </div>
        </section>

        <section className="hw-features hw-container">
          <article className="hw-card">
            <h3>Appointments</h3>
            <p>Fast booking, calendar sync, and reminders to reduce no-shows.</p>
          </article>
          <article className="hw-card">
            <h3>Patient Records</h3>
            <p>Secure, searchable records with complete medical history.</p>
          </article>
          <article className="hw-card">
            <h3>Prescriptions</h3>
            <p>Streamline e-prescriptions and medication tracking.</p>
          </article>
        </section>

        {/* Departments & Specialists CTA Button */}
        {!loading && departments.length > 0 && (
          <section className="hw-container" style={{ marginTop: "3rem", textAlign: "center" }}>
            <button
              onClick={() => setShowDepartmentModal(true)}
              style={{
                padding: "1rem 2rem",
                fontSize: "1.1rem",
                fontWeight: "600",
                backgroundColor: "#0d6efd",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(13, 110, 253, 0.3)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#0b5ed7";
                e.target.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#0d6efd";
                e.target.style.transform = "scale(1)";
              }}
            >
              👨‍⚕️ View All Departments & Specialists
            </button>
          </section>
        )}

        {/* Departments & Specialists - Hidden (using modal instead) */}
        {/* Original grid-based departments section removed - now using modal */}

        {loading && (
          <section className="hw-container" style={{ marginTop: "3rem", textAlign: "center" }}>
            <p>Loading departments...</p>
          </section>
        )}

        {/* Facilities info */}
        <section className="hw-container" style={{ marginTop: '2rem' }}>
          <h2>Our Facilities</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div className="hw-card"><h4>24/7 Emergency</h4><p>Round-the-clock emergency services with experienced staff.</p></div>
            <div className="hw-card"><h4>In-house Lab</h4><p>Quick and accurate lab testing with digital results.</p></div>
            <div className="hw-card"><h4>Pharmacy</h4><p>On-site pharmacy with e-prescription fulfillment.</p></div>
            <div className="hw-card"><h4>Imaging</h4><p>Advanced imaging — X-ray, CT, and MRI at the facility.</p></div>
          </div>
        </section>
      </main>

      {/* Booking Form Modal */}
      {showBookingForm && selectedDoctor && (
        <BookingForm
          doctor={selectedDoctor}
          onClose={() => {
            setShowBookingForm(false);
            setSelectedDoctor(null);
          }}
          onSuccess={() => {
            setShowBookingForm(false);
            setSelectedDoctor(null);
            alert("Appointment booked successfully! Check your dashboard to see the appointment.");
          }}
        />
      )}

      {/* Departments & Specialists Modal */}
      {showDepartmentModal && (
        <div
          style={{
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
          }}
          onClick={() => {
            setShowDepartmentModal(false);
            setSelectedDepartmentInModal(null);
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
              width: "100%",
              maxWidth: "900px",
              maxHeight: "90vh",
              overflow: "auto",
              padding: "2rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ margin: 0, color: "#333" }}>👨‍⚕️ Our Departments & Specialists</h2>
              <button
                onClick={() => {
                  setShowDepartmentModal(false);
                  setSelectedDepartmentInModal(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#666",
                }}
              >
                ✕
              </button>
            </div>

            {!selectedDepartmentInModal ? (
              // Department List View
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.5rem" }}>
                {departments.map((dept) => (
                  <div
                    key={dept.department_id}
                    onClick={() => setSelectedDepartmentInModal(dept)}
                    style={{
                      padding: "1.5rem",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "8px",
                      border: "2px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      borderLeft: "5px solid #0d6efd",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#0d6efd";
                      e.currentTarget.style.backgroundColor = "#e7f1ff";
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "transparent";
                      e.currentTarget.style.backgroundColor = "#f8f9fa";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <h3 style={{ margin: "0 0 0.5rem 0", color: "#0d6efd" }}>{dept.name}</h3>
                    <p style={{ margin: "0.5rem 0", color: "#666", fontSize: "0.9rem" }}>
                      {dept.description}
                    </p>
                    <p style={{ margin: "0.75rem 0 0 0", color: "#999", fontSize: "0.85rem", fontWeight: "600" }}>
                      {dept.Doctors && dept.Doctors.length > 0 ? `${dept.Doctors.length} Doctor${dept.Doctors.length > 1 ? 's' : ''}` : 'No doctors'}
                    </p>
                    <button
                      style={{
                        marginTop: "1rem",
                        padding: "0.6rem 1rem",
                        backgroundColor: "#0d6efd",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        width: "100%",
                      }}
                      onMouseEnter={(e) => (e.target.style.backgroundColor = "#0b5ed7")}
                      onMouseLeave={(e) => (e.target.style.backgroundColor = "#0d6efd")}
                    >
                      View Doctors →
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              // Department Detail View with Doctors
              <div>
                <button
                  onClick={() => setSelectedDepartmentInModal(null)}
                  style={{
                    marginBottom: "1.5rem",
                    padding: "0.6rem 1rem",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = "#5a6268")}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = "#6c757d")}
                >
                  ← Back to Departments
                </button>

                <h3 style={{ color: "#0d6efd", marginTop: 0, marginBottom: "0.5rem" }}>
                  {selectedDepartmentInModal.name}
                </h3>
                <p style={{ color: "#666", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                  {selectedDepartmentInModal.description}
                </p>

                {selectedDepartmentInModal.Doctors && selectedDepartmentInModal.Doctors.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
                    {selectedDepartmentInModal.Doctors.map((doctor) => (
                      <div
                        key={doctor.doctor_id}
                        style={{
                          padding: "1.5rem",
                          backgroundColor: "#f8f9fa",
                          borderRadius: "8px",
                          borderLeft: "4px solid #0d6efd",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.1)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = "none";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <h4 style={{ margin: "0 0 0.5rem 0", color: "#333" }}>
                          👨‍⚕️ Dr. {doctor.User?.full_name || "Doctor"}
                        </h4>

                        <div style={{ marginBottom: "0.75rem" }}>
                          <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "0.9rem" }}>
                            <strong>Specialty:</strong> {doctor.specialty}
                          </p>
                          <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "0.9rem" }}>
                            <strong>Email:</strong> {doctor.User?.email || "N/A"}
                          </p>
                          <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "0.9rem" }}>
                            <strong>License:</strong> {doctor.license_no || "N/A"}
                          </p>
                          <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "0.9rem" }}>
                            <strong>Hours:</strong> {doctor.available_hours || "Not specified"}
                          </p>
                          {doctor.bio && (
                            <p style={{ margin: "0.5rem 0", color: "#555", fontSize: "0.85rem", fontStyle: "italic" }}>
                              "{doctor.bio}"
                            </p>
                          )}
                          {doctor.rating_cache && (
                            <p style={{ margin: "0.25rem 0", color: "#f39c12", fontSize: "0.9rem" }}>
                              <strong>⭐ Rating:</strong> {doctor.rating_cache}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            const token = localStorage.getItem("token");
                            if (!token) {
                              if (window.confirm("You must be logged in to book an appointment. Log in now?")) {
                                navigate("/login");
                              } else {
                                navigate("/signup");
                              }
                              return;
                            }
                            setSelectedDoctor(doctor);
                            setShowBookingForm(true);
                            setShowDepartmentModal(false);
                          }}
                          style={{
                            padding: "0.7rem 1rem",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            width: "100%",
                            fontWeight: "600",
                          }}
                          onMouseEnter={(e) => (e.target.style.backgroundColor = "#218838")}
                          onMouseLeave={(e) => (e.target.style.backgroundColor = "#28a745")}
                        >
                          📅 Book Appointment
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#999", textAlign: "center", fontSize: "0.95rem" }}>
                    No doctors currently available in this department.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="hw-footer">
        <div className="hw-container hw-footer-inner">
          <p className="muted">© {new Date().getFullYear()} Healthcare Management System</p>
          <div className="muted">Built with care · Privacy-first</div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
