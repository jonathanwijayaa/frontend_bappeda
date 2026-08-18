/**
 * helpers/validators/validateOpd.ts
 * Validasi form OPD — diekstrak dari ManajemenOPD.tsx
 */
import { REGEX_PATTERNS } from "../../utils/regex";

interface OpdFormPayload {
  alamat: string;
  kontak: string;
  nama_opd: string;
  nik_pic: string;
  pic: string;
}

/**
 * Validasi payload form OPD.
 * @returns pesan error jika invalid, null jika valid.
 */
export const validateOpdForm = (payload: OpdFormPayload): string | null => {
  if (
    !payload.nama_opd.trim() ||
    !payload.alamat.trim() ||
    !payload.pic.trim() ||
    !payload.nik_pic.trim() ||
    !payload.kontak.trim()
  ) {
    return "Semua field wajib diisi";
  }

  if (payload.nama_opd.trim().length < 3) {
    return "Nama OPD minimal 3 karakter";
  }
  if (payload.nama_opd.trim().length > 100) {
    return "Nama OPD terlalu panjang (maks 100 karakter)";
  }
  if (!REGEX_PATTERNS.NAMA_OPD.test(payload.nama_opd)) {
    return "Nama OPD tidak boleh mengandung angka atau karakter spesial";
  }

  if (payload.alamat && payload.alamat.trim().length > 0) {
    if (payload.alamat.trim().length < 5) {
      return "Alamat OPD minimal 5 karakter";
    }
    if (payload.alamat.trim().length > 255) {
      return "Alamat OPD terlalu panjang (maks 255 karakter)";
    }
    if (REGEX_PATTERNS.ALAMAT_ANGKA_SAJA.test(payload.alamat.trim())) {
      return "Alamat OPD tidak boleh hanya berisi angka";
    }
    if (!REGEX_PATTERNS.ALAMAT_VALID.test(payload.alamat.trim())) {
      return "Alamat OPD tidak boleh mengandung karakter spesial yang tidak valid";
    }
  }

  if (payload.pic && payload.pic.trim().length > 0) {
    if (payload.pic.trim().length < 3) {
      return "Nama PIC minimal 3 karakter";
    }
    if (payload.pic.trim().length > 100) {
      return "Nama PIC terlalu panjang (maks 100 karakter)";
    }
    if (!REGEX_PATTERNS.NAMA_RELAWAN.test(payload.pic)) {
      return "Nama PIC tidak boleh mengandung angka atau karakter spesial";
    }
  }

  if (payload.nik_pic && !REGEX_PATTERNS.NIK.test(payload.nik_pic)) {
    return "NIK PIC harus terdiri dari tepat 16 digit angka";
  }

  // Validasi kontak
  const cleanKontak = payload.kontak.replace(/[\s-]/g, "");
  if (REGEX_PATTERNS.HAS_LETTERS.test(cleanKontak)) {
    return "Nomor kontak tidak boleh mengandung huruf";
  }
  if (!REGEX_PATTERNS.NO_HP.test(cleanKontak)) {
    return "Format nomor kontak tidak valid (harus diawali 08 atau +628, minimal 9-13 digit angka)";
  }

  return null;
};
