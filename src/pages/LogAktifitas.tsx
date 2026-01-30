import React, { useState, ChangeEvent } from 'react';
import Card from '../components/ui/Card';
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

    const logData: LogData[] = mockLogData;

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
                <Table columns={columns} data={logData} />
            </Card>
        </div>
    );
};

export default LogAktifitas;
