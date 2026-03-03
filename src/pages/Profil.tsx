import React, { useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

const Profil: React.FC = () => {
    const { user } = useAuth();

    const [profileData, setProfileData] = useState({
        namaLengkap: user?.name || '',
        nik: '1234567890123456',
        jenisKelamin: user?.name === 'Amelia' ? 'Perempuan' : 'Laki-Laki'
    });

    const [passwordData, setPasswordData] = useState({
        passwordLama: '',
        passwordBaru: '',
        konfirmasiPassword: ''
    });

    const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar || 'https://ui-avatars.com/api/?name=User&background=gray&color=fff');

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
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
        setAvatarPreview(user?.avatar || 'https://ui-avatars.com/api/?name=User&background=gray&color=fff');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate password fields if any password field is filled
        if (passwordData.passwordLama || passwordData.passwordBaru || passwordData.konfirmasiPassword) {
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
        }

        // Log submission (API Call)
        console.log('Profile updated:', profileData);
        console.log('Password changed:', passwordData.passwordLama ? 'Yes' : 'No');
        alert('Profil berhasil diperbarui!');

        // Reset password fields
        setPasswordData({
            passwordLama: '',
            passwordBaru: '',
            konfirmasiPassword: ''
        });
    };

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
                                                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                                            >
                                                Simpan
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Profil;
