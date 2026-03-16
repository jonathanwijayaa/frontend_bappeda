import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import Select from '../components/ui/Select';
import Table from '../components/ui/Table';
import Toast, { ToastType } from '../components/ui/Toast';
import { apiFetch } from '../utils/api';
import { ChangeEvent } from 'react';

// Interface sesuai response backend getAuditLogs
interface LogData {
    log_id: number;
    action_type: string;
    table_name: string;
    record_id: number | null;
    old_value: any | null;
    new_value: any | null;
    ip_address: string | null;
    timestamp: string;
    nama_pengguna: string | null;
    role_pengguna: string | null;
    nik: string | null;
}

const LogAktifitas: React.FC = () => {
    const [logList, setLogList] = useState<LogData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterJenis, setFilterJenis] = useState<string>('');
    const [filterRole, setFilterRole] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 10;

    // ── Fetch ────────────────────────────────────
    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch('/admin/logs?limit=200');
            const result = await res.json();
            if (result.success) {
                setLogList(result.data);
            } else {
                setToast({ message: result.message || 'Gagal memuat log aktifitas', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    // ── Filter & Pagination ──────────────────────
    const filteredData = useMemo(() => {
        return logList.filter(log => {
            const matchSearch = !searchTerm || (
                (log.nama_pengguna || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.table_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            const matchJenis = !filterJenis || log.action_type.toUpperCase() === filterJenis.toUpperCase();
            const matchRole = !filterRole || (log.role_pengguna || '') === filterRole;
            return matchSearch && matchJenis && matchRole;
        });
    }, [logList, searchTerm, filterJenis, filterRole]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    // ── Columns ──────────────────────────────────
    const columns = [
        {
            header: 'WAKTU',
            render: (row: LogData) => (
                <span className="text-xs">{new Date(row.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'medium' })}</span>
            )
        },
        {
            header: 'PENGGUNA',
            render: (row: LogData) => (
                <div>
                    <p className="font-medium text-sm">{row.nama_pengguna || '-'}</p>
                    <p className="text-xs text-gray-400">{row.role_pengguna || ''}</p>
                </div>
            )
        },
        {
            header: 'AKTIFITAS',
            render: (row: LogData) => (
                <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                    row.action_type === 'INSERT' ? 'bg-green-100 text-green-700' :
                    row.action_type === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                    row.action_type === 'DELETE' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                }`}>
                    {row.action_type}
                </span>
            )
        },
        {
            header: 'TABEL / OBJEK',
            render: (row: LogData) => (
                <div>
                    <p className="text-sm font-medium">{row.table_name}</p>
                    {row.record_id && <p className="text-xs text-gray-400">ID: {row.record_id}</p>}
                </div>
            )
        },
        {
            header: 'IP ADDRESS',
            render: (row: LogData) => (
                <span className="text-xs text-gray-500">{row.ip_address || '-'}</span>
            )
        },
    ];

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex gap-4 items-center flex-wrap">
                <Select
                    value={filterJenis}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => { setFilterJenis(e.target.value); setCurrentPage(1); }}
                    placeholder="Semua Jenis"
                    options={[
                        { value: '', label: 'Semua Jenis' },
                        { value: 'INSERT', label: 'Tambah (INSERT)' },
                        { value: 'UPDATE', label: 'Ubah (UPDATE)' },
                        { value: 'DELETE', label: 'Hapus (DELETE)' },
                    ]}
                />
                <Select
                    value={filterRole}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => { setFilterRole(e.target.value); setCurrentPage(1); }}
                    placeholder="Semua Role"
                    options={[
                        { value: '', label: 'Semua Role' },
                        { value: 'super_admin', label: 'Super Admin' },
                        { value: 'opd', label: 'OPD' },
                        { value: 'relawan', label: 'Relawan' },
                    ]}
                />
            </div>

            {/* Search */}
            <SearchInput
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full"
            />

            {/* Table */}
            <Card title="Tabel Log Aktifitas">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 size={28} className="animate-spin text-gray-400" />
                        <span className="ml-3 text-gray-500">Memuat log aktifitas...</span>
                    </div>
                ) : (
                    <Table columns={columns} data={currentData} minRows={5} />
                )}

                {/* Pagination */}
                {!isLoading && filteredData.length > 0 && (
                    <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            Menampilkan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} log
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="disabled:opacity-50 disabled:cursor-not-allowed">
                                <ChevronLeft size={16} /> Sebelumnya
                            </Button>
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((page) => (
                                <Button key={page} variant={currentPage === page ? "primary" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className="min-w-[40px]">
                                    {page}
                                </Button>
                            ))}
                            {totalPages > 7 && <span className="px-2 py-1 text-gray-400">...</span>}
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="disabled:opacity-50 disabled:cursor-not-allowed">
                                Selanjutnya <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                )}

                {!isLoading && filteredData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        Tidak ada log yang sesuai dengan filter
                    </div>
                )}
            </Card>

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default LogAktifitas;
