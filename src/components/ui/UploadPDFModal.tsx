import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Select from './Select';

interface UploadPDFModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (file: File, metadata: SKMetadata) => void;
    title: string;
}

interface SKMetadata {
    nomorSK: string;
    judulSK: string;
    tanggalTerbit: string;
    batasAktif: string;
    namaOPD: string;
    namaKader: string;
}

const UploadPDFModal: React.FC<UploadPDFModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string>('');
    const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
    const [metadata, setMetadata] = useState<SKMetadata>({
        nomorSK: '',
        judulSK: '',
        tanggalTerbit: '',
        batasAktif: '',
        namaOPD: '',
        namaKader: ''
    });

    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
        setError('');

        if (rejectedFiles.length > 0) {
            setError('File harus berformat PDF (.pdf)');
            return;
        }

        if (acceptedFiles.length > 0) {
            setSelectedFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf']
        },
        maxFiles: 1,
        multiple: false
    });

    const handleUpload = () => {
        if (selectedFile) {
            setIsReviewModalOpen(true);
        }
    };

    const handleConfirmReview = () => {
        if (!metadata.nomorSK || !metadata.judulSK || !metadata.tanggalTerbit || !metadata.namaOPD) {
            setError('Mohon lengkapi semua field yang wajib diisi');
            return;
        }

        if (selectedFile) {
            onConfirm(selectedFile, metadata);
            handleClose();
        }
    };

    const handleCloseReview = () => {
        setIsReviewModalOpen(false);
    };

    const handleClose = () => {
        setSelectedFile(null);
        setError('');
        setMetadata({
            nomorSK: '',
            judulSK: '',
            tanggalTerbit: '',
            batasAktif: '',
            namaOPD: '',
            namaKader: ''
        });
        setIsReviewModalOpen(false);
        onClose();
    };

    const removeFile = () => {
        setSelectedFile(null);
        setError('');
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const handleMetadataChange = (field: keyof SKMetadata, value: string) => {
        setMetadata(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <>
            <Modal
                isOpen={isOpen && !isReviewModalOpen}
                onClose={handleClose}
                title={title}
                maxWidth="md"
            >
                <div className="space-y-6">
                    {/* Area Drop File */}
                    <div
                        {...getRootProps()}
                        className={`
                            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                            transition-all duration-200 ease-in-out
                            ${isDragActive && !isDragReject
                                ? 'border-blue-500 bg-blue-50'
                                : isDragReject
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                            }
                        `}
                    >
                        <input {...getInputProps()} />

                        <div className="flex flex-col items-center justify-center">
                            <div className={`
                                w-20 h-20 rounded-full flex items-center justify-center mb-4
                                transition-colors duration-200
                                ${isDragActive && !isDragReject
                                    ? 'bg-blue-100'
                                    : isDragReject
                                        ? 'bg-red-100'
                                        : 'bg-blue-50'
                                }
                            `}>
                                <Upload
                                    size={40}
                                    className={`
                                        transition-colors duration-200
                                        ${isDragActive && !isDragReject
                                            ? 'text-blue-600'
                                            : isDragReject
                                                ? 'text-red-600'
                                                : 'text-blue-500'
                                        }
                                    `}
                                />
                            </div>

                            <div className="space-y-2">
                                {isDragActive ? (
                                    isDragReject ? (
                                        <p className="text-red-600 font-medium">
                                            File harus berformat PDF!
                                        </p>
                                    ) : (
                                        <p className="text-blue-600 font-medium">
                                            Lepaskan file di sini...
                                        </p>
                                    )
                                ) : (
                                    <>
                                        <p className="text-gray-700 font-medium">
                                            Tarik & lepas file PDF di sini
                                        </p>
                                        <p className="text-gray-500 text-sm">
                                            atau klik untuk memilih file
                                        </p>
                                        <p className="text-gray-400 text-xs">
                                            Format yang didukung: .pdf
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Pesan Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-600 text-sm text-center">{error}</p>
                        </div>
                    )}

                    {/* Nampilin File yang dipilih */}
                    {selectedFile && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <FileText size={20} className="text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-gray-800 font-medium text-sm">
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-gray-500 text-xs">
                                            {formatFileSize(selectedFile.size)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile();
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                    title="Hapus file"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    {selectedFile && (
                        <div className="flex justify-center pt-2">
                            <Button
                                type="button"
                                onClick={handleUpload}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-12"
                            >
                                Lanjutkan
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Review Modal with SK Metadata Form */}
            <Modal
                isOpen={isReviewModalOpen}
                onClose={handleCloseReview}
                title="Review dan Lengkapi Data SK"
                subtitle="Isi informasi Surat Keputusan"
                maxWidth="2xl"
            >
                <div className="space-y-6">
                    {/* File Info */}
                    {selectedFile && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                <span className="font-semibold">File:</span> {selectedFile.name} ({formatFileSize(selectedFile.size)})
                            </p>
                        </div>
                    )}

                    {/* Nomor SK */}
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">
                            Nomor SK <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={metadata.nomorSK}
                            onChange={(e) => handleMetadataChange('nomorSK', e.target.value)}
                            placeholder="Contoh: SK/001/2024"
                            className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Judul SK */}
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">
                            Judul SK <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={metadata.judulSK}
                            onChange={(e) => handleMetadataChange('judulSK', e.target.value)}
                            placeholder="Judul Surat Keputusan"
                            className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Tanggal Terbit */}
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">
                            Tanggal Terbit <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={metadata.tanggalTerbit}
                            onChange={(e) => handleMetadataChange('tanggalTerbit', e.target.value)}
                            className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Batas Aktif */}
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">Batas Aktif</label>
                        <input
                            type="date"
                            value={metadata.batasAktif}
                            onChange={(e) => handleMetadataChange('batasAktif', e.target.value)}
                            className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Nama OPD */}
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">
                            Nama OPD <span className="text-red-500">*</span>
                        </label>
                        <Select
                            value={metadata.namaOPD}
                            onChange={(e) => handleMetadataChange('namaOPD', e.target.value)}
                            placeholder="Pilih OPD"
                            className="col-span-2"
                            options={[
                                { value: 'Dinas Kesehatan', label: 'Dinas Kesehatan' },
                                { value: 'Dinas Pendidikan', label: 'Dinas Pendidikan' },
                                { value: 'Dinas Perhubungan', label: 'Dinas Perhubungan' },
                                { value: 'Dinas Sosial', label: 'Dinas Sosial' },
                                { value: 'Dinas Pekerjaan Umum', label: 'Dinas Pekerjaan Umum' },
                                { value: 'Dinas Pariwisata', label: 'Dinas Pariwisata' },
                                { value: 'Dinas Pertanian', label: 'Dinas Pertanian' },
                                { value: 'Dinas Perindustrian', label: 'Dinas Perindustrian' },
                            ]}
                            required
                        />
                    </div>

                    {/* Nama Kader */}
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <label className="text-lg font-medium text-gray-900">Nama Kader</label>
                        <Select
                            value={metadata.namaKader}
                            onChange={(e) => handleMetadataChange('namaKader', e.target.value)}
                            placeholder="Pilih Kader (Opsional)"
                            className="col-span-2"
                            options={[
                                { value: '-', label: 'Tidak Ada (Penugasan OPD)' },
                                { value: 'Kader Pembangunan Daerah A', label: 'Kader Pembangunan Daerah A' },
                                { value: 'Kader Pemberdayaan Masyarakat B', label: 'Kader Pemberdayaan Masyarakat B' },
                                { value: 'Kader Lingkungan Hidup C', label: 'Kader Lingkungan Hidup C' },
                                { value: 'Kader Kesehatan D', label: 'Kader Kesehatan D' },
                                { value: 'Kader Ekonomi Kreatif E', label: 'Kader Ekonomi Kreatif E' },
                            ]}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-600 text-sm text-center">{error}</p>
                        </div>
                    )}

                    {/* Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            <span className="font-semibold">Perhatian:</span> Field yang ditandai dengan <span className="text-red-500">*</span> wajib diisi.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-4 pt-2">
                        <Button
                            type="button"
                            onClick={handleCloseReview}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-12"
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirmReview}
                            className="bg-green-600 hover:bg-green-700 text-white px-12"
                        >
                            Konfirmasi
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default UploadPDFModal;
