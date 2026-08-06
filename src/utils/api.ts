/**
 * API Helper — Utility untuk berkomunikasi dengan backend.
 * Otomatis menyisipkan JWT token di header Authorization.
 */

// Pastikan TIDAK ADA '/api' cadangan yang bersifat relatif.
// Kita ingin dia selalu menembak ke domain lengkap Railway.
const API_BASE = import.meta.env.VITE_API_URL;
console.log("Cek API_BASE:", API_BASE);

export const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  // Tambahkan pengecekan jika API_BASE kosong agar tidak error saat dev
  if (!API_BASE) {
    console.warn("Peringatan: VITE_API_URL tidak terdefinisi! Pastikan file .env sudah benar.");
  }

  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  // Gabungkan URL. Pastikan endpoint dimulai dengan '/' atau API_BASE tidak diakhiri '/'
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    localStorage.setItem("isAuthenticated", "false");
    window.location.href = "/login?expired=true";
  }

  return response;
};
