/**
 * components/relawan/AssignmentFields.tsx
 * Komponen satu blok penugasan relawan — di-memoize agar tidak re-render
 * saat row lain di tabel berubah.
 */
import React, { memo } from 'react';
import { X, Loader2 } from 'lucide-react';
import AutocompleteInput from '../ui/AutocompleteInput';
import { AutoOption } from '../../types/common.types';

export interface AssignmentFieldsProps {
    assignment: {
        id: string;
        opd: string;
        opd_id?: number;
        kader: string;
        kader_id?: number | null;
        peran: string;
        detail: string;
        penugasan: string;
        statusKeaktifan: 'Aktif' | 'Nonaktif';
        nomorSK?: string;
        skId?: string;
    };
    index: number;
    isReadOnly: boolean;
    isOPD: boolean;
    opdNameForOPD?: string;          // nama OPD dari user (auto-fill jika isOPD)
    opdOptions: AutoOption[];        // semua OPD options (untuk super admin)
    kaderOptions: AutoOption[];      // options kader untuk OPD yang dipilih
    isKaderLoading?: boolean;
    canRemove?: boolean;             // apakah tombol hapus muncul
    isDeletingThis?: boolean;        // spinner saat menghapus penugasan ini
    onFieldChange: (index: number, field: string, value: string) => void;
    onOpdChange: (index: number, namaOpd: string) => void;
    onKaderChange: (index: number, namaOrValue: string) => void;
    onRemove?: (index: number) => void;
}

const JABATAN_OPTIONS = ['Ketua','Wakil','Sekretaris','Bendahara','Seksi','Anggota','Lainnya'];

const AssignmentFields: React.FC<AssignmentFieldsProps> = memo(({
    assignment,
    index,
    isReadOnly,
    isOPD,
    opdNameForOPD,
    opdOptions,
    kaderOptions,
    isKaderLoading = false,
    canRemove = false,
    isDeletingThis = false,
    onFieldChange,
    onOpdChange,
    onKaderChange,
    onRemove,
}) => {
    const hasOpdSelected = isOPD || (assignment.opd_id ?? 0) > 0 || assignment.opd !== '';

    return (
        <div className="relative bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 space-y-4">
            {/* Tombol hapus */}
            {canRemove && !isReadOnly && (
                <div className="flex justify-end -mt-2 -mr-2 mb-2">
                    <button
                        type="button"
                        onClick={() => onRemove?.(index)}
                        disabled={isDeletingThis}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                        title="Hapus Penugasan"
                    >
                        {isDeletingThis
                            ? <Loader2 size={18} className="animate-spin" />
                            : <X size={18} />}
                    </button>
                </div>
            )}

            {/* OPD */}
            <div className="grid grid-cols-3 gap-4 items-start">
                <label className="text-lg font-medium text-gray-900 pt-2">OPD</label>
                <div className="col-span-2">
                    {isOPD ? (
                        <input
                            type="text"
                            disabled
                            value={assignment.opd || opdNameForOPD || 'Instansi Anda'}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 italic cursor-not-allowed"
                        />
                    ) : (
                        <AutocompleteInput
                            name={`opd-${index}`}
                            value={assignment.opd}
                            options={opdOptions}
                            onChange={(val) => onOpdChange(index, val)}
                            placeholder="Cari nama OPD..."
                            disabled={isReadOnly}
                        />
                    )}
                    {!isReadOnly && !isOPD && (assignment.opd_id ?? 0) > 0 && (
                        <p className="mt-1 text-xs text-green-600 font-medium">✓ OPD ditemukan</p>
                    )}
                </div>
            </div>

            {/* Kader */}
            <div className="grid grid-cols-3 gap-4 items-start">
                <label className="text-lg font-medium text-gray-900 pt-2">Kader</label>
                <div className="col-span-2">
                    <AutocompleteInput
                        name={`kader-${index}`}
                        value={assignment.kader}
                        options={isReadOnly
                            ? (assignment.kader ? [{ label: assignment.kader, value: assignment.kader }] : [])
                            : kaderOptions}
                        onChange={(val) => onKaderChange(index, val)}
                        placeholder={
                            isReadOnly ? 'Kader' :
                            !hasOpdSelected ? 'Pilih OPD terlebih dahulu...' :
                            isKaderLoading ? 'Memuat kader...' :
                            kaderOptions.length === 0 ? 'Tidak ada kader di OPD ini' :
                            'Cari nama Kader...'
                        }
                        disabled={isReadOnly || !hasOpdSelected || isKaderLoading}
                        warnIfNotFound={false}
                    />
                    {!isReadOnly && hasOpdSelected && !isKaderLoading && kaderOptions.length > 0 && (
                        <p className="mt-1 text-xs text-blue-500">{kaderOptions.length} kader tersedia</p>
                    )}
                    {!isReadOnly && hasOpdSelected && !isKaderLoading && kaderOptions.length === 0 && (assignment.opd_id ?? 0) > 0 && (
                        <p className="mt-1 text-xs text-yellow-600">⚠️ OPD ini belum memiliki kader</p>
                    )}
                </div>
            </div>

            {/* Peran/Jabatan */}
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-lg font-medium text-gray-900">Peran/Jabatan</label>
                <select
                    value={assignment.peran}
                    onChange={(e) => onFieldChange(index, 'peran', e.target.value)}
                    disabled={isReadOnly}
                    className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                >
                    <option value="">-- Pilih Jabatan --</option>
                    {JABATAN_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
            </div>

            {/* Detail Jabatan */}
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-lg font-medium text-gray-900">Detail Jabatan</label>
                <input
                    type="text"
                    value={assignment.detail}
                    onChange={(e) => onFieldChange(index, 'detail', e.target.value)}
                    placeholder="Detail jabatan (contoh: Bidang X)"
                    disabled={isReadOnly}
                    className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                />
            </div>

            {/* Penugasan */}
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-lg font-medium text-gray-900">Penugasan</label>
                <input
                    type="text"
                    value={assignment.penugasan || ''}
                    onChange={(e) => onFieldChange(index, 'penugasan', e.target.value)}
                    placeholder="Nama/detail penugasan"
                    disabled={isReadOnly}
                    className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                />
            </div>

            {/* Status Keaktifan */}
            <div className="grid grid-cols-3 gap-4 items-center">
                <label className="text-lg font-medium text-gray-900">Status Keaktifan</label>
                <div className="col-span-2 flex items-center gap-6">
                    {(['Aktif', 'Nonaktif'] as const).map(status => (
                        <label key={status} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name={`statusKeaktifan-${index}`}
                                value={status}
                                checked={assignment.statusKeaktifan === status}
                                onChange={(e) => onFieldChange(index, 'statusKeaktifan', e.target.value)}
                                disabled={isReadOnly}
                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-gray-700">{status}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
});

AssignmentFields.displayName = 'AssignmentFields';
export default AssignmentFields;
