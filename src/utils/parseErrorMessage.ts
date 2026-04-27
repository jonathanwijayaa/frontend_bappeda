// utils/parseErrorMessage.ts
// Helper terpusat: ubah error API → pesan yang ramah & spesifik untuk user

/**
 * Mengekstrak pesan error yang spesifik dari berbagai bentuk error response API.
 * Mendeteksi kondisi umum seperti duplikat data, koneksi gagal, validasi, dll.
 */
export function parseErrorMessage(e: any, fallback = 'Terjadi kesalahan, silakan coba lagi'): string {
    // Ambil pesan dari berbagai struktur response
    const data = e?.response?.data;
    const status = e?.response?.status;

    // ── Pesan langsung dari backend ──────────────────────────────────
    const rawMsg: string =
        data?.message ||
        data?.error ||
        data?.detail ||
        e?.message ||
        '';

    // ── Deteksi duplikat data (PostgreSQL unique violation = code 23505) ──
    const isDuplicate =
        status === 409 ||
        data?.code === '23505' ||
        /duplikat|duplicate|sudah (ada|terdaftar|digunakan)|already exist|unique.*violat|violat.*unique/i.test(rawMsg);

    if (isDuplicate) {
        // Coba ekstrak field yang duplikat dari pesan backend
        const nikMatch = rawMsg.match(/nik/i);
        const emailMatch = rawMsg.match(/email/i);
        const namaMatch = rawMsg.match(/nama/i);
        const nomorSkMatch = rawMsg.match(/nomor[_\s]?sk|sk/i);

        if (nikMatch) return 'Data duplikat: NIK sudah terdaftar dalam sistem.';
        if (emailMatch) return 'Data duplikat: Email sudah digunakan akun lain.';
        if (nomorSkMatch) return 'Data duplikat: Nomor SK sudah ada dalam sistem.';
        if (namaMatch) return 'Data duplikat: Nama ini sudah terdaftar.';
        return 'Data duplikat: Data yang Anda masukkan sudah ada dalam sistem.';
    }

    // ── Not Found ────────────────────────────────────────────────────
    if (status === 404) {
        return rawMsg || 'Data tidak ditemukan.';
    }

    // ── Unauthorized / Forbidden ─────────────────────────────────────
    if (status === 401) return 'Sesi telah berakhir, silakan login kembali.';
    if (status === 403) return 'Anda tidak memiliki izin untuk melakukan tindakan ini.';

    // ── Validasi dari backend ────────────────────────────────────────
    if (status === 400 || status === 422) {
        if (rawMsg) return rawMsg;
        // Jika ada array errors dari backend (misal dari express-validator)
        if (Array.isArray(data?.errors) && data.errors.length > 0) {
            const first = data.errors[0];
            return typeof first === 'string' ? first : first?.msg || first?.message || fallback;
        }
        return 'Data yang dikirim tidak valid, periksa kembali isian Anda.';
    }

    // ── Server Error ─────────────────────────────────────────────────
    if (status >= 500) {
        return 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.';
    }

    // ── Network / No Response ────────────────────────────────────────
    if (!e?.response) {
        return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
    }

    // ── Fallback: gunakan pesan dari backend jika ada ────────────────
    return rawMsg || fallback;
}
