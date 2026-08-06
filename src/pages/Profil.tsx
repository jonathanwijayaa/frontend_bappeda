// Profil.tsx — Halaman Profil (Super Admin & OPD)
// Terhubung ke API: GET /profile/me, PUT /profile/update, PATCH /profile/change-password
import React, { useState, useEffect } from "react";
import { Camera, Trash2, Loader2 } from "lucide-react";
import Card from "../components/ui/Card";
import type { ToastType } from "../components/ui/Toast";
import Toast from "../components/ui/Toast";
import { useAuth } from "../context/AuthContext";
import { useProfileData } from "../hooks/profil/useProfileData";
import { useUpdateProfil, useChangePassword } from "../hooks/profil/useProfilMutations";
import { parseErrorMessage } from "../utils/parseErrorMessage";

const Profil: React.FC = () => {
  const { user } = useAuth();

  // ── Server State ──────────────────────────────────────────
  const { data: profileData, isLoading: isLoadingProfile } = useProfileData();
  const updateProfil = useUpdateProfil();
  const changePassword = useChangePassword();

  // ── UI State ──────────────────────────────────────────────
  const [formData, setFormData] = useState({ nama_lengkap: "", no_hp: "" });
  const [passwordData, setPasswordData] = useState({
    konfirmasiPassword: "",
    passwordBaru: "",
    passwordLama: "",
  });
  const [avatarFile, setAvatarFile] = useState<string | null | undefined>(undefined);
  const [avatarPreview, setAvatarPreview] = useState<string>(
    user?.avatar || "https://ui-avatars.com/api/?name=User&background=gray&color=fff",
  );
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Sync form saat data profil berhasil diload
  useEffect(() => {
    if (profileData) {
      setFormData({
        nama_lengkap: profileData.nama_lengkap || "",
        no_hp: profileData.no_hp || "",
      });
      setAvatarPreview(
        profileData.foto_profil ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.nama_lengkap)}&background=${
            profileData.role === "super_admin"
              ? "10B981"
              : profileData.role === "opd"
                ? "3B82F6"
                : "6B7280"
          }&color=fff`,
      );
    }
  }, [profileData]);

  // ── Handlers ──────────────────────────────────────────────
  // Sinkronkan perubahan input informasi profil ke state form.
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Sinkronkan perubahan input password ke state form.
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  // Baca file avatar baru dan siapkan preview base64 sebelum disimpan.
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        setToast({ message: "Ukuran gambar maksimal 1MB", type: "error" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatarPreview(base64);
        setAvatarFile(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Kembalikan avatar ke placeholder default tanpa foto profil.
  const handleDeleteAvatar = () => {
    setAvatarPreview(
      `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.nama_lengkap || "User")}&background=gray&color=fff`,
    );
    setAvatarFile("");
  };

  // Simpan perubahan profil pribadi ke backend.
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasProfileChanges =
      formData.nama_lengkap.trim() !== (profileData?.nama_lengkap || "") ||
      (formData.no_hp.trim() || "") !== (profileData?.no_hp || "") ||
      avatarFile !== undefined;

    if (!hasProfileChanges) {
      setToast({ message: "Tidak ada data yang disimpan", type: "error" });
      return;
    }
    const cleanedNoHp = formData.no_hp.trim().replace(/\D/g, "");

    if (cleanedNoHp && !/^[0-9]{10,13}$/.test(cleanedNoHp)) {
      setToast({
        message: "Nomor HP tidak valid — harus 10–13 digit angka (contoh: 08123456789)",
        type: "error",
      });
      return;
    }

    try {
      await updateProfil.mutateAsync({
        foto_profil: avatarFile,
        nama_lengkap: formData.nama_lengkap.trim(),
        no_hp: cleanedNoHp || null,
      });
      setToast({ message: "Informasi pribadi berhasil diperbarui!", type: "success" });
    } catch (err: unknown) {
      setToast({ message: parseErrorMessage(err, "Gagal menyimpan perubahan"), type: "error" });
    }
  };

  // Validasi dan simpan perubahan kata sandi akun.
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.passwordLama) {
      setToast({ message: "Password saat ini wajib diisi", type: "error" });
      return;
    }
    if (!passwordData.passwordBaru) {
      setToast({ message: "Password baru wajib diisi", type: "error" });
      return;
    }
    if (!passwordData.konfirmasiPassword) {
      setToast({ message: "Konfirmasi password wajib diisi", type: "error" });
      return;
    }
    if (passwordData.passwordBaru.length < 6) {
      setToast({ message: "Password baru terlalu pendek — minimal 6 karakter", type: "error" });
      return;
    }
    if (passwordData.passwordBaru !== passwordData.konfirmasiPassword) {
      setToast({ message: "Konfirmasi password tidak cocok dengan password baru", type: "error" });
      return;
    }

    try {
      await changePassword.mutateAsync({
        password_baru: passwordData.passwordBaru,
        password_lama: passwordData.passwordLama,
      });
      setToast({ message: "Password berhasil diperbarui!", type: "success" });
      setPasswordData({ konfirmasiPassword: "", passwordBaru: "", passwordLama: "" });
    } catch (err: unknown) {
      setToast({ message: parseErrorMessage(err, "Gagal mengganti password"), type: "error" });
    }
  };

  const isSaving = updateProfil.isPending || changePassword.isPending;

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-green-500" />
        <span className="ml-3 text-gray-500">Memuat profil...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Baris 1: Avatar (kiri) + Informasi Pribadi (kanan) — stretch sejajar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Kolom Kiri – Avatar, tinggi menyesuaikan form Informasi Pribadi */}
        <div className="lg:col-span-1 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <div className="flex flex-col items-center justify-start pt-4 space-y-4">
              <div className="relative">
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="w-40 h-40 rounded-full object-cover ring-4 ring-green-100"
                />
              </div>
              <div className="flex gap-3">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-400 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Camera size={16} />
                    Ganti
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Trash2 size={16} />
                  Hapus
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Kolom Kanan – Form Informasi Pribadi */}
        <div className="lg:col-span-2">
          <form onSubmit={handleProfileSubmit}>
            <Card>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Pribadi</h3>
              <div className="space-y-4">
                {/* Nama Lengkap */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    name="nama_lengkap"
                    value={formData.nama_lengkap}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* NIK (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NIK
                    <span className="ml-2 text-xs text-gray-400 font-normal">
                      (tidak dapat diubah)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={profileData?.nik || ""}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* No. Telepon */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    No. Telepon / HP
                  </label>
                  <input
                    type="tel"
                    name="no_hp"
                    value={formData.no_hp}
                    onChange={handleProfileChange}
                    placeholder="Contoh: 08123456789"
                    className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Tombol Simpan Informasi Pribadi */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    {updateProfil.isPending ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Menyimpan...
                      </>
                    ) : (
                      "Simpan Informasi Pribadi"
                    )}
                  </button>
                </div>
              </div>
            </Card>
          </form>
        </div>
      </div>

      {/* ── Baris 2: Form Ubah Password — sejajar kolom kanan saja (col-start-2) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 lg:col-start-2">
          <form onSubmit={handlePasswordSubmit}>
            <Card>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Ubah Password</h3>
              <div className="space-y-4">
                {/* Password Saat Ini */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password Saat Ini
                  </label>
                  <input
                    type="password"
                    name="passwordLama"
                    value={passwordData.passwordLama}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Password Baru */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password Baru
                  </label>
                  <input
                    type="password"
                    name="passwordBaru"
                    value={passwordData.passwordBaru}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Konfirmasi Password Baru */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Konfirmasi Password Baru
                  </label>
                  <input
                    type="password"
                    name="konfirmasiPassword"
                    value={passwordData.konfirmasiPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Tombol Simpan Password */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    {changePassword.isPending ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Menyimpan...
                      </>
                    ) : (
                      "Simpan Password"
                    )}
                  </button>
                </div>
              </div>
            </Card>
          </form>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Profil;
