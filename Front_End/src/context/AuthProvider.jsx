import { useEffect, useState } from "react";

import AuthContext from "./AuthContext";
import { getCurrentUser, logoutUser } from "../services/authServices";

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const checkAuth = async () => {
      try {
        const data = await getCurrentUser({ signal: controller.signal });
        if (isMounted) setUser(data);
      } catch (error) {
        if (isMounted) setUser(null);
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) setLoading(false);
      }
    };

    checkAuth();
    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  const isLoggedIn = user !== null;

  const refreshUser = async () => {
    try {
      const data = await getCurrentUser();
      setUser(data);
      return data;
    } catch (error) {
      console.error("Failed to refresh user:", error);
      return null;
    }
  };

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
