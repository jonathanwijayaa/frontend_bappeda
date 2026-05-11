// HistoriRelawan.tsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Loader2, History, Search } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import YearPicker from '../components/ui/YearPicker';
import Pagination from '../components/ui/Pagination';
import apiClient from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import { HistoriRelawanData } from '../types/histori.types';
import { AutoOption } from '../types/common.types';
import { formatPhoneDisplay } from '../utils/formatPhone';
import Toast, { ToastType } from '../components/ui/Toast';

// ── Helper: kelompokkan baris flat dari API menjadi per-relawan ─
const groupRelawanData = (rows: any[]): HistoriRelawanData[] => {
    const map = new Map<string, HistoriRelawanData>();
    rows.forEach((row) => {
        if (!map.has(row.nik)) {
            map.set(row.nik, {
                nik: row.nik,
                namaLengkap: row.nama_lengkap,
                alamat: row.alamat_ktp || '-',
                no_hp: row.no_hp || '-',
                kelurahan: row.kelurahan || '-',
                jenisKelamin: row.jenis_kelamin || 'L',
                kader: row.nama_kader || '-',
                jabatan: row.jabatan || '-',
                penugasan: row.nama_opd || row.penugasan || '-',
                relawan_id: row.relawan_id,
                user_id: row.user_id,
                assignments: [],
            });
        }
        if (row.nama_opd || row.penugasan || row.nama_kader) {
            map.get(row.nik)!.assignments.push({
                id: row.penugasan_id?.toString() || Math.random().toString(),
                opd: row.nama_opd || '',
                opd_id: row.opd_id || 0,
                kader: row.nama_kader || '',
                kader_id: row.kader_id || null,
                peran: row.jabatan || '',
                detail: row.detail_jabatan || '',
                penugasan: row.penugasan || '',
                statusKeaktifan: row.status_penugasan || 'Aktif',
                nomorSK: row.nomor_sk || '',
                tanggalTerbit: row.tanggal_terbit || '',
                batasAktif: row.batas_aktif || '',
                tahun: row.tahun || '',
                tahunMulai: row.tanggal_terbit ? new Date(row.tanggal_terbit).getFullYear() : null,
                tahunSelesai: row.batas_aktif ? new Date(row.batas_aktif).getFullYear() : null,
            });
        }
    });
    return Array.from(map.values());
};

