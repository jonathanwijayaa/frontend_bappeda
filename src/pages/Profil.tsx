// Profil.tsx — Halaman Profil (Super Admin & OPD)
// Terhubung ke API: GET /profile/me, PUT /profile/update, PATCH /profile/change-password
import React, { useState, useEffect } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Toast, { ToastType } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { useProfileData } from '../hooks/profil/useProfileData';
import { useUpdateProfil, useChangePassword } from '../hooks/profil/useProfilMutations';

const Profil: React.FC = () => {
    const { user } = useAuth();

    // ── Server State ──────────────────────────────────────────
    const { data: profileData, isLoading: isLoadingProfile } = useProfileData();
    const updateProfil    = useUpdateProfil();
    const changePassword  = useChangePassword();

    // ── UI State ──────────────────────────────────────────────
    const [formData, setFormData] = useState({ nama_lengkap: '', no_hp: '' });
    const [passwordData, setPasswordData] = useState({
        passwordLama: '',
        passwordBaru: '',
        konfirmasiPassword: ''
    });
    const [avatarPreview, setAvatarPreview] = useState<string>(
        user?.avatar || 'https://ui-avatars.com/api/?name=User&background=gray&color=fff'
    );
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // Sync form saat data profil berhasil diload
    useEffect(() => {
        if (profileData) {
            setFormData({
                nama_lengkap: profileData.nama_lengkap || '',
                no_hp:        profileData.no_hp        || '',
            });
            setAvatarPreview(
                `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.nama_lengkap)}&background=${
                    profileData.role === 'super_admin' ? '10B981' : profileData.role === 'opd' ? '3B82F6' : '6B7280'
                }&color=fff`
            );
        }
    }, [profileData]);

    // ── Handlers ──────────────────────────────────────────────
    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

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

        try {
            // 1. Update profil
            await updateProfil.mutateAsync({
                nama_lengkap: formData.nama_lengkap.trim(),
                no_hp:        formData.no_hp.trim() || null,
            });

            // 2. Ganti password (opsional)
            if (passwordData.passwordLama && passwordData.passwordBaru) {
                await changePassword.mutateAsync({
                    password_lama: passwordData.passwordLama,
                    password_baru: passwordData.passwordBaru,
                });
            }

            setToast({ message: 'Profil berhasil diperbarui!', type: 'success' });
            setPasswordData({ passwordLama: '', passwordBaru: '', konfirmasiPassword: '' });
        } catch (e: any) {
            setToast({ message: e.message || 'Gagal menyimpan perubahan', type: 'error' });
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

                                {/* Informasi Pribadi */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Pribadi</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                                            <input
                                                type="text"
                                                name="nama_lengkap"
                                                value={formData.nama_lengkap}
                                                onChange={handleProfileChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>
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
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">No. Telepon / HP</label>
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

                                <div className="border-t border-gray-200" />

                                {/* Ubah Password */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Ubah Password</h3>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Password Saat Ini',        name: 'passwordLama' },
                                            { label: 'Password Baru',             name: 'passwordBaru' },
                                            { label: 'Konfirmasi Password Baru',  name: 'konfirmasiPassword' },
                                        ].map(f => (
                                            <div key={f.name}>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">{f.label}</label>
                                                <input
                                                    type="password"
                                                    name={f.name}
                                                    value={(passwordData as any)[f.name]}
                                                    onChange={handlePasswordChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                />
                                            </div>
                                        ))}
                                        <div className="pt-4">
                                            <button
                                                type="submit"
                                                disabled={isSaving}
                                                className="w-full inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                                            >
                                                {isSaving ? (
                                                    <><Loader2 size={18} className="animate-spin" /> Menyimpan...</>
                                                ) : 'Simpan'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </Card>
                    </div>

                </div>
            </form>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default Profil;