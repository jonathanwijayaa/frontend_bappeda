import { useState } from 'react';
import { mockRelawanData } from '../data/relawan.data';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const ProfilRelawan = () => {
    const [isEditing, setIsEditing] = useState(false);

    // Get relawan data based on logged in user
    // For demo, we'll use the first relawan (Budi Santoso) with NIK 111222
    const relawanData = mockRelawanData.find(r => r.nik === '3201012345670001') || mockRelawanData[0];

    const [formData, setFormData] = useState({
        namaLengkap: relawanData.namaLengkap,
        nik: relawanData.nik,
        jenisKelamin: relawanData.jenisKelamin,
        noTelepon: relawanData.noTelepon,
        alamat: relawanData.alamat || '',
    });

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setFormData({
            namaLengkap: relawanData.namaLengkap,
            nik: relawanData.nik,
            jenisKelamin: relawanData.jenisKelamin,
            noTelepon: relawanData.noTelepon,
            alamat: relawanData.alamat || '',
        });
    };

    const handleSave = () => {
        // TODO: Implement save functionality
        console.log('Saving data:', formData);
        setIsEditing(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Header */}
            <div className="bg-green-600 text-white px-4 py-4 shadow-md">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">Profil Saya</h1>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-5 space-y-4">
                {/* Profile Card */}
                <Card className="shadow-md">
                    <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Informasi Pribadi</h2>
                            {!isEditing && (
                                <button
                                    onClick={handleEdit}
                                    className="text-green-600 text-sm font-medium hover:text-green-700"
                                >
                                    Edit
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {/* Nama Lengkap */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Nama Lengkap
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="namaLengkap"
                                        value={formData.namaLengkap}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="text-gray-800 font-medium">{formData.namaLengkap}</p>
                                )}
                            </div>

                            {/* NIK */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    NIK
                                </label>
                                <p className="text-gray-800 font-medium">{formData.nik}</p>
                            </div>

                            {/* Jenis Kelamin */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Jenis Kelamin
                                </label>
                                <p className="text-gray-800 font-medium">{formData.jenisKelamin}</p>
                            </div>

                            {/* No. HP */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    No. HP
                                </label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        name="noTelepon"
                                        value={formData.noTelepon}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="text-gray-800 font-medium">{formData.noTelepon}</p>
                                )}
                            </div>

                            {/* Alamat */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Alamat
                                </label>
                                {isEditing ? (
                                    <textarea
                                        name="alamat"
                                        value={formData.alamat}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                    />
                                ) : (
                                    <p className="text-gray-800 font-medium">{formData.alamat}</p>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {isEditing && (
                            <div className="flex gap-3 mt-5">
                                <Button
                                    onClick={handleCancel}
                                    className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300 py-2.5 rounded-lg font-medium"
                                >
                                    Batal
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    className="flex-1 bg-green-600 text-white hover:bg-green-700 py-2.5 rounded-lg font-medium"
                                >
                                    Simpan
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Assignments Card */}
                <Card className="shadow-md">
                    <div className="p-5">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Penugasan Saya</h2>

                        {relawanData.assignments && relawanData.assignments.length > 0 ? (
                            <div className="space-y-3">
                                {relawanData.assignments.map((assignment) => (
                                    <div
                                        key={assignment.id}
                                        className="border border-gray-200 rounded-lg p-4 bg-white"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-800 text-sm">
                                                    {assignment.kader}
                                                </h3>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    {assignment.opd}
                                                </p>
                                            </div>
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium ${assignment.statusKeaktifan === 'Aktif'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-700'
                                                    }`}
                                            >
                                                {assignment.statusKeaktifan}
                                            </span>
                                        </div>

                                        <div className="space-y-1.5 mt-3">
                                            <div className="flex items-center text-xs">
                                                <span className="text-gray-600 w-20">Peran:</span>
                                                <span className="text-gray-800 font-medium">{assignment.peran}</span>
                                            </div>
                                            <div className="flex items-center text-xs">
                                                <span className="text-gray-600 w-20">No. SK:</span>
                                                <span className="text-gray-800 font-medium">{assignment.nomorSK}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-gray-500 text-sm">Belum ada penugasan</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Change Password Card */}
                <Card className="shadow-md">
                    <div className="p-5">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Ubah Password</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Password Saat Ini
                                </label>
                                <input
                                    type="password"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="Masukkan password saat ini"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Password Baru
                                </label>
                                <input
                                    type="password"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="Masukkan password baru"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Konfirmasi Password Baru
                                </label>
                                <input
                                    type="password"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="Konfirmasi password baru"
                                />
                            </div>
                        </div>

                        <Button className="w-full mt-5 bg-green-600 text-white hover:bg-green-700 py-2.5 rounded-lg font-medium">
                            Ubah Password
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ProfilRelawan;
