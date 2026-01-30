import React, { useState, ChangeEvent } from 'react';
import Card from '../components/ui/Card';
import { SearchInput } from '../components/ui/Input';
import Select from '../components/ui/Select';
import Table from '../components/ui/Table';

interface LogData {
    waktu: string;
    pengguna: string;
    aktifitas: string;
    objek: string;
}

const LogAktifitas: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterHari, setFilterHari] = useState<string>('');
    const [filterJenis, setFilterJenis] = useState<string>('');
    const [filterPengguna, setFilterPengguna] = useState<string>('');

    const logData: LogData[] = [
        {
            waktu: '04-12-2025 10:15',
            pengguna: 'Amelia (SA)',
            aktifitas: 'Setujui perubahan',
            objek: 'Relawan: Jonathan Wijaya (NIK 123456...)'
        },
        {
            waktu: '04-12-2025 9:40',
            pengguna: 'OPD Dinkes',
            aktifitas: 'Ubah Data Relawan',
            objek: 'Relawan: Siti Aminah (NIK 987654...)'
        },
        {
            waktu: '04-12-2025 9:15',
            pengguna: 'Amelia (SA)',
            aktifitas: 'Tolak pengajuan perubahan data',
            objek: 'Relawan: Budi Santoso (NIK 111222...)'
        },
        {
            waktu: '04-12-2025 8:10',
            pengguna: 'Relawan: Jonathan',
            aktifitas: 'Ajukan perubahan data',
            objek: 'Relawan: Jonathan Wijaya (NIK 123456...)'
        },
        {
            waktu: '04-12-2025 8:10',
            pengguna: 'Relawan: Jonathan',
            aktifitas: 'Ajukan perubahan data',
            objek: 'Relawan: Jonathan Wijaya (NIK 123456...)'
        },
        {
            waktu: '04-12-2025 8:10',
            pengguna: 'Relawan: Jonathan',
            aktifitas: 'Ajukan perubahan data',
            objek: 'Relawan: Jonathan Wijaya (NIK 123456...)'
        },
        {
            waktu: '04-12-2025 8:10',
            pengguna: 'Relawan: Jonathan',
            aktifitas: 'Ajukan perubahan data',
            objek: 'Relawan: Jonathan Wijaya (NIK 123456...)'
        },
        {
            waktu: '04-12-2025 8:10',
            pengguna: 'Relawan: Jonathan',
            aktifitas: 'Ajukan perubahan data',
            objek: 'Relawan: Jonathan Wijaya (NIK 123456...)'
        },
        {
            waktu: '04-12-2025 8:10',
            pengguna: 'Relawan: Jonathan',
            aktifitas: 'Ajukan perubahan data',
            objek: 'Relawan: Jonathan Wijaya (NIK 123456...)'
        },
    ];

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
