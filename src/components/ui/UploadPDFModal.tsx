// components/ui/UploadPDFModal.tsx
import React, { useState, useRef } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Upload, X, FileText } from 'lucide-react';

interface UploadPDFModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (file: File, metadata: any) => Promise<void>;
    title: string;
}

const UploadPDFModal: React.FC<UploadPDFModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [metadata, setMetadata] = useState({
        nomorSK: '',
        judulSK: '',
        tanggalTerbit: '',
        batasAktif: '',
        opd_id: ''
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleSubmit = async () => {
        if (!file || !metadata.nomorSK) {
            alert('File PDF dan Nomor SK wajib diisi');
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
        setMetadata({
            nomorSK: '',
            judulSK: '',
            tanggalTerbit: '',
            batasAktif: '',
            opd_id: ''
        });
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
                            placeholder="Pengangkatan Kader dan Relawan"
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

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            OPD
                        </label>
                        <select
                            value={metadata.opd_id}
                            onChange={(e) => setMetadata({ ...metadata, opd_id: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Pilih OPD</option>
                            <option value="1">BPBD Yogyakarta</option>
                            {/* Tambahkan OPD lain dari API jika perlu */}
                        </select>
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