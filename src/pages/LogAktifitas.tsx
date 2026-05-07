// LogAktifitas.tsx
import React, { useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, Loader2, X } from 'lucide-react';
import Card from '../components/ui/Card';
import { SearchInput } from '../components/ui/Input';
import Select from '../components/ui/Select';
import Table from '../components/ui/Table';
import Toast, { ToastType } from '../components/ui/Toast';
import Pagination from '../components/ui/Pagination';
import { LogData } from '../types';
import { useLogList } from '../hooks/log/useLogList';
import { ChangeEvent } from 'react';

// Label mapping untuk action_type ke bahasa Indonesia
const ACTION_LABEL: Record<string, string> = {
    INSERT: 'Tambah Data',
    UPDATE: 'Ubah Data',
};

const ACTION_COLOR: Record<string, string> = {
    INSERT: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
};

// Helper: format JSON value for display
const formatValue = (val: any): string => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'object') return JSON.stringify(val, null, 2);
    return String(val);
};

// Helper: render diff berdasarkan action_type
const renderDiff = (action: string, oldVal: any, newVal: any) => {
    // 1. UI UNTUK AKSI INSERT (Hanya tampilkan data baru)
    if (action === 'INSERT') {
        const data = newVal || {};
        const keys = Object.keys(data);

        if (keys.length === 0) return <p className="text-sm text-gray-400 italic">Tidak ada detail data.</p>;

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {keys.map(key => (
                    <div key={key} className="bg-green-50 p-3 rounded-lg border border-green-100">
                        <p className="text-xs text-green-700 font-semibold mb-1 uppercase tracking-wide">{key}</p>
                        <p className="text-sm text-gray-800 break-words whitespace-pre-wrap">
                            {formatValue(data[key])}
                        </p>
                    </div>
                ))}
            </div>
        );
    }

    // 2. UI UNTUK AKSI UPDATE (Tampilkan perbandingan)
    if (action === 'UPDATE') {
        if (typeof oldVal !== 'object' || typeof newVal !== 'object' || !oldVal || !newVal) {
             return <p className="text-sm text-red-500 italic">Format data lama/baru tidak valid untuk perbandingan.</p>;
        }

        const allKeys = Array.from(new Set([...Object.keys(oldVal || {}), ...Object.keys(newVal || {})]));
        // Hanya ambil key yang nilainya benar-benar berubah
        const changedKeys = allKeys.filter(k => JSON.stringify((oldVal || {})[k]) !== JSON.stringify((newVal || {})[k]));

        if (changedKeys.length === 0) {
            return <p className="text-sm text-gray-400 italic">Tidak ada perubahan nilai yang terdeteksi.</p>;
        }

        return (
            <div className="space-y-3">
                {changedKeys.map(key => (
                    <div key={key} className="rounded-lg overflow-hidden border border-gray-200">
                        <div className="bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            {key}
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-gray-200">
                            <div className="p-3 bg-red-50">
                                <p className="text-xs text-red-500 font-medium mb-1">Sebelum</p>
                                <p className="text-sm text-gray-700 break-words whitespace-pre-wrap">
                                    {formatValue((oldVal || {})[key])}
                                </p>
                            </div>
                            <div className="p-3 bg-green-50">
                                <p className="text-xs text-green-600 font-medium mb-1">Sesudah</p>
                                <p className="text-sm text-gray-700 break-words whitespace-pre-wrap">
                                    {formatValue((newVal || {})[key])}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // 3. UI UNTUK AKSI DELETE (Opsional: Hanya tampilkan data lama yang dihapus)
    if (action === 'DELETE') {
        const data = oldVal || {};
        const keys = Object.keys(data);
        
        if (keys.length === 0) return <p className="text-sm text-gray-400 italic">Tidak ada detail data.</p>;

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {keys.map(key => (
                    <div key={key} className="bg-red-50 p-3 rounded-lg border border-red-100">
                        <p className="text-xs text-red-700 font-semibold mb-1 uppercase tracking-wide">{key}</p>
                        <p className="text-sm text-gray-800 break-words whitespace-pre-wrap">
                            {formatValue(data[key])}
                        </p>
                    </div>
                ))}
            </div>
        );
    }

    return null;
};

// Helper: dapatkan nama deskriptif dari record
const getRecordName = (log: LogData): string => {
    if (!log) return '-';
    // Gunakan new_value jika ada, jika tidak gunakan old_value (misal untuk DELETE)
    const data = log.new_value || log.old_value || {};
    
    switch (log.table_name) {
        case 'users':
            return data.nama_lengkap || data.nik || String(log.record_id);
        case 'opd':
            return data.nama_opd || String(log.record_id);
        case 'kader':
            return data.nama_kader || String(log.record_id);
        case 'relawan':
            return data.nama_lengkap || String(log.record_id);
        case 'surat_keputusan':
            return data.judul_sk || data.nomor_sk || String(log.record_id);
        case 'penugasan_relawan':
            return data.penugasan || data.jabatan || String(log.record_id);
        case 'saran_masukan':
            return data.subjek || String(log.record_id);
        case 'hotline_settings':
            return 'Pengaturan Hotline';
        default:
            return String(log.record_id ?? '-');
    }
};

const LogAktifitas: React.FC = () => {
    // ── Server State ──────────────────────────────────────────
    const { data: logList = [], isLoading } = useLogList(200);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('');
    const [filterTable, setFilterTable] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [selectedLog, setSelectedLog] = useState<LogData | null>(null);
    const itemsPerPage = 5;
    const { isSuperAdmin } = useAuth();

    // ── Validasi Role ─────────────────────────────────────────
    if (!isSuperAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    // ── Filter ────────────────────────────────────────────────
    const filteredData = useMemo(() =>
        logList.filter(log => {
            const matchSearch =
                (log.nama_pengguna || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.nik || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (ACTION_LABEL[log.action_type] || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.table_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchAction = filterAction ? log.action_type === filterAction : true;
            const matchTable = filterTable ? log.table_name === filterTable : true;
            return matchSearch && matchAction && matchTable;
        }), [logList, searchTerm, filterAction, filterTable]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const uniqueActions = useMemo(() => [...new Set(logList.map(l => l.action_type))], [logList]);
    const uniqueTables = useMemo(() => [...new Set(logList.map(l => l.table_name))], [logList]);

    const columns = [
        {
            header: 'WAKTU',
            width: '20%',
            render: (row: LogData) => (
                <span className="text-sm text-gray-600">
                    {new Date(row.timestamp).toLocaleString('id-ID')}
                </span>
            ),
        },
        { header: 'PENGGUNA', accessor: 'nama_pengguna' as keyof LogData, width: '20%' },
        { header: 'NIK', accessor: 'nik' as keyof LogData, width: '18%' },
        {
            header: 'AKSI',
            width: '14%',
            noTruncate: true,
            render: (row: LogData) => (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLOR[row.action_type] || 'bg-gray-100 text-gray-700'}`}>
                    {ACTION_LABEL[row.action_type] || row.action_type}
                </span>
            ),
        },
        { header: 'TABEL', accessor: 'table_name' as keyof LogData, width: '20%' },
    ];

    const rowActions = (row: LogData) => (
        <button
            onClick={() => setSelectedLog(row)}
            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
            title="Lihat Detail Perubahan"
        >
            <Eye size={18} />
        </button>
    );

    return (
        <div className="space-y-6">
            {/* Filter Row */}
            <div className="flex flex-wrap gap-3 items-center">
                <SearchInput
                    value={searchTerm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-64"
                />
                <Select
                    value={filterAction}
                    onChange={(e) => { setFilterAction(e.target.value); setCurrentPage(1); }}
                    options={[
                        { label: 'Semua Aksi', value: '' },
                        ...uniqueActions.map(a => ({ label: ACTION_LABEL[a] || a, value: a })),
                    ]}
                    className="w-44"
                />
                <Select
                    value={filterTable}
                    onChange={(e) => { setFilterTable(e.target.value); setCurrentPage(1); }}
                    options={[
                        { label: 'Semua Tabel', value: '' },
                        ...uniqueTables.map(t => ({ label: t, value: t })),
                    ]}
                    className="w-44"
                />
            </div>

            {/* Table */}
            <Card>
                <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Log Aktivitas</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Menampilkan {filteredData.length} dari {logList.length} log
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 size={28} className="animate-spin text-gray-400" />
                        <span className="ml-3 text-gray-500">Memuat log aktivitas...</span>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-gray-600 font-medium">Tidak ada log yang sesuai filter</p>
                    </div>
                ) : (
                    <Table columns={columns} data={currentData} actions={rowActions} minRows={5} />
                )}

                {!isLoading && filteredData.length > 0 && (
                    <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            Menampilkan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} log
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => setCurrentPage(page)}
                        />
                    </div>
                )}
            </Card>

            {/* Detail Modal */}
            {selectedLog && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelectedLog(null)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800">Detail Log Aktivitas</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {new Date(selectedLog.timestamp).toLocaleString('id-ID')} · {selectedLog.table_name}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            {/* Modal Body — scrollable */}
                            <div className="overflow-y-auto flex-1 p-6 space-y-5">
                                {/* Info Row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500 mb-1">Pengguna</p>
                                        <p className="text-sm font-medium text-gray-800">{selectedLog.nama_pengguna || '-'}</p>
                                        {selectedLog.nik && <p className="text-xs text-gray-500">NIK: {selectedLog.nik}</p>}
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500 mb-1">Jenis Aksi</p>
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${ACTION_COLOR[selectedLog.action_type] || 'bg-gray-100 text-gray-700'}`}>
                                            {ACTION_LABEL[selectedLog.action_type] || selectedLog.action_type}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500 mb-1">Tabel</p>
                                        <p className="text-sm font-medium text-gray-800">{selectedLog.table_name}</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500 mb-1">Target Data</p>
                                        <p className="text-sm font-medium text-gray-800">{getRecordName(selectedLog)} <span className="text-gray-500 font-normal text-xs">(ID: {selectedLog.record_id ?? '-'})</span></p>
                                    </div>
                                </div>

                            {/* Detail Perubahan */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                    {selectedLog.action_type === 'INSERT' ? 'Detail Data Baru' : 
                                    selectedLog.action_type === 'UPDATE' ? 'Detail Data yang Diubah' : 
                                    'Detail Data'}
                                </h3>
                                {/* Kirim action_type sebagai argumen pertama */}
                                {renderDiff(selectedLog.action_type, selectedLog.old_value, selectedLog.new_value)}
                            </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0 flex justify-end">
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="px-5 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default LogAktifitas;
