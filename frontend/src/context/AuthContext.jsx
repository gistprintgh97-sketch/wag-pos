import { createContext, useContext, useState, useEffect } from "react";
import API from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
   const saved = localStorage.getItem("wag_user");
if (!saved || saved === "undefined") return null;
try {
  return JSON.parse(saved);
} catch {
  return null;
}
  });
  const [tenant, setTenant] = useState(() => {
    const saved = localStorage.getItem("wag_tenant");
    if (!saved || saved === "undefined") return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem("wag_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await API.get("/tenants/me");
        setTenant(res.data);
        // Extract user from token payload (simpler than extra API call)
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({ id: payload.id, name: payload.name, role: payload.role });
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []);

  const login = async (slug, pin) => {
    try {
      const res = await API.post("/tenants/login", { slug, pin });
      const data = res.data;
      
      // API returns: { id, name, role, tenant, token }
      const userData = { id: data.id, name: data.name, role: data.role };
      const tenantData = data.tenant;
      const token = data.token;

      localStorage.setItem("wag_token", token);
      localStorage.setItem("wag_user", JSON.stringify(userData));
      localStorage.setItem("wag_tenant", JSON.stringify(tenantData));

      setUser(userData);
      setTenant(tenantData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed"
      };
    }
  };

  const register = async (data) => {
    try {
      const res = await API.post("/tenants/register", data);
      const { token, user: userData, tenant: tenantData } = res.data;

      localStorage.setItem("wag_token", token);
      localStorage.setItem("wag_user", JSON.stringify(userData));
      localStorage.setItem("wag_tenant", JSON.stringify(tenantData));

      setUser(userData);
      setTenant(tenantData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed"
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("wag_token");
    localStorage.removeItem("wag_user");
    localStorage.removeItem("wag_tenant");
    setUser(null);
    setTenant(null);
  };

  const isAuthenticated = !!user && !!tenant;

  return (
    <AuthContext.Provider value={{
      user,
      tenant,
      isAuthenticated,
      loading,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
