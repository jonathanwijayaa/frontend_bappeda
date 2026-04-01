//UploadExcelModal.tsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Link } from 'react-router-dom';
import { Upload, FileSpreadsheet, X } from 'lucide-react';  
import * as XLSX from 'xlsx';
import Modal from './Modal';
import Button from './Button';
import FileReviewModal from './FileReviewModal';

interface UploadExcelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: any[]) => void;
    title: string;
    templateName: string;
    dataType: 'opd' | 'kader' | 'relawan';
}

// ── Mapping: field wajib sesuai nama kolom AKTUAL di template Excel ──
const REQUIRED_FIELDS: Record<string, string[]> = {
    opd:     ['namaopd', 'status', 'alamat', 'pic', 'nikpic', 'kontak'],
    kader:   ['opd', 'namakader', 'pic', 'nikpic', 'nohp', 'alamatpic', 'kelurahanpic'],
    relawan: ['namalengkap', 'jeniskelamin', 'nik', 'alamat', 'nohp', 'opd', 'kelurahan', 'kader', 'jabatan', 'detailjabatan', 'penugasan'],
};

const REQUIRED_FIELDS_CHECK: Record<string, { keys: string[], label: string }[]> = {
    opd:     [
        { keys: ['namaopd', 'nama'], label: 'Nama OPD' },
        { keys: ['status'], label: 'Status' },
        { keys: ['alamat'], label: 'Alamat' },
        { keys: ['pic', 'namapic'], label: 'PIC' },
        { keys: ['nikpic', 'nik'], label: 'NIK PIC' },
        { keys: ['kontak', 'nohp'], label: 'Kontak' }
    ],
    kader:   [
        { keys: ['opd', 'instansi'], label: 'OPD' },
        { keys: ['namakader', 'kader', 'nama'], label: 'Nama Kader' },
        { keys: ['pic', 'namapic'], label: 'PIC' },
        { keys: ['nikpic', 'nik'], label: 'NIK PIC' },
        { keys: ['nohp', 'kontak', 'hp'], label: 'No HP' },
        { keys: ['alamatpic', 'alamat'], label: 'Alamat PIC' },
        { keys: ['kelurahanpic', 'kelurahan'], label: 'Kelurahan PIC' }
    ],
    relawan: [
        { keys: ['namalengkap', 'nama'], label: 'Nama Lengkap' },
        { keys: ['jeniskelamin', 'jk', 'jenis'], label: 'Jenis Kelamin' },
        { keys: ['nik'], label: 'NIK' },
        { keys: ['alamat'], label: 'Alamat' },
        { keys: ['nohp', 'hp', 'nomerhp', 'telepon'], label: 'No HP' },
        { keys: ['opd', 'instansi'], label: 'OPD/Instansi' },
        { keys: ['kelurahan', 'desa'], label: 'Kelurahan' },
        { keys: ['kader', 'komunitaskader', 'komunitas'], label: 'Kader' },
        { keys: ['jabatan', 'peran'], label: 'Jabatan/Peran' },
        { keys: ['detailjabatan', 'detail'], label: 'Detail Jabatan' },
        { keys: ['penugasan', 'tugas'], label: 'Penugasan' }
    ],
};

