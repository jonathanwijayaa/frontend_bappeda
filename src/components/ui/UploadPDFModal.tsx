import React, { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Upload, X, FileText } from 'lucide-react';
import AutocompleteInput from './AutocompleteInput';
import { apiFetch } from '../../utils/api';

interface UploadPDFModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (file: File, metadata: any) => Promise<void>;
    title: string;
    // ✨ Tambahan Props untuk Role-Aware
    isOPD?: boolean;
    userOpdData?: { id?: number; name?: string };
}

interface AutoOption {
    label: string;
    value: string;
}

const UploadPDFModal: React.FC<UploadPDFModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    isOPD = false,
    userOpdData
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // State untuk opsi OPD dari database (Hanya diambil jika user adalah Super Admin)
    const [opdOptions, setOpdOptions] = useState<AutoOption[]>([]);

    const [metadata, setMetadata] = useState({
        nomorSK: '',
        judulSK: '',
        tanggalTerbit: '',
        batasAktif: '',
        opd_id: '',
        opd_name: '' // Tambahan state untuk menyimpan text nama OPD
    });
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset dan atur nilai awal saat modal terbuka
    useEffect(() => {
        if (isOpen) {
            setMetadata({
                nomorSK: '',
                judulSK: '',
                tanggalTerbit: '',
                batasAktif: '',
                // Jika isOPD, langsung kunci id dan namanya dari props userOpdData
                opd_id: isOPD && userOpdData?.id ? String(userOpdData.id) : '',
                opd_name: isOPD && userOpdData?.name ? userOpdData.name : ''
            });
            setFile(null);
            
            // Ambil daftar OPD dari API HANYA jika yang login adalah Super Admin
            if (!isOPD) {
                apiFetch('/opd')
                    .then(r => r.json())
                    .then(result => {
                        if (result.success) {
                            setOpdOptions(result.data.map((o: any) => ({
                                label: o.nama_opd,
                                value: String(o.opd_id)
                            })));
                        }
                    })
                    .catch(() => console.error("Gagal mengambil daftar OPD"));
            }
        }
    }, [isOpen, isOPD, userOpdData]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'application/pdf') {
                alert('Hanya file PDF yang diperbolehkan');
                return;
            }
            if (selectedFile.size > 2 * 1024 * 1024) {
                alert('Ukuran file maksimal 2MB');
                return;
            }
            setFile(selectedFile);
        }
    };

    // Fungsi handle perubahan pada komponen Autocomplete
    const handleOpdChange = (val: string) => {
        const matched = opdOptions.find(o => o.label.toLowerCase() === val.toLowerCase());
        setMetadata(prev => ({
            ...prev,
            opd_name: val,
            opd_id: matched ? matched.value : ''
        }));
    };

    const handleSubmit = async () => {
        if (!file || !metadata.nomorSK) {
            alert('File PDF dan Nomor SK wajib diisi');
            return;
        }
        // Validasi ekstra: Super Admin tidak boleh upload kalau tidak pilih OPD yang valid
        if (!isOPD && !metadata.opd_id) {
             alert('Harap pilih OPD yang valid dari daftar.');
             return;
        }

        setIsUploading(true);
        try {
            await onConfirm(file, metadata);
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="lg">
            <div className="space-y-4">
                {/* File Upload Area */}
                <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 cursor-pointer transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    {file ? (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                            <FileText size={24} />
                            <span className="text-sm font-medium">{file.name}</span>
                            <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                className="ml-2 text-red-500 hover:text-red-700"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="text-gray-500">
                            <Upload size={32} className="mx-auto mb-2" />
                            <p className="text-sm">Klik untuk upload PDF</p>
                            <p className="text-xs text-gray-400">Maksimal 2MB</p>
                        </div>
                    )}
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nomor SK <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={metadata.nomorSK}
                            onChange={(e) => setMetadata({ ...metadata, nomorSK: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="800/123/BPBD/2026"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Judul SK
                        </label>
                        <input
                            type="text"
                            value={metadata.judulSK}
                            onChange={(e) => setMetadata({ ...metadata, judulSK: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Pengangkatan Kader"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tanggal Terbit
                        </label>
                        <input
                            type="date"
                            value={metadata.tanggalTerbit}
                            onChange={(e) => setMetadata({ ...metadata, tanggalTerbit: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Batas Aktif
                        </label>
                        <input
                            type="date"
                            value={metadata.batasAktif}
                            onChange={(e) => setMetadata({ ...metadata, batasAktif: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* ✨ KOLOM OPD ROLE-AWARE ✨ */}
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            OPD <span className="text-red-500">*</span>
                        </label>
                        {isOPD ? (
                            <input 
                                type="text" 
                                disabled 
                                value={metadata.opd_name || 'Instansi Anda'} 
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 italic cursor-not-allowed"
                            />
                        ) : (
                            <div className="relative">
                                <AutocompleteInput
                                    name="opd_name"
                                    value={metadata.opd_name}
                                    options={opdOptions}
                                    onChange={handleOpdChange}
                                    placeholder="Ketik nama OPD..."
                                    warnIfNotFound={true}
                                    warnMessage="OPD tidak ditemukan di database"
                                />
                                {/* Indikator centang hijau jika OPD valid ditemukan */}
                                {metadata.opd_id && (
                                    <p className="mt-1 text-xs text-green-600 font-medium">✓ OPD valid dipilih</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                        Batal
                    </Button>
                    <Button variant="primary" onClick={handleSubmit} disabled={isUploading || !file}>
                        {isUploading ? 'Mengunggah...' : 'Unggah SK'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default UploadPDFModal;