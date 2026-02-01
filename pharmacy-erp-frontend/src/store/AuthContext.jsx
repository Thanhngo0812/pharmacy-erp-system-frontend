import { createContext, useEffect, useState } from "react";
import { AuthService } from "../services/authService";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      const parsed = JSON.parse(saved);

      if (AuthService.checkValidToken()) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(parsed);
      } else {
        AuthService.logout();
        setUser(null);
      }
    }
    setLoading(false)
  }, []);

  const login = async (userData) => {
    const result = await AuthService.login(userData);
    if (result) {
      setUser(result);
    }
    return result;
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  const checkValidToken = () => {
    return AuthService.checkValidToken();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, checkValidToken, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
