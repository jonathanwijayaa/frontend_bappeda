import { useState } from 'react';
import { mockRelawanData } from '../data/relawan.data';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import RelawanMenu from '../components/RelawanMenu';

const ProfilRelawan = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // Get relawan data based on logged in user
    const relawanData = mockRelawanData.find(r => r.nik === '3201012345670001') || mockRelawanData[0];

    // Form state for the update request modal
    const [updateForm, setUpdateForm] = useState({
        namaLengkap: '',
        noTelepon: '',
        alamat: '',
        passwordSaatIni: '',
        passwordBaru: '',
    });

    const handleOpenModal = () => {
        setUpdateForm({
            namaLengkap: '',
            noTelepon: '',
            alamat: '',
            passwordSaatIni: '',
            passwordBaru: '',
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsConfirmOpen(false);
    };

    const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setUpdateForm({
            ...updateForm,
            [e.target.name]: e.target.value
        });
    };

    const handleAjukan = () => {
        setIsConfirmOpen(true);
    };

    const handleConfirmSubmit = () => {
        // TODO: Submit update request to backend
        console.log('Submitting update request:', updateForm);
        setIsConfirmOpen(false);
        setIsModalOpen(false);
        alert('Pengajuan pembaruan data berhasil dikirim!');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <RelawanMenu title="Icon App" />

            {/* Content */}
            <div className="px-4 py-5 space-y-4">
                {/* Welcome Card */}
                <Card className="shadow-md bg-gradient-to-r from-green-500 to-green-600">
                    <div className="p-5 text-white">
                        <h2 className="text-2xl font-bold mb-1">Selamat Datang!</h2>
                        <p className="text-green-50">{relawanData.namaLengkap}</p>
                    </div>
                </Card>

                {/* Quick Stats */}
                {/* <div className="grid grid-cols-2 gap-3">
                    <Card className="shadow-md">
                        <div className="p-4 text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                </svg>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{relawanData.assignments?.length || 0}</p>
                            <p className="text-xs text-gray-600 mt-1">Penugasan</p>
                        </div>
                    </Card>

                    <Card className="shadow-md">
                        <div className="p-4 text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">
                                {relawanData.assignments?.filter(a => a.statusKeaktifan === 'Aktif').length || 0}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">Aktif</p>
                        </div>
                    </Card>
                </div> */}

                {/* Profile Card - Informasi Pribadi (Read-Only) */}
                <Card className="shadow-md">
                    <div className="p-5">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Informasi Pribadi</h2>

                        <div className="space-y-4">
                            {/* Nama Lengkap */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Nama Lengkap
                                </label>
                                <p className="text-gray-800 font-medium">{relawanData.namaLengkap}</p>
                            </div>

                            {/* NIK */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    NIK
                                </label>
                                <p className="text-gray-800 font-medium">{relawanData.nik}</p>
                            </div>

                            {/* Jenis Kelamin */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Jenis Kelamin
                                </label>
                                <p className="text-gray-800 font-medium">{relawanData.jenisKelamin}</p>
                            </div>

                            {/* No. HP */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    No. HP
                                </label>
                                <p className="text-gray-800 font-medium">{relawanData.noTelepon}</p>
                            </div>

                            {/* Alamat */}
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Alamat
                                </label>
                                <p className="text-gray-800 font-medium">{relawanData.alamat || '-'}</p>
                            </div>
                        </div>

                        {/* Ajukan Pembaruan Data Button */}
                        <Button
                            onClick={handleOpenModal}
                            className="w-full mt-5 bg-green-600 text-white hover:bg-green-700 py-2.5 rounded-lg font-medium"
                        >
                            Ajukan Pembaruan Data
                        </Button>
                    </div>
                </Card>

                {/* Assignments Card - Penugasan Saya */}
                {/* <Card className="shadow-md">
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
                </Card> */}
            </div>

            {/* Modal - Ajukan Pembaruan Data */}
            {isModalOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-black/30 z-40"
                        onClick={handleCloseModal}
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-5 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-800">Ajukan Pembaruan Data</h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 space-y-4">
                                <p className="text-sm text-gray-500 mb-2">
                                    Isi data yang ingin diubah. Kosongkan field yang tidak ingin diubah.
                                </p>

                                {/* Nama Lengkap */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nama Lengkap
                                    </label>
                                    <input
                                        type="text"
                                        name="namaLengkap"
                                        value={updateForm.namaLengkap}
                                        onChange={handleUpdateChange}
                                        placeholder={relawanData.namaLengkap}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                    />
                                </div>

                                {/* No. HP */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        No. HP
                                    </label>
                                    <input
                                        type="tel"
                                        name="noTelepon"
                                        value={updateForm.noTelepon}
                                        onChange={handleUpdateChange}
                                        placeholder={relawanData.noTelepon}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                    />
                                </div>

                                {/* Alamat */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Alamat
                                    </label>
                                    <textarea
                                        name="alamat"
                                        value={updateForm.alamat}
                                        onChange={handleUpdateChange}
                                        placeholder={relawanData.alamat || 'Masukkan alamat baru'}
                                        rows={3}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
                                    />
                                </div>

                                {/* Divider */}
                                <div className="border-t border-gray-200 pt-2">
                                    <p className="text-sm font-medium text-gray-700 mb-3">Ubah Password</p>
                                </div>

                                {/* Password Saat Ini */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password Saat Ini
                                    </label>
                                    <input
                                        type="password"
                                        name="passwordSaatIni"
                                        value={updateForm.passwordSaatIni}
                                        onChange={handleUpdateChange}
                                        placeholder="Masukkan password saat ini"
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                    />
                                </div>

                                {/* Password Baru */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password Baru
                                    </label>
                                    <input
                                        type="password"
                                        name="passwordBaru"
                                        value={updateForm.passwordBaru}
                                        onChange={handleUpdateChange}
                                        placeholder="Masukkan password baru"
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex gap-3 p-5 border-t border-gray-200">
                                <Button
                                    onClick={handleCloseModal}
                                    className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300 py-2.5 rounded-lg font-medium"
                                >
                                    Batal
                                </Button>
                                <Button
                                    onClick={handleAjukan}
                                    className="flex-1 bg-green-600 text-white hover:bg-green-700 py-2.5 rounded-lg font-medium"
                                >
                                    Ajukan
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Confirmation Dialog */}
            {isConfirmOpen && (
                <>
                    {/* Overlay */}
                    <div className="fixed inset-0 bg-black/40 z-[60]" />

                    {/* Confirm Dialog */}
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
                            {/* Warning Icon */}
                            <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Konfirmasi Pengajuan</h3>
                            <p className="text-sm text-gray-600 mb-6">
                                Apakah Anda yakin dengan perubahan data yang diajukan?
                            </p>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setIsConfirmOpen(false)}
                                    className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300 py-2.5 rounded-lg font-medium"
                                >
                                    Batal
                                </Button>
                                <Button
                                    onClick={handleConfirmSubmit}
                                    className="flex-1 bg-green-600 text-white hover:bg-green-700 py-2.5 rounded-lg font-medium"
                                >
                                    Ya, Ajukan
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProfilRelawan;
