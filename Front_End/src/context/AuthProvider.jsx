import { useCallback, useEffect, useState } from "react";

import AuthContext from "./AuthContext";
import { getCurrentUser, logoutUser } from "../services/authServices";

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutMessage, setLogoutMessage] = useState("");
  const clearLogoutMessage = useCallback(() => setLogoutMessage(""), []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await getCurrentUser();

        setUser(data);
      } catch (error) {
        console.error("Failed to load the current user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const isLoggedIn = user !== null;

  const login = (userData) => {
    setLogoutMessage("");
    setUser(userData);
  };

  const logout = async (message) => {
    try {
      await logoutUser();
    } finally {
      setLogoutMessage(typeof message === "string" ? message : "");
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
        logoutMessage,
        clearLogoutMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
