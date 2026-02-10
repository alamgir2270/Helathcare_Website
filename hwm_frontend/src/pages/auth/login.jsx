import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import { setAuth } from "../../utils/auth";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Auto-redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token && role) {
      console.log("User already logged in with role:", role);
      if (role === "admin") navigate("/admin/dashboard");
      else if (role === "doctor") navigate("/doctor/dashboard");
      else navigate("/patient/dashboard");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Clear error when user starts typing
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
      // API call to backend using configurable base URL
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save token, user object, and role
        console.log("📦 Response data:", data);
        console.log("📦 data.user:", data.user);
        console.log("📦 data.user?.role:", data.user?.role);
        
        // Centralized save - role must come from user object
        let userRole = data.user?.role;
        console.log("1️⃣ userRole from data.user:", userRole);
        
        // If still no role, try decoding from token
        if (!userRole && data.token) {
          try {
            const payload = JSON.parse(atob(data.token.split(".")[1]));
            console.log("2️⃣ JWT payload:", payload);
            userRole = payload.role;
            console.log("2️⃣ userRole from JWT:", userRole);
          } catch (e) {
            console.warn("Could not decode JWT:", e);
          }
        }
        
        console.log("✅ Final userRole:", userRole);
        setAuth({ token: data.token, user: data.user, role: userRole });

        if (formData.rememberMe) {
          localStorage.setItem("rememberEmail", formData.email);
        } else {
          localStorage.removeItem("rememberEmail");
        }

        setSuccess(true);

        // Immediately navigate based on role so user lands on their dashboard
        if (userRole === "admin") {
          navigate("/admin/dashboard");
        } else if (userRole === "doctor") {
          navigate("/doctor/dashboard");
        } else {
          navigate("/patient/dashboard");
        }
      } else {
        console.error("❌ Login failed:", data);
        setErrors({ submit: data.message || "Login failed" });
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ submit: "An error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // Load remembered email on mount
  useEffect(() => {
    const rememberEmail = localStorage.getItem("rememberEmail");
    if (rememberEmail) {
      setFormData((prev) => ({
        ...prev,
        email: rememberEmail,
        rememberMe: true,
      }));
    }
  }, []);

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your healthcare account</p>
        </div>

        {success && (
          <div className="alert alert-success">
            ✓ Login successful! Redirecting...
          </div>
        )}

        {errors.submit && (
          <div className="alert alert-error">
            ✗ {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {/* Email Field */}
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
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <div className="password-header">
              <label htmlFor="password">Password</label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot?
              </Link>
            </div>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
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
          </div>

          {/* Remember Me Checkbox */}
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
            />
            <label htmlFor="rememberMe">Remember my email</label>
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account yet? <Link to="/signup">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
