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
import SaranHotline from './pages/SaranHotline';
import EditProfil from './pages/EditProfil';
import Login from './pages/Login';
import { ReactNode } from 'react';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
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
                    <Layout>
                        <Navigate to="/dashboard" replace />
                    </Layout>
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
            <Route path="/saran-hotline" element={
                <ProtectedRoute>
                    <Layout>
                        <SaranHotline />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/edit-profil" element={
                <ProtectedRoute>
                    <Layout>
                        <EditProfil />
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
