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
import EditProfil from './pages/EditProfil';
import Profil from './pages/Profil';
import ProfilRelawan from './pages/ProfilRelawan';
import Riwayat from './pages/Riwayat';
import KomunitasSaya from './pages/KomunitasSaya';
import Login from './pages/Login';
import { ReactNode } from 'react';

// Protected Route Component (Langsung ke Page Login kalau belum login)
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

// Public Route Component (Langsung ke Dashboard kalau sudah login)
const PublicRoute = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, user } = useAuth();

    if (isAuthenticated) {
        // Redirect relawan to their profile page
        if (user?.role === 'relawan') {
            return <Navigate to="/profil-relawan" replace />;
        }
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

// Component to redirect based on user role
const RelawanRedirect = () => {
    const { user } = useAuth();

    if (user?.role === 'relawan') {
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

    if (user?.role === 'relawan') {
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
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <Layout>
                        <Dashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/manajemen-opd" element={
                <ProtectedRoute>
                    <Layout>
                        <ManajemenOPD />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/daftar-kader" element={
                <ProtectedRoute>
                    <Layout>
                        <DaftarKader />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/data-relawan" element={
                <ProtectedRoute>
                    <Layout>
                        <DataRelawan />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/surat-keputusan" element={
                <ProtectedRoute>
                    <Layout>
                        <SuratKeputusan />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/log-aktifitas" element={
                <ProtectedRoute>
                    <Layout>
                        <LogAktifitas />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/statistik" element={
                <ProtectedRoute>
                    <Layout>
                        <Statistik />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/dokumen" element={
                <ProtectedRoute>
                    <Layout>
                        <Dokumen />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/saran-hotline" element={
                <ProtectedRoute>
                    <SaranHotlineWrapper />
                </ProtectedRoute>
            } />
            <Route path="/edit-profil" element={
                <ProtectedRoute>
                    <Layout>
                        <EditProfil />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/komunitas-saya" element={
                <ProtectedRoute>
                    <KomunitasSaya />
                </ProtectedRoute>
            } />
            <Route path="/profil-relawan" element={
                <ProtectedRoute>
                    <ProfilRelawan />
                </ProtectedRoute>
            } />
            <Route path="/riwayat" element={
                <ProtectedRoute>
                    <Riwayat />
                </ProtectedRoute>
            } />
            <Route path="/profil" element={
                <ProtectedRoute>
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
