import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

// User type definition
type User = {
  id: number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  profileImageUrl?: string;
  isActive?: boolean;
};

// Authentication context type
type AuthContextType = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: {
    username: string;
    password: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
};

// Create auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  clearError: () => {},
});

// Provider component to wrap the app
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        setToken(storedToken);
        fetchUserData(storedToken);
      } else {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Fetch user data with token
  const fetchUserData = async (authToken: string) => {
    try {
      setIsLoading(true);
      const userData = await apiRequest({
        url: "/api/auth/me",
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      setUser(userData as User);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching user data:", err);
      // Token might be invalid or expired
      logout();
      setIsLoading(false);
    }
  };

  // Login user
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiRequest({
        url: "/api/auth/login",
        method: "POST",
        data: { username, password },
      });
      
      const data = response as { user: User; token: string };
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("token", data.token);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
      setIsLoading(false);
      throw err;
    }
  };

  // Register user
  const register = async (userData: {
    username: string;
    password: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiRequest({
        url: "/api/auth/register",
        method: "POST",
        data: userData,
      });
      
      const data = response as { user: User; token: string };
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("token", data.token);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
      setIsLoading(false);
      throw err;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };

  // Clear error
  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => useContext(AuthContext);