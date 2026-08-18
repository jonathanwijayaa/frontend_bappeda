/**
 * helpers/validators/validateKader.ts
 * Validasi form Kader — diekstrak dari DaftarKader.tsx
 */
import { REGEX_PATTERNS } from "../../utils/regex";

interface KaderFormPayload {
  alamat_pic: string;
  deskripsi: string;
  kelurahan_pic: string;
  kemantren_pic: string;
  nama_kader: string;
  nama_pic: string;
  nik_pic: string;
  no_hp_pic: string;
  opd_id: number;
}

interface ValidateKaderOptions {
  /** true jika user adalah Super Admin (wajib pilih OPD) */
  isSuperAdmin: boolean;
  /** daftar nama kader yang sudah ada (untuk cek duplikasi) */
  existingNames?: string[];
}

/**
 * Validasi payload form kader baru.
 * @returns pesan error jika invalid, null jika valid.
 */
export const validateKaderForm = (
  payload: KaderFormPayload,
  options: ValidateKaderOptions,
): string | null => {
  // A. Validasi isian kosong
  if (
    !payload.nama_kader.trim() ||
    !payload.deskripsi.trim() ||
    !payload.nama_pic.trim() ||
    !payload.nik_pic.trim() ||
    !payload.alamat_pic.trim() ||
    !payload.kemantren_pic.trim() ||
    !payload.kelurahan_pic.trim() ||
    !payload.no_hp_pic.trim()
  ) {
    return "Semua field wajib diisi";
  }

  // B. Validasi nama kader
  const normalizedNamaKader = payload.nama_kader.trim();
  if (normalizedNamaKader.length < 3) return "Nama Kader minimal 3 karakter";
  if (normalizedNamaKader.length > 100) return "Nama Kader terlalu panjang (maks 100 karakter)";
  if (!REGEX_PATTERNS.NAMA_RELAWAN.test(normalizedNamaKader)) {
    return "Nama Kader tidak boleh mengandung angka atau karakter spesial selain (, . ' -)";
  }

  // C. Cek duplikasi
  if (options.existingNames?.some((n) => n.toLowerCase() === normalizedNamaKader.toLowerCase())) {
    return "Nama Kader sudah terdaftar";
  }

  // D. OPD wajib untuk Super Admin
  if (options.isSuperAdmin && !payload.opd_id) {
    return "Pilih OPD yang valid dari daftar";
  }

  // E. Validasi nama PIC
  const namaPicTrimmed = payload.nama_pic.trim();
  if (namaPicTrimmed.length < 3) return "Nama PIC minimal 3 karakter";
  if (namaPicTrimmed.length > 100) return "Nama PIC terlalu panjang (maks 100 karakter)";
  if (!REGEX_PATTERNS.NAMA_RELAWAN.test(namaPicTrimmed)) {
    return "Nama PIC tidak boleh mengandung angka atau karakter spesial selain (, . ' -)";
  }

  // F. Validasi NIK PIC
  if (!REGEX_PATTERNS.NIK.test(payload.nik_pic.trim())) {
    return "NIK PIC harus tepat 16 digit angka (tanpa huruf atau spasi)";
  }

  // G. Validasi alamat PIC
  const alamatPicTrimmed = payload.alamat_pic.trim();
  if (alamatPicTrimmed.length < 10) return "Alamat PIC terlalu pendek (minimal 10 karakter)";
  if (alamatPicTrimmed.length > 100) return "Alamat PIC terlalu panjang (maksimal 100 karakter)";
  if (REGEX_PATTERNS.ALAMAT_ANGKA_SAJA.test(alamatPicTrimmed)) {
    return "Alamat PIC tidak boleh hanya berisi angka";
  }
  if (!REGEX_PATTERNS.ALAMAT_VALID.test(alamatPicTrimmed)) {
    return "Alamat PIC hanya boleh berisi huruf, angka, spasi, dan karakter .,/#-";
  }

  // H. Validasi nomor telepon PIC
  const phonePicTrimmed = payload.no_hp_pic.trim();
  if (REGEX_PATTERNS.HAS_LETTERS.test(phonePicTrimmed)) {
    return "Nomor telepon PIC tidak boleh mengandung huruf";
  }
  if (REGEX_PATTERNS.HAS_ILLEGAL_SPECIAL_CHAR.test(phonePicTrimmed)) {
    return "Nomor telepon PIC tidak boleh mengandung karakter spesial";
  }
  if (!REGEX_PATTERNS.NO_HP.test(phonePicTrimmed)) {
    const digitCount = phonePicTrimmed.replace(/\D/g, "").length;
    if (digitCount < 9) return "Nomor telepon PIC terlalu pendek (minimal 9 digit)";
    if (digitCount > 13) return "Nomor telepon PIC terlalu panjang (maksimal 13 digit)";
    return "Format nomor telepon PIC wajib diawali 08 atau +628";
  }

  return null;
};

/**
 * Validasi detail form kader (edit).
 */
export const validateKaderDetailForm = (payload: {
  deskripsi: string;
  nama_kader: string;
}): string | null => {
  if (!payload.nama_kader.trim() || !payload.deskripsi.trim()) {
    return "Semua field wajib diisi";
  }
  const normalized = payload.nama_kader.trim();
  if (normalized.length < 3) return "Nama Kader minimal 3 karakter";
  if (normalized.length > 100) return "Nama Kader terlalu panjang (maks 100 karakter)";
  if (!REGEX_PATTERNS.NAMA_RELAWAN.test(normalized)) {
    return "Nama Kader tidak boleh mengandung angka atau karakter spesial selain (, . ' -)";
  }
  return null;
};
