import React, { useState, useEffect } from "react";
import { getAuthHeaders } from "../utils/auth";

const BookingForm = ({ doctor, onClose, onSuccess }) => {
  const [startTime, setStartTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [patientInfo, setPatientInfo] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(true);
  
  // Editable patient fields
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [mobile, setMobile] = useState("");

  // Fetch current patient's profile info on mount
  useEffect(() => {
    const fetchPatientInfo = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const headers = getAuthHeaders();
        const resp = await fetch(`${API_BASE}/api/patients/me`, { headers });
        if (resp.ok) {
          const data = await resp.json();
          setPatientInfo(data.data);
          // Initialize editable fields from profile
          setDob(data.data.dob ? data.data.dob.split('T')[0] : "");
          setGender(data.data.gender || "");
          setMobile(data.data.User?.phone || "");
        }
      } catch (e) {
        console.warn("Could not fetch patient info:", e.message);
      } finally {
        setLoadingPatient(false);
      }
    };
    fetchPatientInfo();
  }, []);

  // Parse available days (comma-separated weekday names)
  const availableDays = doctor.available_days
    ? doctor.available_days.split(",").map((d) => d.trim())
    : ["Mon", "Tue", "Wed", "Thu", "Fri"];

  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Check if a given date is on an available day
  const isAvailableDay = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const dayLabel = weekdayNames[date.getDay()];
    return availableDays.includes(dayLabel);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!startTime || !reason) {
      setError("Please fill in all fields");
      return;
    }

    // Validate selected date is on an available day
    if (!isAvailableDay(startTime)) {
      const validDays = availableDays.join(", ");
      setError(`Doctor is only available on: ${validDays}`);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const headers = getAuthHeaders();

      // Ensure token is present
      if (!headers.Authorization) {
        setError("You must be logged in to book an appointment");
        onClose();
        return;
      }

      // First, update patient profile if any fields changed (include phone with country code)
      if (patientInfo) {
        try {
          const payload = { dob: dob || null, gender: gender || null };
          if (mobile) payload.phone = mobile;
          await fetch(`${API_BASE}/api/patients/${patientInfo.patient_id}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(payload),
          });
        } catch (e) {
          console.warn("Could not update patient profile:", e.message);
          // Don't fail the booking if profile update fails
        }
      }

      // Then book the appointment
      const response = await fetch(`${API_BASE}/api/appointments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          doctor_id: doctor.doctor_id,
          start_time: new Date(startTime).toISOString(),
          reason,
          notes: reason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ Appointment booked successfully!");
        onSuccess?.();
        onClose();
      } else {
        setError(data.message || "Failed to book appointment");
      }
    } catch (err) {
      console.error("Booking error:", err);
      setError(err.message || "An error occurred while booking");
    } finally {
      setLoading(false);
    }
  };

  // Get minimum datetime (today + 1 hour)
  const now = new Date();
  const minDateTime = new Date(now.getTime() + 3600000).toISOString().slice(0, 16);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "2rem",
          maxWidth: "500px",
          width: "90%",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          // constrain height and allow inner scrolling for long content
          maxHeight: "90vh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, color: "#0d6efd" }}>
          📅 Book Appointment with Dr. {doctor.User?.full_name}
        </h2>

        <div
          style={{
            backgroundColor: "#e7f3ff",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            border: "2px solid #0d6efd",
          }}
        >
          <p style={{ margin: "0.5rem 0" }}>
            <strong>Specialty:</strong> {doctor.specialty}
          </p>
          <p style={{ margin: "0.5rem 0", fontWeight: "bold", color: "#0056b3" }}>
            📅 <strong>Available Days:</strong> {availableDays.join(", ")}
          </p>
          <p style={{ margin: "0.5rem 0" }}>
            <strong>Available Hours:</strong> {doctor.available_hours || "09:00 - 17:00"}
          </p>
          {doctor.rating_cache && (
            <p style={{ margin: "0.5rem 0" }}>
              <strong>Rating:</strong> ⭐ {doctor.rating_cache}
            </p>
          )}
          <p style={{ margin: "0.5rem 0", fontSize: "0.85rem", color: "#666" }}>
            ℹ️ Please select a date that falls on one of the available days above.
          </p>
        </div>

        {/* Patient Info Section */}
        {!loadingPatient && patientInfo && (
          <div
            style={{
              backgroundColor: "#f0f8f0",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1.5rem",
              border: "2px solid #2ecc71",
            }}
          >
            <p style={{ margin: "0.5rem 0 1rem 0", fontSize: "0.9rem" }}>
              <strong>📋 Your Details (Edit if needed):</strong>
            </p>
            
            {/* DOB Field */}
            <div style={{ marginBottom: "0.8rem" }}>
              <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.85rem", fontWeight: "bold" }}>
                📅 Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Gender Field */}
            <div style={{ marginBottom: "0.8rem" }}>
              <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.85rem", fontWeight: "bold" }}>
                👤 Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                  backgroundColor: "white",
                }}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Mobile Field */}
            <div style={{ marginBottom: "0.8rem" }}>
              <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.85rem", fontWeight: "bold" }}>
                📱 Mobile Number
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter your mobile number"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              />
              <p style={{ fontSize: "0.75rem", color: "#666", margin: "0.25rem 0 0 0" }}>
                This will be saved to your profile
              </p>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            color: "#fff",
            backgroundColor: "#e74c3c",
            marginBottom: "1rem",
            padding: "0.75rem",
            borderRadius: "6px",
            border: "1px solid #c0392b",
            fontWeight: "500"
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Preferred Date & Time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                // Clear error when user changes input
                if (error) setError("");
              }}
              min={minDateTime}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: "1px solid #ddd",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
            <p style={{ fontSize: "0.8rem", color: "#666", margin: "0.25rem 0 0 0" }}>
              💡 Select a date on: {availableDays.join(", ")}
            </p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Reason for Visit
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe your symptoms or reason for appointment"
              rows="4"
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: "1px solid #ddd",
                fontSize: "1rem",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                backgroundColor: "#0d6efd",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "1rem",
                fontWeight: "bold",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Booking..." : "✅ Book Appointment"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                backgroundColor: "#e9ecef",
                color: "#333",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "bold",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
