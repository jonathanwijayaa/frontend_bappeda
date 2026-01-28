import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ManajemenOPD from './pages/ManajemenOPD';
import DaftarKader from './pages/DaftarKader';
import DataRelawan from './pages/DataRelawan';
import SuratKeputusan from './pages/SuratKeputusan';
import LogAktifitas from './pages/LogAktifitas';
import Statistik from './pages/Statistik';
import SaranHotline from './pages/SaranHotline';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/manajemen-opd" element={<ManajemenOPD />} />
                        <Route path="/daftar-kader" element={<DaftarKader />} />
                        <Route path="/data-relawan" element={<DataRelawan />} />
                        <Route path="/surat-keputusan" element={<SuratKeputusan />} />
                        <Route path="/log-aktifitas" element={<LogAktifitas />} />
                        <Route path="/statistik" element={<Statistik />} />
                        <Route path="/saran-hotline" element={<SaranHotline />} />
                    </Routes>
                </Layout>
            </Router>
        </AuthProvider>
    );
}

export default App;
