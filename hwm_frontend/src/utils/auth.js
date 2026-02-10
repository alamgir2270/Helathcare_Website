// Centralized auth helpers to manage token/role/user and headers
export function getToken() {
  return localStorage.getItem("token");
}

export function getRole() {
  const r = localStorage.getItem("role");
  if (r) return r;
  // Try decode from token as fallback
  const token = getToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (payload && payload.role) {
    localStorage.setItem("role", payload.role);
    return payload.role;
  }
  return null;
}

export function getUser() {
  try {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  } catch (e) {
    return null;
  }
}

export function setAuth({ token, user, role }) {
  if (token) localStorage.setItem("token", token);
  if (user) localStorage.setItem("user", JSON.stringify(user));

  // Determine role: prefer explicit param, then user object, then token payload
  let finalRole = role || (user && user.role) || null;
  if (!finalRole && token) {
    const payload = decodeJwtPayload(token);
    if (payload && payload.role) finalRole = payload.role;
  }

  if (finalRole) localStorage.setItem("role", finalRole);
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
}

export function decodeJwtPayload(token) {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch (e) {
    return null;
  }
}

// Returns headers object. If token looks malformed, clears auth and returns minimal headers.
export function getAuthHeaders() {
  const token = getToken();
  const base = { "Content-Type": "application/json" };
  if (!token) return base;

  const payload = decodeJwtPayload(token);
  if (!payload) {
    // malformed token — clear and return minimal headers
    clearAuth();
    return base;
  }

  return { ...base, Authorization: `Bearer ${token}` };
}

// Listen for storage changes (useful for cross-tab logout)
export function subscribeStorage(handler) {
  const cb = (e) => handler(e);
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}