// ── Component ────────────────────────────────────────────────────
const HistoriRelawan: React.FC = () => {
    const { isSuperAdmin, isOPD } = useAuth();
    const API_BASE = isSuperAdmin ? '/admin/relawan' : '/opd-admin/relawan';

    const [relawanList, setRelawanList] = useState<HistoriRelawanData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // ── Filter state ──────────────────────────────────────────────
    const [filterOpd, setFilterOpd] = useState<string>('');
    const [filterKader, setFilterKader] = useState<string>('');
    const [filterTahunAwal, setFilterTahunAwal] = useState<string>('');
    const [filterTahunAkhir, setFilterTahunAkhir] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');

    // ── Dropdown options ──────────────────────────────────────────
    const [opdOptions, setOpdOptions] = useState<AutoOption[]>([]);
    const [kaderOptions, setKaderOptions] = useState<AutoOption[]>([]);

    // ── Pagination ────────────────────────────────────────────────
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 5;

    // ── Detail modal ──────────────────────────────────────────────
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedRelawan, setSelectedRelawan] = useState<HistoriRelawanData | null>(null);

    // ── Tahun range ───────────────────────────────────────────────
    const currentYear = new Date().getFullYear();
    const maxYearAkhir = currentYear + 10; // batas_aktif SK bisa di masa depan
    const minYearGlobal = 2000;
    // Jika tahun awal dipilih, tahun akhir minimal = tahun awal
    const minYearAkhir = filterTahunAwal ? Number(filterTahunAwal) : minYearGlobal;

    // ── Fetch data relawan ────────────────────────────────────────
    const fetchRelawan = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: result } = await apiClient.get(API_BASE);
            if (result.success) {
                setRelawanList(groupRelawanData(result.data));
            } else {
                setToast({ message: result.message || 'Gagal memuat data histori', type: 'error' });
            }
        } catch {
            setToast({ message: 'Tidak dapat terhubung ke server', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [API_BASE]);

    // ── Fetch OPD & Kader options ─────────────────────────────────
    useEffect(() => {
        fetchRelawan();

        // Fetch OPD options
        apiClient.get('/opd').then(r => r.data).then(result => {
            if (result.success) {
                setOpdOptions(result.data.map((o: any) => ({ label: o.nama_opd, value: o.nama_opd })));
            }
        }).catch(() => { });

        // Fetch Kader options — endpoint berbeda untuk OPD user vs Super Admin
        const kaderEndpoint = isOPD ? '/opd-admin/kader' : '/kader';
        apiClient.get(kaderEndpoint).then(r => r.data).then(result => {
            if (result.success) {
                setKaderOptions(result.data.map((k: any) => ({ label: k.nama_kader, value: k.nama_kader })));
            }
        }).catch(() => { });
    }, [fetchRelawan, isOPD]);

    // ── Filtering ─────────────────────────────────────────────────
    const filteredData = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return relawanList.filter(relawan => {
            // Searchbar: nama atau NIK
            const matchSearch = !q ||
                relawan.namaLengkap.toLowerCase().includes(q) ||
                relawan.nik.toLowerCase().includes(q);

            // Filter Nama OPD: relawan punya minimal satu assignment di OPD tsb
            const matchOpd = !filterOpd || relawan.assignments.some(
                a => a.opd.toLowerCase() === filterOpd.toLowerCase()
            );

            // Filter Nama Kader: relawan punya minimal satu assignment di Kader tsb
            const matchKader = !filterKader || relawan.assignments.some(
                a => a.kader.toLowerCase() === filterKader.toLowerCase()
            );

            // Filter Tahun — berdasarkan field tahun di assignment (dari SK tanggal_terbit & batas_aktif)
            const matchTahun = (() => {
                if (!filterTahunAwal && !filterTahunAkhir) return true;
                // Relawan harus punya minimal 1 assignment dengan data SK yang cocok
                return relawan.assignments.some(a => {
                    // Assignment tanpa data SK → tidak cocok dengan filter tahun
                    if (!a.tahunMulai && !a.tahunSelesai) return false;

                    const awal = filterTahunAwal ? Number(filterTahunAwal) : 0;
                    const akhir = filterTahunAkhir ? Number(filterTahunAkhir) : 9999;

                    const skAwal = a.tahunMulai || 0;
                    const skAkhir = a.tahunSelesai || 9999;

                    // Overlap check: rentang SK [skAwal, skAkhir] harus beririsan dengan filter [awal, akhir]
                    return (skAkhir >= awal) && (skAwal <= akhir);
                });
            })();

            return matchSearch && matchOpd && matchKader && matchTahun;
        });
    }, [relawanList, searchTerm, filterOpd, filterKader, filterTahunAwal, filterTahunAkhir]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    // ── Handle filter change ──────────────────────────────────────
    const handleYearAwalChange = (year: string) => {
        setFilterTahunAwal(year);
        // Jika tahun akhir sudah dipilih dan < tahun awal baru, reset
        if (year && filterTahunAkhir && Number(filterTahunAkhir) < Number(year)) {
            setFilterTahunAkhir('');
        }
        setCurrentPage(1);
    };

    const handleYearAkhirChange = (year: string) => {
        setFilterTahunAkhir(year);
        setCurrentPage(1);
    };

    const handleResetFilter = () => {
        setFilterOpd('');
        setFilterKader('');
        setFilterTahunAwal('');
        setFilterTahunAkhir('');
        setSearchTerm('');
        setCurrentPage(1);
    };

    // ── Detail modal ──────────────────────────────────────────────
    const handleDetailClick = (relawan: HistoriRelawanData) => {
        setSelectedRelawan(relawan);
        setIsDetailModalOpen(true);
    };

    // ── Table columns (mirip Data Relawan) ────────────────────────
    const columns = [
        { header: 'NAMA', accessor: 'namaLengkap' as keyof HistoriRelawanData, width: '20%' },
        { header: 'NIK', accessor: 'nik' as keyof HistoriRelawanData, width: '16%' },
        { header: 'ALAMAT', accessor: 'alamat' as keyof HistoriRelawanData, width: '20%' },
        { header: 'KELURAHAN', accessor: 'kelurahan' as keyof HistoriRelawanData, width: '14%' },
        {
            header: 'OPD',
            width: '15%',
            render: (row: HistoriRelawanData) => (
                <span className="text-sm text-gray-700">
                    {row.assignments.length > 0
                        ? [...new Set(row.assignments.map(a => a.opd).filter(Boolean))].join(', ') || '-'
                        : '-'}
                </span>
            )
        },
        {
            header: 'KADER',
            width: '15%',
            render: (row: HistoriRelawanData) => (
                <span className="text-sm text-gray-700">
                    {row.assignments.length > 0
                        ? [...new Set(row.assignments.map(a => a.kader).filter(Boolean))].join(', ') || '-'
                        : '-'}
                </span>
            )
        },
    ];

    const rowActions = (row: HistoriRelawanData) => (
        <Button variant="secondary" size="sm" onClick={() => handleDetailClick(row)}>Detail</Button>
    );

    // ── Render detail field (read-only, tampil sebagai teks) ──────
    const renderFieldRow = (label: string, value: string | undefined) => (
        <div key={label} className="grid grid-cols-3 gap-4 items-start py-2 border-b border-gray-100 last:border-b-0">
            <span className="text-sm font-medium text-gray-500">{label}</span>
            <span className="col-span-2 text-sm text-gray-900 font-medium break-words">{value || '-'}</span>
        </div>
    );

    const isActiveFilter = filterOpd || filterKader || filterTahunAwal || filterTahunAkhir;

    return (
        <div className="space-y-6">
            {/* ── Filter Bar ── */}
            <Card>
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                        <History size={18} className="text-green-600" />
                        <h3 className="font-semibold text-gray-800 text-sm">Filter Riwayat</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Filter OPD */}
                        {isSuperAdmin && (
                            <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Nama OPD</label>
                            <Select
                                value={filterOpd}
                                onChange={(e) => { setFilterOpd(e.target.value); setCurrentPage(1); }}
                                placeholder="Semua OPD"
                                options={[
                                    { value: '', label: 'Semua OPD' },
                                    ...opdOptions,
                                ]}
                                className="w-full text-sm"
                            />
                        </div>
                        )
                            }

                        {/* Filter Kader */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Nama Kader</label>
                            <Select
                                value={filterKader}
                                onChange={(e) => { setFilterKader(e.target.value); setCurrentPage(1); }}
                                placeholder="Semua Kader"
                                options={[
                                    { value: '', label: 'Semua Kader' },
                                    ...kaderOptions,
                                ]}
                                className="w-full text-sm"
                            />
                        </div>

                        {/* Filter Tahun Awal */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Tahun Awal</label>
                            <YearPicker
                                value={filterTahunAwal}
                                onChange={handleYearAwalChange}
                                placeholder="Tahun Awal"
                                minYear={minYearGlobal}
                                maxYear={currentYear}
                            />
                        </div>

                        {/* Filter Tahun Akhir */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Tahun Akhir</label>
                            <YearPicker
                                value={filterTahunAkhir}
                                onChange={handleYearAkhirChange}
                                placeholder="Tahun Akhir"
                                minYear={minYearAkhir}
                                maxYear={maxYearAkhir}
                            />
                        </div>
                    </div>

                    {/* Reset Filter */}
                    {isActiveFilter && (
                        <div className="flex justify-end">
                            <Button
                                onClick={handleResetFilter}
                                className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                                variant='danger'
                            >
                                ✕ Reset Filter
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            {/* ── Searchbar ── */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    placeholder="Cari nama atau NIK relawan..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white shadow-sm"
                />
            </div>

            {/* ── Tabel Riwayat ── */}
            <Card title="Tabel Riwayat Data Relawan">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 size={28} className="animate-spin text-gray-400" />
                        <span className="ml-3 text-gray-500">Memuat riwayat data relawan...</span>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <History size={40} className="text-gray-300 mb-3" />
                        <p className="text-gray-600 font-medium">Tidak ada data riwayat</p>
                        <p className="text-sm text-gray-400 mt-1">
                            {isActiveFilter
                                ? 'Tidak ada relawan yang cocok dengan filter yang dipilih.'
                                : 'Belum ada riwayat data relawan yang tercatat.'}
                        </p>
                    </div>
                ) : (
                    <Table columns={columns} data={currentData} actions={rowActions} minRows={5} />
                )}

                {/* Pagination */}
                {!isLoading && filteredData.length > 0 && (
                    <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            Menampilkan {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} relawan
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={(page) => setCurrentPage(page)}
                        />
                    </div>
                )}
            </Card>

            {/* ── Modal Detail (read-only) ── */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => { setIsDetailModalOpen(false); setSelectedRelawan(null); }}
                title="Detail Riwayat Relawan"
                subtitle="Informasi lengkap data relawan (hanya baca)"
                maxWidth="2xl"
            >
                {selectedRelawan && (
                    <div className="space-y-6">
                        {/* ── Informasi Pribadi ── */}
                        <div>
                            <h3 className="text-base font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                                Informasi Pribadi
                            </h3>
                            <div className="space-y-1">
                                {renderFieldRow('Nama Relawan', selectedRelawan.namaLengkap)}
                                {renderFieldRow('NIK', selectedRelawan.nik)}
                                {renderFieldRow('Jenis Kelamin', selectedRelawan.jenisKelamin === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)')}
                                {renderFieldRow('Alamat KTP', selectedRelawan.alamat)}
                                {renderFieldRow('No. HP', formatPhoneDisplay(selectedRelawan.no_hp))}
                                {renderFieldRow('Kelurahan', selectedRelawan.kelurahan)}
                            </div>
                        </div>

                        {/* ── Daftar Penugasan ── */}
                        <div>
                            <h3 className="text-base font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                                Daftar Penugasan
                            </h3>
                            {Array.isArray(selectedRelawan.assignments) && selectedRelawan.assignments.length > 0 ? (
                                <div className="space-y-4">
                                    {selectedRelawan.assignments.map((assignment, index) => (
                                        <div
                                            key={assignment.id}
                                            className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                                    Penugasan #{index + 1}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${assignment.statusKeaktifan === 'Aktif'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-200 text-gray-600'
                                                    }`}>
                                                    {assignment.statusKeaktifan}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                {renderFieldRow('OPD', assignment.opd)}
                                                {renderFieldRow('Kader', assignment.kader)}
                                                {renderFieldRow('Peran / Jabatan', assignment.peran)}
                                                {renderFieldRow('Detail Jabatan', assignment.detail)}
                                                {renderFieldRow('Penugasan', assignment.penugasan)}
                                                {assignment.tahun ? renderFieldRow('Tahun', String(assignment.tahun)) : null}
                                                {assignment.nomorSK ? renderFieldRow('Nomor SK', assignment.nomorSK) : null}
                                                {assignment.nomorSK ? renderFieldRow('Tanggal Terbit',
                                                    assignment.tanggalTerbit
                                                        ? new Date(assignment.tanggalTerbit).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                                        : '-'
                                                ) : null}
                                                {assignment.nomorSK ? renderFieldRow('Batas Aktif',
                                                    assignment.batasAktif
                                                        ? new Date(assignment.batasAktif).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                                        : '-'
                                                ) : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-400 italic py-4 text-sm">
                                    Belum ada data penugasan terdaftar.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default HistoriRelawan;
