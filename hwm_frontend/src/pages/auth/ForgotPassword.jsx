import React, { useState } from "react";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || "Failed to send reset link");
        return;
      }

      setSent(true);
    } catch (err) {
      setError("Error sending reset link. Please try again.");
      console.error("Forgot password error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Forgot Password</h2>

      {sent ? (
        <div className="success-message">
          <p>✅ Password reset link has been sent to your email.</p>
          <p className="text-sm">Check your inbox and follow the link to reset your password.</p>
        </div>
      ) : (
        <>
          {error && <p className="error-message">{error}</p>}
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </>
      )}

      <p>
        <Link to="/login">Back to Login</Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
