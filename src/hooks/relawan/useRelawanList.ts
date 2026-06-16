/**
 * hooks/relawan/useRelawanList.ts
 * Fetch daftar relawan dari backend dan kelompokkan ke dalam RelawanData.
 */
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/axios';
import { RelawanData, RelawanAPIData, Assignment } from '../../types';

export const RELAWAN_KEYS = {
    all: ['relawan'] as const,
    list: (isSuperAdmin: boolean) => [...RELAWAN_KEYS.all, 'list', isSuperAdmin] as const,
};

/** Mapping baris API flat → RelawanData untuk tabel */
// Ubah row API relawan menjadi format tabel yang dipakai frontend.
const mapToRelawanData = (r: RelawanAPIData): RelawanData => ({
    relawan_id: r.relawan_id,
    user_id: r.user_id,
    nik: r.nik,
    namaLengkap: r.nama_lengkap,
    alamat: r.alamat_ktp || '-',
    kelurahan: r.kelurahan || '-',
    no_hp: r.no_hp || '-',
    kader: r.nama_kader || '-',
    jabatan: r.penugasan || '-',
    penugasan: r.nama_opd || '-',
    status_keaktifan: r.status_keaktifan ? 'Aktif' : 'Tidak Aktif',
    jenisKelamin: r.jenis_kelamin || 'L',
    assignments: [],
});

/**
 * Kelompokkan rows flat API menjadi satu relawan dengan banyak assignment.
 */
// Gabungkan baris API yang berulang menjadi satu relawan dengan daftar assignment.
export const groupRelawanRows = (rows: any[]): RelawanData[] => {
    const map = new Map<string, RelawanData>();
    rows.forEach((r) => {
        const key = r.nik;
        if (!map.has(key)) {
            map.set(key, { ...mapToRelawanData(r), assignments: [] });
        }
        if (r.penugasan_id) {
            const entry = map.get(key)!;
            const assignment: Assignment = {
                id: String(r.penugasan_id),
                opd: r.nama_opd || '-',
                opd_id: r.opd_id,
                kader: r.nama_kader || '-',
                kader_id: r.kader_id ?? null,
                peran: r.jabatan || '-',
                detail: r.detail_jabatan || '-',
                penugasan: r.penugasan || '-',
                status_keaktifan: r.status_keaktifan === 'Aktif' ? 'Aktif' : 'Tidak Aktif',
                nomorSK: r.nomor_sk || '',
                skId: String(r.sk_id || ''),
                tanggalTerbit: r.tanggal_terbit || '',
                batasAktif: r.batas_aktif || '',
            };
            entry.assignments!.push(assignment);
        }
    });
    return Array.from(map.values());
};

// Ambil daftar relawan untuk role Super Admin atau OPD.
export const useRelawanList = (isSuperAdmin: boolean) =>
    useQuery({
        queryKey: RELAWAN_KEYS.list(isSuperAdmin),
        queryFn: async (): Promise<RelawanData[]> => {
            const endpoint = isSuperAdmin ? '/admin/relawan' : '/opd-admin/relawan';
            const { data } = await apiClient.get(endpoint);
            if (!data.success) throw new Error(data.message || 'Gagal memuat data relawan');
            return groupRelawanRows(data.data);
        },
    });
