import { mockRelawanData } from '../data/relawan.data';
import Card from '../components/ui/Card';
import RelawanMenu from '../components/RelawanMenu';

const KomunitasSaya = () => {
    // Get relawan data based on logged in user
    const relawanData = mockRelawanData.find(r => r.nik === '3201012345670001') || mockRelawanData[0];

    return (
        <div className="min-h-screen bg-gray-50">
            <RelawanMenu title="Komunitas Saya" />

            {/* Content */}
            <div className="px-4 py-5 space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
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
                </div>

                {/* Assignments Card - Penugasan Saya */}
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
                                            {assignment.detail && (
                                                <div className="flex items-center text-xs">
                                                    <span className="text-gray-600 w-20">Detail:</span>
                                                    <span className="text-gray-800 font-medium">{assignment.detail}</span>
                                                </div>
                                            )}
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
            </div>
        </div>
    );
};

export default KomunitasSaya;
