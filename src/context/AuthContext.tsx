import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    name: string;
    role: 'super_admin' | 'opd';
    roleDisplay: string;
    avatar: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (nik: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
    switchUser: (userType: 'super_admin' | 'opd') => void;
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

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(() => {
        // Load user localStorage
        const savedUser = localStorage.getItem('currentUser');
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        return savedUser && isAuthenticated ? JSON.parse(savedUser) : null;
    });

    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return localStorage.getItem('isAuthenticated') === 'true';
    });

    useEffect(() => {
        // Save user ke localStorage
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('currentUser');
        }
    }, [user]);

    useEffect(() => {
        // Save authentication state
        localStorage.setItem('isAuthenticated', isAuthenticated.toString());
    }, [isAuthenticated]);

    // Mock login function - digantiu dengan backend API call
    const login = async (nik: string, password: string): Promise<{ success: boolean; message?: string }> => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock credentials - ganti sama qutentikasi asli back end
        const mockCredentials = [
            {
                nik: '123456', password: 'admin123', user: {
                    name: 'Amelia',
                    role: 'super_admin' as const,
                    roleDisplay: 'Super Admin',
                    avatar: 'https://ui-avatars.com/api/?name=Amelia&background=10B981&color=fff'
                }
            },
            {
                nik: '654321', password: 'opd123', user: {
                    name: 'Jonathan',
                    role: 'opd' as const,
                    roleDisplay: 'OPD',
                    avatar: 'https://ui-avatars.com/api/?name=Jonathan&background=3B82F6&color=fff'
                }
            }
        ];

        const credential = mockCredentials.find(c => c.nik === nik && c.password === password);

        if (credential) {
            setUser(credential.user);
            setIsAuthenticated(true);
            return { success: true };
        } else {
            return { success: false, message: 'NIK atau password salah' };
        }
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('currentUser');
        localStorage.setItem('isAuthenticated', 'false');
    };

    const switchUser = (userType: 'super_admin' | 'opd') => {
        if (userType === 'super_admin') {
            setUser({
                name: 'Amelia',
                role: 'super_admin',
                roleDisplay: 'Super Admin',
                avatar: 'https://ui-avatars.com/api/?name=Amelia&background=10B981&color=fff'
            });
        } else if (userType === 'opd') {
            setUser({
                name: 'Jonathan',
                role: 'opd',
                roleDisplay: 'OPD',
                avatar: 'https://ui-avatars.com/api/?name=Jonathan&background=3B82F6&color=fff'
            });
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated,
        login,
        logout,
        switchUser,
        isSuperAdmin: user?.role === 'super_admin',
        isOPD: user?.role === 'opd'
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
