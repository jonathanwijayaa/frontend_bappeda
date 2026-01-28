import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    name: string;
    role: 'super_admin' | 'opd';
    roleDisplay: string;
    avatar: string;
}

interface AuthContextType {
    user: User;
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
    const [user, setUser] = useState<User>(() => {
        // Load user from localStorage or default to Super Admin
        const savedUser = localStorage.getItem('currentUser');
        return savedUser ? JSON.parse(savedUser) : {
            name: 'Amelia',
            role: 'super_admin',
            roleDisplay: 'Super Admin',
            avatar: 'https://ui-avatars.com/api/?name=Amelia&background=10B981&color=fff'
        };
    });

    useEffect(() => {
        // Save user to localStorage whenever it changes
        localStorage.setItem('currentUser', JSON.stringify(user));
    }, [user]);

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
        switchUser,
        isSuperAdmin: user.role === 'super_admin',
        isOPD: user.role === 'opd'
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
