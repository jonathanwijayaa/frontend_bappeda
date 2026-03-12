/**
 * API Helper — Utility untuk berkomunikasi dengan backend.
 * Otomatis menyisipkan JWT token di header Authorization.
 */

const API_BASE = '/api'; // Akan di-proxy oleh Vite ke http://localhost:3000

/**
 * Fungsi utama untuk memanggil API backend.
 * @param endpoint - Path endpoint (contoh: '/auth/login')
 * @param options - Opsi fetch tambahan (method, body, dll.)
 */
export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    const token = localStorage.getItem('token');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Sisipkan token jika ada
    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    // Jika token expired / tidak valid, logout otomatis
    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        localStorage.setItem('isAuthenticated', 'false');
        window.location.href = '/login';
    }

    return response;
};
