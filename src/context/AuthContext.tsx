//AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../lib/axios';
import queryClient from '../lib/queryClient';

interface User {
    name: string;
    role: 'super_admin' | 'opd' | 'relawan';
    roleDisplay: string;
    avatar: string;
    opd_id?: number;
    nama_opd?: string;
    no_hp?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (nik: string, password: string) => Promise<{ success: boolean; message?: string; role?: string }>;
    logout: () => void;
    isSuperAdmin: boolean;
    isOPD: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

// Helper untuk membuat display role
const getRoleDisplay = (role: string): string => {
    switch (role) {
        case 'super_admin': return 'Super Admin';
        case 'opd': return 'OPD';
        case 'relawan': return 'Relawan';
        default: return role;
    }
};

// Helper untuk membuat avatar URL
const getAvatarUrl = (name: string, role: string): string => {
    const colors: Record<string, string> = {
        super_admin: '10B981',
        opd: '3B82F6',
        relawan: 'F59E0B'
    };
    const bg = colors[role] || '6B7280';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff`;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('currentUser');
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        return savedUser && isAuthenticated ? JSON.parse(savedUser) : null;
    });

    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return localStorage.getItem('isAuthenticated') === 'true';
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('currentUser');
        }
    }, [user]);

    useEffect(() => {
        localStorage.setItem('isAuthenticated', isAuthenticated.toString());
    }, [isAuthenticated]);

    // Pengecekan Token Expiry secara berkala
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isAuthenticated) {
            const checkTokenExpiry = () => {
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        // Decode payload JWT
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        const expiry = payload.exp * 1000;

                        // Jika waktu sekarang melebihi waktu kedaluwarsa token
                        if (Date.now() >= expiry) {
                            logout();
                            window.location.href = '/login?expired=true';
                        }
                    } catch (error) {
                        console.error('Invalid token format');
                        logout();
                        window.location.href = '/login?expired=true';
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
    const login = async (nik: string, password: string): Promise<{ success: boolean; message?: string; role?: string }> => {
        try {
            const { data } = await apiClient.post('/auth/login', { nik, password });

            if (data.token) {
                // Simpan JWT token
                localStorage.setItem('token', data.token);

                // Buat user object dari response backend
                const loggedInUser: User = {
                    name: data.user.nama,
                    role: data.user.role,
                    roleDisplay: getRoleDisplay(data.user.role),
                    avatar: getAvatarUrl(data.user.nama, data.user.role),
                    opd_id: data.user.opd_id,
                    nama_opd: data.user.nama_opd,
                    no_hp: data.user.no_hp
                };

                setUser(loggedInUser);
                setIsAuthenticated(true);
                return { success: true, role: loggedInUser.role };
            } else {
                return { success: false, message: data.message || 'Login gagal' };
            }
        } catch (err: any) {
            console.error('Login error:', err);
            const errorMessage = err.response?.data?.message || 'Tidak dapat terhubung ke server. Pastikan backend berjalan.';
            return { success: false, message: errorMessage };
        }
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        localStorage.setItem('isAuthenticated', 'false');
        // Bersihkan cache React Query agar data sesi sebelumnya tidak bocor
        queryClient.clear();
    };

    const value: AuthContextType = {
        user,
        isAuthenticated,
        login,
        logout,
        isSuperAdmin: user?.role === 'super_admin',
        isOPD: user?.role === 'opd'
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
