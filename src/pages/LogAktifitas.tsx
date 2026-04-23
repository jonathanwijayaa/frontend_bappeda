// LogAktifitas.tsx
import React, { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import Card from '../components/ui/Card';
import { SearchInput } from '../components/ui/Input';
import Select from '../components/ui/Select';
import Table from '../components/ui/Table';
import Toast, { ToastType } from '../components/ui/Toast';
import Pagination from '../components/ui/Pagination';
import { LogData } from '../types';
import { useLogList } from '../hooks/log/useLogList';
import { ChangeEvent } from 'react';

const LogAktifitas: React.FC = () => {
    // ── Server State ──────────────────────────────────────────
    const { data: logList = [], isLoading } = useLogList(200);

    // ── UI State ──────────────────────────────────────────────
    const [searchTerm, setSearchTerm]       = useState('');
    const [filterAction, setFilterAction]   = useState('');
    const [filterTable, setFilterTable]     = useState('');
    const [currentPage, setCurrentPage]     = useState(1);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const itemsPerPage = 10;

    // ── Filter ────────────────────────────────────────────────
    const filteredData = useMemo(() =>
        logList.filter(log => {
            const matchSearch =
                (log.nama_pengguna || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.nik           || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.table_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchAction = filterAction ? log.action_type === filterAction : true;
            const matchTable  = filterTable  ? log.table_name  === filterTable  : true;
            return matchSearch && matchAction && matchTable;
        }), [logList, searchTerm, filterAction, filterTable]);

    const totalPages  = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex  = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    const uniqueActions = useMemo(() => [...new Set(logList.map(l => l.action_type))], [logList]);
    const uniqueTables  = useMemo(() => [...new Set(logList.map(l => l.table_name))],  [logList]);

    const columns = [
        {
            header: 'WAKTU',
            render: (row: LogData) => (
                <span className="text-sm text-gray-600">
                    {new Date(row.timestamp).toLocaleString('id-ID')}
                </span>
            ),
        },
        { header: 'PENGGUNA',  accessor: 'nama_pengguna' as keyof LogData },
        { header: 'NIK',       accessor: 'nik'           as keyof LogData },
        {
            header: 'AKSI',
            render: (row: LogData) => (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    row.action_type === 'INSERT' ? 'bg-green-100 text-green-700' :
                    row.action_type === 'UPDATE' ? 'bg-blue-100 text-blue-700'  :
                    row.action_type === 'DELETE' ? 'bg-red-100 text-red-700'    :
                    'bg-gray-100 text-gray-700'
                }`}>
                    {row.action_type}
                </span>
            ),
        },
        { header: 'TABEL', accessor: 'table_name' as keyof LogData },
        { header: 'IP ADDRESS', accessor: 'ip_address' as keyof LogData },
    ];

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
                        ...uniqueActions.map(a => ({ label: a, value: a })),
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
                    <Table columns={columns} data={currentData} minRows={10} />
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

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default LogAktifitas;
