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
import saranRoutes from './src/routes/saranRoutes';
import komunitasRoutes from './src/routes/komunitasRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// === MIDDLEWARE DASAR ===
app.use(cors({
    origin: [
        /^http:\/\/localhost:\d+$/,     // Izinkan semua port di localhost (contoh: localhost:3000, localhost:5173)
        /^http:\/\/127\.0\.0\.1:\d+$/,  // Izinkan juga kalau pakai IP lokal 127.0.0.1
        'https://frontend-bappeda.vercel.app' // link vercel
    ],
    credentials: true // Wajib ditambah kalau API kamu pakai token/cookies untuk login
}));                   // Izinkan frontend akses API
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

// 6. Saran Routes
app.use('/api/saran', saranRoutes);

// 7. Komunitas Routes
app.use('/api/kader', komunitasRoutes);

// === TEST ENDPOINT ===
app.get('/', (req, res) => {
    res.json({ message: '🚀 Backend Bappeda API berjalan!' });
});

// === JALANKAN SERVER ===
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    =============================================
    ✅ Server berhasil dijalankan!
    📍 Port: ${PORT}
    🏠 Host: 0.0.0.0
    🔗 Health Check: http://localhost:${PORT}/
    =============================================
    `);
});