//AuthContext.tsx
import type { ReactNode } from "react";
import { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../lib/axios";
import queryClient from "../lib/queryClient";

interface User {
  avatar: string;
  nama_opd?: string;
  name: string;
  no_hp?: string;
  opd_id?: number;
  role: "opd" | "relawan" | "super_admin";
  roleDisplay: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isOPD: boolean;
  isSuperAdmin: boolean;
  login: (
    nik: string,
    password: string,
  ) => Promise<{ message?: string; role?: string; success: boolean }>;
  logout: () => void;
  user: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Helper untuk membuat display role
const getRoleDisplay = (role: string): string => {
  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "opd":
      return "OPD";
    case "relawan":
      return "Relawan";
    default:
      return role;
  }
};

// Helper untuk membuat avatar URL
const getAvatarUrl = (name: string, role: string): string => {
  const colors: Record<string, string> = {
    opd: "3B82F6",
    relawan: "F59E0B",
    super_admin: "10B981",
  };
  const bg = colors[role] || "6B7280";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff`;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("currentUser");
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    return savedUser && isAuthenticated ? JSON.parse(savedUser) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("isAuthenticated") === "true";
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("currentUser");
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("isAuthenticated", isAuthenticated.toString());
  }, [isAuthenticated]);

  // Pengecekan Token Expiry secara berkala
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isAuthenticated) {
      const checkTokenExpiry = () => {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            // Decode payload JWT
            const payload = JSON.parse(atob(token.split(".")[1]));
            const expiry = payload.exp * 1000;

            // Jika waktu sekarang melebihi waktu kedaluwarsa token
            if (Date.now() >= expiry) {
              logout();
              window.location.href = "/login?expired=true";
            }
          } catch (error) {
            console.error("Invalid token format");
            logout();
            window.location.href = "/login?expired=true";
          }
        }
      };

      // Cek setiap 1 menit (60000 ms)
      interval = setInterval(checkTokenExpiry, 60000);

      // Cek juga saat pertama kali effect jalan
      checkTokenExpiry();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Login via Backend API
  const login = async (
    nik: string,
    password: string,
  ): Promise<{ message?: string; role?: string; success: boolean }> => {
    try {
      const { data } = await apiClient.post("/auth/login", { nik, password });

      if (data.token) {
        // Simpan JWT token
        localStorage.setItem("token", data.token);

        // Buat user object dari response backend
        const loggedInUser: User = {
          avatar: getAvatarUrl(data.user.nama, data.user.role),
          nama_opd: data.user.nama_opd,
          name: data.user.nama,
          no_hp: data.user.no_hp,
          opd_id: data.user.opd_id,
          role: data.user.role,
          roleDisplay: getRoleDisplay(data.user.role),
        };

        setUser(loggedInUser);
        setIsAuthenticated(true);
        return { role: loggedInUser.role, success: true };
      } else {
        return { message: data.message || "Login gagal", success: false };
      }
    } catch (err: unknown) {
      console.error("Login error:", err);
      const errorMessage =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Tidak dapat terhubung ke server. Pastikan backend berjalan.";
      return { message: errorMessage, success: false };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    localStorage.setItem("isAuthenticated", "false");
    // Bersihkan cache React Query agar data sesi sebelumnya tidak bocor
    queryClient.clear();
  };

  const value: AuthContextType = {
    isAuthenticated,
    isOPD: user?.role === "opd",
    isSuperAdmin: user?.role === "super_admin",
    login,
    logout,
    user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
