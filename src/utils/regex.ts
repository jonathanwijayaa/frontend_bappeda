// src/utils/regex.ts

export const REGEX_PATTERNS = {
    // 1. NAMA: Hanya huruf, spasi, koma(,), titik(.), petik satu('), dan strip(-)
    NAMA_RELAWAN: /^[a-zA-Z\s.,'-]+$/,
    
    // 2. NIK: Tepat 16 digit angka murni
    NIK: /^\d{16}$/,
    
    // 3. ALAMAT: Hanya boleh huruf, angka, spasi, dan .,/#-
    ALAMAT_VALID: /^[a-zA-Z0-9\s.,\/#-]+$/,
    ALAMAT_ANGKA_SAJA: /^\d+$/,
    
    // 4. NOMOR TELEPON: Diawali +628 atau 08, diikuti angka, total panjang 9-13 digit
    // Catatan: Karena tanda minus (-) sudah di-handle di tempat lain, regex ini mendeteksi string bersihnya
    NO_HP: /^(?:\+62|0)8[0-9]{7,11}$/,
    
    // Helper deteksi error spesifik untuk nomor HP
    HAS_LETTERS: /[a-zA-Z]/,
    // Mengizinkan angka, tanda tambah (+), spasi (\s), dan strip (-) untuk pengecekan karakter ilegal
    HAS_ILLEGAL_SPECIAL_CHAR: /[^0-9+\s-]/, 

    // Nama OPD hanya boleh huruf dan spasi (untuk validasi form OPD)
    NAMA_OPD: /^[a-zA-Z\s]+$/
};