// Profil.tsx — Halaman Profil (Super Admin & OPD)
// Terhubung ke API: GET /profile/me, PUT /profile/update, PATCH /profile/change-password
import React, { useState, useEffect, useCallback } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
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
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form profil
    const [formData, setFormData] = useState({ nama_lengkap: '', no_hp: '' });

    // Form password
    const [passwordData, setPasswordData] = useState({
        passwordLama: '',
        passwordBaru: '',
        konfirmasiPassword: ''
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

    // ── Handler form profil ────────────────────────────────────────────────────
    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // ── Handler form password ──────────────────────────────────────────────────
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    // ── Handler avatar ─────────────────────────────────────────────────────────
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
            user?.avatar || 'https://ui-avatars.com/api/?name=User&background=gray&color=fff'
        );
    };

    // ── Submit gabungan (profil + password opsional) ───────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validasi password jika diisi
        if (passwordData.passwordLama || passwordData.passwordBaru || passwordData.konfirmasiPassword) {
            if (!passwordData.passwordLama || !passwordData.passwordBaru || !passwordData.konfirmasiPassword) {
                setToast({ message: 'Mohon lengkapi semua field password', type: 'error' });
                return;
            }
            if (passwordData.passwordBaru !== passwordData.konfirmasiPassword) {
                setToast({ message: 'Password baru dan konfirmasi password tidak cocok', type: 'error' });
                return;
            }
            if (passwordData.passwordBaru.length < 6) {
                setToast({ message: 'Password baru minimal 6 karakter', type: 'error' });
                return;
            }
        }

        setIsSaving(true);
        try {
            // 1. Update profil
            const resProfile = await apiFetch('/profile/update', {
                method: 'PUT',
                body: JSON.stringify({
                    nama_lengkap: formData.nama_lengkap.trim(),
                    no_hp:        formData.no_hp.trim() || null
                })
            });
            const resultProfile = await resProfile.json();
            if (!resultProfile.success) {
                setToast({ message: resultProfile.message || 'Gagal menyimpan profil', type: 'error' });
                return;
            }

            // 2. Ganti password (opsional)
            if (passwordData.passwordLama && passwordData.passwordBaru) {
                const resPass = await apiFetch('/profile/change-password', {
                    method: 'PATCH',
                    body: JSON.stringify({
                        password_lama: passwordData.passwordLama,
                        password_baru: passwordData.passwordBaru
                    })
                });
                const resultPass = await resPass.json();
                if (!resultPass.success) {
                    setToast({ message: resultPass.message || 'Gagal mengubah password', type: 'error' });
                    return;
                }
            }

            setToast({ message: 'Profil berhasil diperbarui!', type: 'success' });
            await fetchProfile();

            // Reset password fields
            setPasswordData({ passwordLama: '', passwordBaru: '', konfirmasiPassword: '' });

        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsSaving(false);
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

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Bagian Kiri - Avatar */}
                    <div className="lg:col-span-1">
                        <Card>
                            <div className="flex flex-col items-center space-y-4">
                                <div className="relative">
                                    <img
                                        src={avatarPreview}
                                        alt="Profile"
                                        className="w-40 h-40 rounded-full object-cover"
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
                                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
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

                    {/* Bagian Kanan - Combined Form */}
                    <div className="lg:col-span-2">
                        <Card>
                            <div className="space-y-8">

                                {/* Informasi Pribadi Section */}
                                <div>
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>

                                        {/* NIK — read only */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                NIK
                                                <span className="ml-2 text-xs text-gray-400 font-normal">(tidak dapat diubah)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={profileData?.nik || ''}
                                                disabled
                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                            />
                                        </div>

                                        {/* No. HP */}
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-gray-200"></div>

                                {/* Ubah Password Section */}
                                <div>
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>

                                        {/* Submit Button */}
                                        <div className="pt-4">
                                            <button
                                                type="submit"
                                                disabled={isSaving}
                                                className="w-full inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                                            >
                                                {isSaving ? (
                                                    <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
                                                ) : (
                                                    'Simpan'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </Card>
                    </div>

                </div>
            </form>

            {/* Toast Notification */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default Profil;