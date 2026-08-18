/**
 * helpers/validators/validateRelawan.ts
 * Validasi form Relawan — diekstrak dari DataRelawan.tsx
 */
import { REGEX_PATTERNS } from "../../utils/regex";
import type { Assignment } from "../../types/relawan.types";

interface RelawanFormPayload {
  alamat: string;
  assignments: Assignment[];
  jenisKelamin: string;
  kelurahan: string;
  kemantren: string;
  namaRelawan: string;
  nik: string;
  no_hp: string;
}

/**
 * Validasi payload form relawan baru.
 * @returns pesan error jika invalid, null jika valid.
 */
export const validateRelawanForm = (payload: RelawanFormPayload): string | null => {
  if (
    !payload.namaRelawan.trim() ||
    !payload.nik.trim() ||
    !payload.alamat.trim() ||
    !payload.no_hp.trim() ||
    !payload.kemantren.trim() ||
    !payload.kelurahan.trim()
  ) {
    return "Semua data pribadi wajib diisi";
  }

  if (payload.namaRelawan.trim().length < 3) {
    return "Nama Lengkap minimal 3 karakter";
  }
  if (!REGEX_PATTERNS.NAMA_RELAWAN.test(payload.namaRelawan)) {
    return "Nama Lengkap tidak boleh mengandung angka atau karakter spesial";
  }
  if (!REGEX_PATTERNS.NIK.test(payload.nik)) {
    return "NIK harus terdiri dari tepat 16 digit angka";
  }

  const hasInvalidAssignment = payload.assignments.some(
    (a) => !a.opd || !a.kader || !a.peran || !a.penugasan || !a.detail,
  );
  if (hasInvalidAssignment) {
    return "Semua kolom pada setiap penugasan wajib diisi.";
  }

  return null;
};

/**
 * Validasi edit relawan (modal detail).
 */
export const validateRelawanEditForm = (payload: {
  namaRelawan: string;
}): string | null => {
  if (!payload.namaRelawan.trim() || payload.namaRelawan.trim().length < 3) {
    return "Nama Lengkap minimal 3 karakter";
  }
  if (!/^[a-zA-Z\s]+$/.test(payload.namaRelawan)) {
    return "Nama Lengkap tidak boleh mengandung angka atau karakter spesial";
  }
  return null;
};
