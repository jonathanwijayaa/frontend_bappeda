import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import semua Route
import authRoutes from './src/routes/authRoutes';
import dashboardRoutes from './src/routes/dashboardRoutes';
import opdRoutes from './src/routes/opdRoutes';
import opdAdminRoutes from './src/routes/opdAdminRoutes';
import relawanAdminRoutes from './src/routes/relawanAdminRoutes';
import relawanRoutes from './src/routes/relawanRoutes';
import skRoutes from './src/routes/skRoutes';
import bpjsRoutes from './src/routes/bpjsRoutes';
import logRoutes from './src/routes/logRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// === MIDDLEWARE DASAR ===
app.use(cors());                   // Izinkan frontend akses API
app.use(express.json());           // Parse body JSON dari request

// === DAFTARKAN SEMUA ROUTE ===

// 1. Auth (Login & Register) - Publik
app.use('/api/auth', authRoutes);

// 2. Super Admin Routes
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/relawan', relawanAdminRoutes);
app.use('/api/admin/sk', skRoutes);
app.use('/api/admin/logs', logRoutes);

// 3. OPD Routes
app.use('/api/opd', opdRoutes);
app.use('/api/opd-admin', opdAdminRoutes);

// 4. Relawan Routes
app.use('/api/relawan', relawanRoutes);

// 5. BPJS Routes
app.use('/api/bpjs', bpjsRoutes);

// === TEST ENDPOINT ===
app.get('/', (req, res) => {
    res.json({ message: '🚀 Backend Bappeda API berjalan!' });
});

// === JALANKAN SERVER ===
app.listen(PORT, () => {
    console.log(`✅ Server berjalan di http://localhost:${PORT}`);
});
