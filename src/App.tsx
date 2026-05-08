//App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ManajemenOPD from './pages/ManajemenOPD';
import DaftarKader from './pages/DaftarKader';
import DataRelawan from './pages/DataRelawan';
import SuratKeputusan from './pages/SuratKeputusan';
import LogAktifitas from './pages/LogAktifitas';
import Statistik from './pages/Statistik';
import Dokumen from './pages/Dokumen';
import SaranHotline from './pages/SaranHotline';
import Profil from './pages/Profil';
import ProfilRelawan from './pages/ProfilRelawan';
import Riwayat from './pages/Riwayat';
import KomunitasSaya from './pages/KomunitasSaya';
import HistoriRelawan from './pages/HistoriRelawan';
import UbahPassword from './pages/UbahPassword';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import { ReactNode } from 'react';

// Protected Route Component (Langsung ke Page Login kalau belum login)
const ProtectedRoute = ({ children, allowedRoles }: { children: ReactNode, allowedRoles?: string[] }) => {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles) {
        if (!user) {
            return <Navigate to="/login" replace />;
        }
        
        const userRole = user.role.toLowerCase();
        if (!allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
            // Redirect to unauthorized page if they try to access a route they don't have permission for
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return <>{children}</>;
};

// Public Route Component (Langsung ke Dashboard kalau sudah login)
const PublicRoute = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, user } = useAuth();

    if (isAuthenticated) {
        // Redirect relawan to their profile page
        if (user?.role?.toLowerCase() === 'relawan') {
            return <Navigate to="/profil-relawan" replace />;
        }
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

// Component to redirect based on user role
const RelawanRedirect = () => {
    const { user } = useAuth();

    if (user?.role?.toLowerCase() === 'relawan') {
        return <Navigate to="/profil-relawan" replace />;
    }

    return (
        <Layout>
            <Navigate to="/dashboard" replace />
        </Layout>
    );
};

// Wrapper to conditionally apply Layout for non-relawan users
const SaranHotlineWrapper = () => {
    const { user } = useAuth();

    if (user?.role?.toLowerCase() === 'relawan') {
        return <SaranHotline />;
    }

    return (
        <Layout>
            <SaranHotline />
        </Layout>
    );
};

function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={
                <PublicRoute>
                    <Login />
                </PublicRoute>
            } />

            {/* Protected Routes */}
            <Route path="/" element={
                <ProtectedRoute>
                    <RelawanRedirect />
                </ProtectedRoute>
            } />
            <Route path="/unauthorized" element={
                <ProtectedRoute>
                    <Unauthorized />
                </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['super_admin', 'opd']}>
                    <Layout>
                        <Dashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/manajemen-opd" element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                    <Layout>
                        <ManajemenOPD />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/daftar-kader" element={
                <ProtectedRoute allowedRoles={['super_admin', 'opd']}>
                    <Layout>
                        <DaftarKader />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/data-relawan" element={
                <ProtectedRoute allowedRoles={['super_admin', 'opd']}>
                    <Layout>
                        <DataRelawan />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/surat-keputusan" element={
                <ProtectedRoute allowedRoles={['super_admin', 'opd']}>
                    <Layout>
                        <SuratKeputusan />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/log-aktifitas" element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                    <Layout>
                        <LogAktifitas />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/statistik" element={
                <ProtectedRoute allowedRoles={['super_admin', 'opd']}>
                    <Layout>
                        <Statistik />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/dokumen" element={
                <ProtectedRoute allowedRoles={['super_admin', 'opd']}>
                    <Layout>
                        <Dokumen />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/histori-relawan" element={
                <ProtectedRoute allowedRoles={['super_admin', 'opd']}>
                    <Layout>
                        <HistoriRelawan />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/saran-hotline" element={
                <ProtectedRoute>
                    <SaranHotlineWrapper />
                </ProtectedRoute>
            } />
            <Route path="/komunitas-saya" element={
                <ProtectedRoute allowedRoles={['relawan']}>
                    <KomunitasSaya />
                </ProtectedRoute>
            } />
            <Route path="/profil-relawan" element={
                <ProtectedRoute allowedRoles={['relawan']}>
                    <ProfilRelawan />
                </ProtectedRoute>
            } />
            <Route path="/riwayat" element={
                <ProtectedRoute allowedRoles={['relawan']}>
                    <Riwayat />
                </ProtectedRoute>
            } />
            <Route path="/ubah-password" element={
                <ProtectedRoute allowedRoles={['relawan']}>
                    <UbahPassword />
                </ProtectedRoute>
            } />
            <Route path="/profil" element={
                <ProtectedRoute allowedRoles={['super_admin', 'opd']}>
                    <Layout>
                        <Profil />
                    </Layout>
                </ProtectedRoute>
            } />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppRoutes />
            </Router>
        </AuthProvider>
    );
}

export default App;
