import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Signup.css";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    countryDial: "+88",
    mobileNo: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    // Mobile number: require local digits and a selected country dial code (compose to E.164)
    if (!formData.mobileNo.trim()) {
      newErrors.mobileNo = "Mobile number is required";
    } else {
      const input = formData.mobileNo.trim();
      // allow user to enter full E.164 (+8801...) or local number; validate after normalization
      const digits = input.replace(/\D/g, "");
      if (digits.length < 6 || digits.length > 15) {
        newErrors.mobileNo = "Please enter a valid mobile number";
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    return strength;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // normalize mobile to E.164 using selected countryDial (if user provided full +... keep it)
      const rawInput = formData.mobileNo.trim();
      let mobileE164 = rawInput.replace(/\s|-/g, "");
      if (!mobileE164.startsWith("+")) {
        const rawDigits = mobileE164.replace(/\D/g, "");
        // ensure countryDial exists and starts with +
        const dial = formData.countryDial && formData.countryDial.startsWith("+") ? formData.countryDial : "+" + (formData.countryDial || "");
        mobileE164 = dial + rawDigits;
      }
      // basic final validation
      if (!/^\+\d{8,15}$/.test(mobileE164)) {
        setErrors({ submit: "Invalid mobile number format" });
        setLoading(false);
        return;
      }

      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          mobile: mobileE164,
          password: formData.password,
          role: "patient",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({ name: "", email: "", mobileNo: "", password: "", confirmPassword: "" });
        setTimeout(() => {
          setSuccess(false);
        }, 2000);
      } else {
        setErrors({ submit: data.message || "Signup failed" });
      }
    } catch (error) {
      setErrors({ submit: "An error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthText = () => {
    const strengths = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
    return strengths[passwordStrength];
  };

  const getPasswordStrengthColor = () => {
    const colors = ["", "#e74c3c", "#f39c12", "#f1c40f", "#27ae60", "#2ecc71"];
    return colors[passwordStrength];
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h2>Patient Registration</h2>
          <p>Create your patient account</p>
        </div>

        {success && (
          <div className="alert alert-success">
            ✓ Account created successfully! Redirecting to login...
          </div>
        )}

        {errors.submit && (
          <div className="alert alert-error">
            ✗ {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="signup-form">
          {/* INFO BOX: Patient Registration Only */}
          <div style={{
            backgroundColor: "#e3f2fd",
            border: "1px solid #2196f3",
            borderRadius: "4px",
            padding: "1rem",
            marginBottom: "1rem",
            fontSize: "0.9rem",
            color: "#1565c0"
          }}>
            <strong>ℹ️ Patient Registration</strong>
            <p style={{ margin: "0.5rem 0 0 0" }}>
              Creating a patient account. If you are a doctor or admin, please contact the hospital administration.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? "input-error" : ""}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "input-error" : ""}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

            {/* Country code select + Mobile Field */}
            <div className="form-group country-mobile-group">
              <label htmlFor="mobileNo">Mobile Number</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  name="countryDial"
                  value={formData.countryDial}
                  onChange={handleChange}
                  style={{ padding: '10px', borderRadius: '8px', border: '2px solid #e0e0e0', background: '#f9f9f9' }}
                >
                  <option value="+88">+88 (BD)</option>
                  <option value="+91">+91 (IN)</option>
                  <option value="+1">+1 (US)</option>
                  <option value="+44">+44 (UK)</option>
                </select>
                <input
                  type="tel"
                  id="mobileNo"
                  name="mobileNo"
                  placeholder="Enter your mobile number"
                  value={formData.mobileNo}
                  onChange={handleChange}
                  className={errors.mobileNo ? "input-error" : ""}
                  style={{ flex: 1 }}
                />
              </div>
              {errors.mobileNo && <span className="error-message">{errors.mobileNo}</span>}
            </div>

          {/* single mobile input is the country-mobile-group above; duplicate removed */}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter Password (min. 8 characters)"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? "input-error" : ""}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}

            {formData.password && (
              <div className="password-strength">
                <div className="strength-meter">
                  <div
                    className="strength-bar"
                    style={{
                      width: `${(passwordStrength / 5) * 100}%`,
                      backgroundColor: getPasswordStrengthColor(),
                    }}
                  />
                </div>
                <span
                  className="strength-text"
                  style={{ color: getPasswordStrengthColor() }}
                >
                  {getPasswordStrengthText()}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? "input-error" : ""}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn-signup"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="signup-footer">
          <p>
            Already have an account? <Link to="/login">Sign In Here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