const UploadExcelModal: React.FC<UploadExcelModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    templateName,
    dataType
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string>('');
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [parsedErrors, setParsedErrors] = useState<{ rowNumber: number; emptyColumns: string[] }[]>([]);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);

    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
        setError('');
        if (rejectedFiles.length > 0) {
            setError('File harus berformat Excel (.xlsx atau .xls)');
            return;
        }
        if (acceptedFiles.length > 0) setSelectedFile(acceptedFiles[0]);
    }, []);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        maxFiles: 1,
        multiple: false
    });

    const validateDataAndGetErrors = (data: any[]) => {
        if (!data || data.length === 0)
            return { isValid: false, globalError: 'File tidak mengandung data. Pastikan ada baris isi di bawah header.' };

        // Normalisasi key Excel: lowercase + hapus semua non-alfanumerik
        const normalizedKeys = Object.keys(data[0]).map(k =>
            k.toLowerCase().replace(/[^a-z0-9]/g, '')
        );

        const requiredFields = REQUIRED_FIELDS[dataType]; // sudah ternormalisasi
        const missingFields = requiredFields.filter(f => !normalizedKeys.includes(f));

        if (missingFields.length > 0) {
            return {
                isValid: false,
                globalError: `Format file tidak sesuai template. Kolom inti tidak terdeteksi: ${missingFields.join(', ')}. Pastikan menggunakan template yang tersedia.`
            };
        }

        const rowErrors: { rowNumber: number; emptyColumns: string[] }[] = [];
        const fieldsToCheck = REQUIRED_FIELDS_CHECK[dataType];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const emptyCols: string[] = [];
            
            const getVal = (possibleKeys: string[]) => {
                const key = Object.keys(row).find(k => possibleKeys.includes(k.toLowerCase().replace(/[^a-z0-9]/g, '')));
                return key ? String(row[key]).trim() : '';
            };

            fieldsToCheck.forEach(field => {
                if (!getVal(field.keys)) {
                    emptyCols.push(field.label);
                }
            });

            if (emptyCols.length > 0) {
                rowErrors.push({
                    rowNumber: i + 2, // 1 is header
                    emptyColumns: emptyCols
                });
            }
        }

        return { isValid: true, rowErrors };
    };

    const parseExcelFile = async (file: File) => {
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            // defval: '' agar kolom kosong tetap terbaca sebagai string kosong
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            // Menghapus ' (petik tunggal) di awal string jika user menambahkannya untuk mencegah auto-scientific Excel
            const sanitizedData = jsonData.map((row: any) => {
                const newRow = { ...row };
                for (const key in newRow) {
                    if (typeof newRow[key] === 'string' && newRow[key].startsWith("'")) {
                        newRow[key] = newRow[key].substring(1);
                    }

                    // Paksa NIK dan No HP menjadi format String asli di Javascript
                    // Dengan begitu, json_to_sheet otomatis akan menulis sel tersebut sebagai format Text tanpa petik ('s') 
                    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (cleanKey.includes('nik') || cleanKey.includes('nohp') || cleanKey.includes('hp') || cleanKey.includes('kontak')) {
                        if (newRow[key] !== null && newRow[key] !== undefined && newRow[key] !== '') {
                            newRow[key] = String(newRow[key]);
                        }
                    }
                }
                return newRow;
            });

            const validation = validateDataAndGetErrors(sanitizedData);
            if (!validation.isValid && validation.globalError) {
                setError(validation.globalError);
                return;
            }

            setParsedData(sanitizedData);
            setParsedErrors(validation.rowErrors || []);
            setIsReviewModalOpen(true);
        } catch (err) {
            console.error('Error parsing Excel file:', err);
            setError('Gagal membaca file Excel. Pastikan file tidak rusak.');
        }
    };

    const handleUpload = () => {
        if (selectedFile) parseExcelFile(selectedFile);
    };

    const handleConfirmReview = () => {
        const cleanData = parsedData.filter((_, idx) => !parsedErrors.some(e => e.rowNumber === idx + 2));
        onConfirm(cleanData);
        handleClose();
    };

    const handleCloseReview = () => setIsReviewModalOpen(false);

    const handleClose = () => {
        setSelectedFile(null);
        setError('');
        setParsedData([]);
        setParsedErrors([]);
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

    return (
        <>
            <Modal
                isOpen={isOpen && !isReviewModalOpen}
                onClose={handleClose}
                title={title}
                maxWidth="md"
            >
                <div className="space-y-6">
                    {/* Template Download Link */}
                    <div className="flex justify-end">
                        <Link
                            to="/dokumen"
                            className="text-blue-600 hover:text-blue-800 underline text-sm"
                            onClick={handleClose}
                        >
                            Unduh Templat Excel {templateName}
                        </Link>
                    </div>

                    {/* Panduan urutan upload */}
                    {dataType !== 'opd' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                            <p className="font-medium mb-1">️ Perhatian urutan upload:</p>
                            <p>
                                {dataType === 'kader'
                                    ? 'Pastikan data OPD sudah di-upload terlebih dahulu. Nama OPD di kolom "OPD" harus persis sama dengan yang ada di sistem.'
                                    : 'Pastikan data OPD dan Kader sudah di-upload terlebih dahulu. Nama OPD dan Kader harus persis sama dengan yang ada di sistem.'
                                }
                            </p>
                        </div>
                    )}

                    {/* Drop Area */}
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                            transition-all duration-200 ease-in-out
                            ${isDragActive && !isDragReject
                                ? 'border-blue-500 bg-blue-50'
                                : isDragReject
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                            }`}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center justify-center">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4
                                ${isDragActive && !isDragReject ? 'bg-blue-100' : isDragReject ? 'bg-red-100' : 'bg-blue-50'}`}>
                                <Upload size={40} className={
                                    isDragActive && !isDragReject ? 'text-blue-600' : isDragReject ? 'text-red-600' : 'text-blue-500'
                                } />
                            </div>
                            <div className="space-y-2">
                                {isDragActive ? (
                                    isDragReject
                                        ? <p className="text-red-600 font-medium">File harus berformat Excel!</p>
                                        : <p className="text-blue-600 font-medium">Lepaskan file di sini...</p>
                                ) : (
                                    <>
                                        <p className="text-gray-700 font-medium">Tarik & lepas file Excel di sini</p>
                                        <p className="text-gray-500 text-sm">atau klik untuk memilih file</p>
                                        <p className="text-gray-400 text-xs">Format: .xlsx, .xls</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {/* File terpilih */}
                    {selectedFile && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <FileSpreadsheet size={20} className="text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-gray-800 font-medium text-sm">{selectedFile.name}</p>
                                        <p className="text-gray-500 text-xs">{formatFileSize(selectedFile.size)}</p>
                                    </div>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); removeFile(); }}
                                    className="text-gray-400 hover:text-red-500 transition-colors" title="Hapus file">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    {selectedFile && (
                        <div className="flex justify-center pt-2">
                            <Button type="button" onClick={handleUpload}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-12">
                                Lanjutkan
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>

            <FileReviewModal
                isOpen={isReviewModalOpen}
                onClose={handleCloseReview}
                onConfirm={handleConfirmReview}
                data={parsedData}
                dataType={dataType}
                title={`Review ${title}`}
                errors={parsedErrors}
            />
        </>
    );
};

export default UploadExcelModal;