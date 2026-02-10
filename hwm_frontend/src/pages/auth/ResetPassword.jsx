import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setError("Password must contain uppercase, lowercase, and numbers");
      return;
    }

    setLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || "Failed to reset password");
        return;
      }

      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError("Error resetting password. Please try again.");
      console.error("Reset password error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Reset Password</h2>

      {!token ? (
        <div className="error-message">
          <p>❌ Invalid reset link. Please request a new password reset.</p>
          <Link to="/forgot-password">Request New Reset Link</Link>
        </div>
      ) : success ? (
        <div className="success-message">
          <p>✅ Password reset successful!</p>
          <p>Redirecting to login...</p>
        </div>
      ) : (
        <>
          {error && <p className="error-message">❌ {error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />
              <small>
                at least 8 characters with uppercase, lowercase, and numbers
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                id="confirm-password"
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <p>
            <Link to="/login">Back to Login</Link>
          </p>
        </>
      )}
    </div>
  );
};

export default ResetPassword;
