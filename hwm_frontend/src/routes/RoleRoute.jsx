import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getRole, subscribeStorage } from "../utils/auth";

const RoleRoute = ({ role, children }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = () => {
      const userRole = getRole();
      console.log(`👥 RoleRoute checking role. Required: ${role}, Found: ${userRole}`);
      setIsAuthorized(userRole === role);
      setLoading(false);
    };

    check();
    const unsubscribe = subscribeStorage(() => check());
    return unsubscribe;
  }, [role]);

  if (loading) {
    return <div>Verifying access...</div>;
  }

  if (!isAuthorized) {
    const userRole = localStorage.getItem("role");
    console.log(`❌ RoleRoute: User role '${userRole}' does not match required role '${role}', redirecting`);
    return <Navigate to="/login" replace />;
  }

  console.log(`✅ RoleRoute: User role '${role}' authorized, rendering children`);
  return children;
};

export default RoleRoute;
