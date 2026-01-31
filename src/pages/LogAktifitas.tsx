import React, { useState, ChangeEvent, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import Select from '../components/ui/Select';
import Table from '../components/ui/Table';
import { LogData } from '../types/log.types';
import { mockLogData } from '../data/log.data';

const LogAktifitas: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterHari, setFilterHari] = useState<string>('');
    const [filterJenis, setFilterJenis] = useState<string>('');
    const [filterPengguna, setFilterPengguna] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 5;

    // Pagination logic
    const filteredData = useMemo(() => {
        return mockLogData.filter(log =>
            log.pengguna.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.aktifitas.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.objek.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = filteredData.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const columns = [
        { header: 'WAKTU', accessor: 'waktu' as keyof LogData },
        { header: 'PENGGUNA', accessor: 'pengguna' as keyof LogData },
        { header: 'AKTIFITAS', accessor: 'aktifitas' as keyof LogData },
        { header: 'OBJEK', accessor: 'objek' as keyof LogData },
    ];

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex gap-4 items-center">
                <Select
                    value={filterHari}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterHari(e.target.value)}
                    placeholder="Hari ini"
                    options={[
                        { value: 'today', label: 'Hari ini' },
                        { value: 'yesterday', label: 'Kemarin' },
                        { value: 'week', label: 'Minggu ini' },
                    ]}
                />
                <Select
                    value={filterJenis}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterJenis(e.target.value)}
                    placeholder="Jenis Aktifitas"
                    options={[
                        { value: 'all', label: 'Semua' },
                        { value: 'create', label: 'Tambah' },
                        { value: 'update', label: 'Ubah' },
                        { value: 'delete', label: 'Hapus' },
                    ]}
                />
                <Select
                    value={filterPengguna}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterPengguna(e.target.value)}
                    placeholder="Semua"
                    options={[
                        { value: 'admin', label: 'Admin' },
                        { value: 'opd', label: 'OPD' },
                        { value: 'relawan', label: 'Relawan' },
                    ]}
                />
            </div>

            {/* Search */}
            <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
            />

            {/* Table */}
            <Card title="Tabel Log">
                <Table columns={columns} data={currentData} minRows={5} />

                {/* Pagination */}
                <div className="mt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredData.length)} dari {filteredData.length} log
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                            Sebelumnya
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                                key={page}
                                variant={currentPage === page ? "primary" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                                className="min-w-[40px]"
                            >
                                {page}
                            </Button>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Selanjutnya
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default LogAktifitas;
