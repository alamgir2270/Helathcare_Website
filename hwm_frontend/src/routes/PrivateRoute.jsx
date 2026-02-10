import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getToken, subscribeStorage } from "../utils/auth";

const PrivateRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = () => {
      const token = getToken();
      console.log("🔐 PrivateRoute checking token:", token ? "✓ Found" : "✗ Not found");
      setIsAuthenticated(!!token);
      setLoading(false);
    };

    check();
    const unsubscribe = subscribeStorage(() => check());
    return unsubscribe;
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    console.log("🚫 PrivateRoute: No token, redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  console.log("✅ PrivateRoute: Token valid, rendering children");
  return children;
};

export default PrivateRoute;
