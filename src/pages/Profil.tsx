// Profil.tsx — Halaman Profil (Super Admin & OPD)
// Terhubung ke API: GET /profile/me, PUT /profile/update, PATCH /profile/change-password
import React, { useState, useEffect, useCallback } from 'react';
import { Camera, Trash2, Loader2, User, Lock, CheckCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Toast, { ToastType } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

interface ProfileData {
    user_id: number;
    nik: string;
    nama_lengkap: string;
    no_hp: string | null;
    email: string | null;
    role: string;
}

const Profil: React.FC = () => {
    const { user } = useAuth();

    // ── State ──────────────────────────────────────────────────────────────────
    const [profileData, setProfileData]   = useState<ProfileData | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSavingProfile, setIsSavingProfile]   = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    // Form edit profil
    const [formData, setFormData] = useState({ nama_lengkap: '', no_hp: '' });

    // Form ganti password
    const [passwordData, setPasswordData] = useState({
        password_lama: '',
        password_baru: '',
        konfirmasi: ''
    });

    const [avatarPreview, setAvatarPreview] = useState<string>(
        user?.avatar || 'https://ui-avatars.com/api/?name=User&background=gray&color=fff'
    );

    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // ── Fetch profil dari database ─────────────────────────────────────────────
    const fetchProfile = useCallback(async () => {
        setIsLoadingProfile(true);
        try {
            const res    = await apiFetch('/profile/me');
            const result = await res.json();
            if (result.success) {
                const data: ProfileData = result.data;
                setProfileData(data);
                setFormData({
                    nama_lengkap: data.nama_lengkap || '',
                    no_hp:        data.no_hp || ''
                });
                // Update avatar dengan nama dari database
                setAvatarPreview(
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nama_lengkap)}&background=${
                        data.role === 'super_admin' ? '10B981' : data.role === 'opd' ? '3B82F6' : '6B7280'
                    }&color=fff`
                );
            } else {
                setToast({ message: result.message || 'Gagal memuat profil', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsLoadingProfile(false);
        }
    }, []);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    // ── Handler avatar (preview lokal) ─────────────────────────────────────────
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setAvatarPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteAvatar = () => {
        setAvatarPreview(
            `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.nama_lengkap || 'User')}&background=gray&color=fff`
        );
    };

    // ── Simpan perubahan profil ────────────────────────────────────────────────
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nama_lengkap.trim()) {
            setToast({ message: 'Nama lengkap tidak boleh kosong', type: 'error' });
            return;
        }

        setIsSavingProfile(true);
        try {
            const res = await apiFetch('/profile/update', {
                method: 'PUT',
                body: JSON.stringify({
                    nama_lengkap: formData.nama_lengkap.trim(),
                    no_hp:        formData.no_hp.trim() || null
                })
            });
            const result = await res.json();
            if (result.success) {
                setToast({ message: 'Profil berhasil diperbarui', type: 'success' });
                await fetchProfile();
            } else {
                setToast({ message: result.message || 'Gagal menyimpan profil', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsSavingProfile(false);
        }
    };

    // ── Ganti password ────────────────────────────────────────────────────────
    const handleSavePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validasi
        if (!passwordData.password_lama || !passwordData.password_baru || !passwordData.konfirmasi) {
            setToast({ message: 'Semua kolom password wajib diisi', type: 'error' });
            return;
        }
        if (passwordData.password_baru !== passwordData.konfirmasi) {
            setToast({ message: 'Password baru dan konfirmasi tidak cocok', type: 'error' });
            return;
        }
        if (passwordData.password_baru.length < 6) {
            setToast({ message: 'Password baru minimal 6 karakter', type: 'error' });
            return;
        }

        setIsSavingPassword(true);
        try {
            const res = await apiFetch('/profile/change-password', {
                method: 'PATCH',
                body: JSON.stringify({
                    password_lama: passwordData.password_lama,
                    password_baru: passwordData.password_baru
                })
            });
            const result = await res.json();
            if (result.success) {
                setToast({ message: 'Password berhasil diubah', type: 'success' });
                setPasswordData({ password_lama: '', password_baru: '', konfirmasi: '' });
            } else {
                setToast({ message: result.message || 'Gagal mengubah password', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsSavingPassword(false);
        }
    };

    // ── Loading state ──────────────────────────────────────────────────────────
    if (isLoadingProfile) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 size={32} className="animate-spin text-green-500" />
                <span className="ml-3 text-gray-500">Memuat profil...</span>
            </div>
        );
    }

    // ── Helper: label role ─────────────────────────────────────────────────────
    const roleLabel = profileData?.role === 'super_admin' ? 'Super Admin'
                    : profileData?.role === 'opd'         ? 'OPD'
                    : profileData?.role || '-';

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── Bagian Kiri: Avatar & Info Ringkas ── */}
                <div className="lg:col-span-1">
                    <Card>
                        <div className="flex flex-col items-center space-y-4 py-2">
                            {/* Avatar */}
                            <div className="relative">
                                <img
                                    src={avatarPreview}
                                    alt="Foto Profil"
                                    className="w-36 h-36 rounded-full object-cover ring-4 ring-green-100"
                                />
                            </div>

                            {/* Nama & Role */}
                            <div className="text-center">
                                <p className="font-semibold text-gray-800 text-lg leading-tight">{profileData?.nama_lengkap || '-'}</p>
                                <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-medium ${
                                    profileData?.role === 'super_admin' ? 'bg-green-100 text-green-700' :
                                    profileData?.role === 'opd'         ? 'bg-blue-100 text-blue-700'  :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                    {roleLabel}
                                </span>
                            </div>

                            {/* Tombol avatar */}
                            <div className="flex gap-3 pt-2">
                                <label className="cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                        <Camera size={16} />
                                        Ganti Foto
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

                            {/* NIK (read-only) */}
                            <div className="w-full pt-2 border-t border-gray-100">
                                <p className="text-xs text-gray-400 text-center mb-1">NIK</p>
                                <p className="text-sm font-mono text-center text-gray-700 tracking-wider">{profileData?.nik || '-'}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ── Bagian Kanan: Form ── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Form Informasi Pribadi */}
                    <Card>
                        <div className="flex items-center gap-2 mb-6">
                            <User size={20} className="text-green-500" />
                            <h3 className="text-lg font-semibold text-gray-800">Informasi Pribadi</h3>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            {/* Nama Lengkap */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Lengkap <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.nama_lengkap}
                                    onChange={e => setFormData(prev => ({ ...prev, nama_lengkap: e.target.value }))}
                                    placeholder="Masukkan nama lengkap"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                    required
                                />
                            </div>

                            {/* NIK — read only */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    NIK
                                    <span className="ml-2 text-xs text-gray-400 font-normal">(tidak dapat diubah)</span>
                                </label>
                                <input
                                    type="text"
                                    value={profileData?.nik || ''}
                                    disabled
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed font-mono tracking-wider"
                                />
                            </div>

                            {/* No. HP */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    No. Telepon / HP
                                </label>
                                <input
                                    type="tel"
                                    value={formData.no_hp}
                                    onChange={e => setFormData(prev => ({ ...prev, no_hp: e.target.value }))}
                                    placeholder="Contoh: 08123456789"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                />
                            </div>

                            {/* Role — read only */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role
                                </label>
                                <input
                                    type="text"
                                    value={roleLabel}
                                    disabled
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                            </div>

                            {/* Tombol Simpan Profil */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSavingProfile}
                                    className="w-full inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                                >
                                    {isSavingProfile ? (
                                        <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
                                    ) : (
                                        <><CheckCircle size={18} /> Simpan Perubahan</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </Card>

                    {/* Form Ganti Password */}
                    <Card>
                        <div className="flex items-center gap-2 mb-6">
                            <Lock size={20} className="text-green-500" />
                            <h3 className="text-lg font-semibold text-gray-800">Ubah Password</h3>
                        </div>

                        <form onSubmit={handleSavePassword} className="space-y-4">
                            {/* Password Lama */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password Saat Ini <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.password_lama}
                                    onChange={e => setPasswordData(prev => ({ ...prev, password_lama: e.target.value }))}
                                    placeholder="Masukkan password saat ini"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                />
                            </div>

                            {/* Password Baru */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password Baru <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.password_baru}
                                    onChange={e => setPasswordData(prev => ({ ...prev, password_baru: e.target.value }))}
                                    placeholder="Minimal 6 karakter"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                                />
                            </div>

                            {/* Konfirmasi Password Baru */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Konfirmasi Password Baru <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.konfirmasi}
                                    onChange={e => setPasswordData(prev => ({ ...prev, konfirmasi: e.target.value }))}
                                    placeholder="Ulangi password baru"
                                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                                        passwordData.konfirmasi && passwordData.password_baru !== passwordData.konfirmasi
                                            ? 'border-red-400 bg-red-50'
                                            : 'border-gray-300'
                                    }`}
                                />
                                {passwordData.konfirmasi && passwordData.password_baru !== passwordData.konfirmasi && (
                                    <p className="mt-1 text-xs text-red-500">Password tidak cocok</p>
                                )}
                            </div>

                            {/* Tombol Ganti Password */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSavingPassword}
                                    className="w-full inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                                >
                                    {isSavingPassword ? (
                                        <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
                                    ) : (
                                        <><Lock size={18} /> Ubah Password</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>

            {/* Toast Notification */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default Profil;