import React, { useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

const EditProfil: React.FC = () => {
    const { user } = useAuth();

    const [profileData, setProfileData] = useState({
        namaLengkap: user?.name || '',
        nik: '1234567890123456',
        noTelepon: (user as any)?.no_hp || '',
        jenisKelamin: user?.name === 'Amelia' ? 'Perempuan' : 'Laki-Laki'
    });

    const [passwordData, setPasswordData] = useState({
        passwordLama: '',
        passwordBaru: '',
        konfirmasiPassword: ''
    });

    const [avatarPreview, setAvatarPreview] = useState<string>(
        user?.avatar || 'https://ui-avatars.com/api/?name=User&background=gray&color=fff'
    );

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteAvatar = () => {
        setAvatarPreview(
            user?.avatar || 'https://ui-avatars.com/api/?name=User&background=gray&color=fff'
        );
    };

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Profile updated:', profileData);
        alert('Informasi pribadi berhasil diperbarui!');
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!passwordData.passwordLama || !passwordData.passwordBaru || !passwordData.konfirmasiPassword) {
            alert('Mohon lengkapi semua field password');
            return;
        }

        if (passwordData.passwordBaru !== passwordData.konfirmasiPassword) {
            alert('Password baru dan konfirmasi password tidak cocok');
            return;
        }

        if (passwordData.passwordBaru.length < 8) {
            alert('Password baru minimal 8 karakter');
            return;
        }

        console.log('Password changed: Yes');
        alert('Password berhasil diperbarui!');

        setPasswordData({
            passwordLama: '',
            passwordBaru: '',
            konfirmasiPassword: ''
        });
    };

    return (
        <div className="space-y-6">
            {/* ── Layout utama: avatar kiri | form kanan ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

                {/* ── Kolom Kiri – Avatar (penuh setinggi kolom kanan) ── */}
                <div className="lg:col-span-1 flex flex-col">
                    <Card className="flex-1 flex flex-col">
                        <div className="flex flex-col items-center justify-start pt-4 space-y-4">
                            {/* Foto profil */}
                            <div className="relative">
                                <img
                                    src={avatarPreview}
                                    alt="Profile"
                                    className="w-40 h-40 rounded-full object-cover ring-4 ring-green-100"
                                />
                            </div>

                            {/* Tombol Ganti / Hapus */}
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

                {/* ── Kolom Kanan – dua form terpisah ── */}
                <div className="lg:col-span-2 flex flex-col gap-6">

                    {/* Form 1 – Informasi Pribadi */}
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
                                        name="namaLengkap"
                                        value={profileData.namaLengkap}
                                        onChange={handleProfileChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>

                                {/* NIK */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        NIK
                                    </label>
                                    <input
                                        type="text"
                                        name="nik"
                                        value={profileData.nik}
                                        onChange={handleProfileChange}
                                        maxLength={16}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>

                                {/* No. Telepon */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        No. Telepon
                                    </label>
                                    <input
                                        type="tel"
                                        name="noTelepon"
                                        value={profileData.noTelepon}
                                        onChange={handleProfileChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Jenis Kelamin */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Jenis Kelamin
                                    </label>
                                    <div className="flex gap-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="jenisKelamin"
                                                value="Laki-Laki"
                                                checked={profileData.jenisKelamin === 'Laki-Laki'}
                                                onChange={handleProfileChange}
                                                className="w-4 h-4 text-green-500 focus:ring-green-500"
                                            />
                                            <span className="text-sm text-gray-700">Laki-Laki</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="jenisKelamin"
                                                value="Perempuan"
                                                checked={profileData.jenisKelamin === 'Perempuan'}
                                                onChange={handleProfileChange}
                                                className="w-4 h-4 text-green-500 focus:ring-green-500"
                                            />
                                            <span className="text-sm text-gray-700">Perempuan</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Tombol Simpan Informasi Pribadi */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                                    >
                                        Simpan Informasi Pribadi
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </form>

                    {/* Form 2 – Ubah Password */}
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

                                {/* Tombol Simpan Password */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                                    >
                                        Simpan Password
                                    </button>
                                </div>
                            </div>
                        </Card>
                    </form>

                </div>
            </div>
        </div>
    );
};

export default EditProfil;
