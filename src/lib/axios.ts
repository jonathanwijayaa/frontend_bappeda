/**
 * lib/axios.ts
 * Axios instance tunggal yang menggantikan apiFetch.
 * Otomatis menyisipkan Bearer token & menangani 401 (redirect ke /login).
 */
import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — tambahkan token di setiap request ────
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Response interceptor — tangani 401 global ──────────────────
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            localStorage.setItem('isAuthenticated', 'false');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;
