import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Link } from 'react-router-dom';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface UploadExcelModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    templateName: string;
}

const UploadExcelModal: React.FC<UploadExcelModalProps> = ({
    isOpen,
    onClose,
    title,
    templateName
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string>('');

    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
        setError('');

        if (rejectedFiles.length > 0) {
            setError('File harus berformat Excel (.xlsx atau .xls)');
            return;
        }

        if (acceptedFiles.length > 0) {
            setSelectedFile(acceptedFiles[0]);
        }
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

    const handleUpload = () => {
        if (selectedFile) {
            console.log('Uploading file:', selectedFile);
            // Handle file upload logic here
            handleClose();
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setError('');
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
        <Modal
            isOpen={isOpen}
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
                        Template Excel {templateName}
                    </Link>
                </div>

                {/* Dropzone Area */}
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
                                        File harus berformat Excel!
                                    </p>
                                ) : (
                                    <p className="text-blue-600 font-medium">
                                        Lepaskan file di sini...
                                    </p>
                                )
                            ) : (
                                <>
                                    <p className="text-gray-700 font-medium">
                                        Drag & drop file Excel di sini
                                    </p>
                                    <p className="text-gray-500 text-sm">
                                        atau klik untuk memilih file
                                    </p>
                                    <p className="text-gray-400 text-xs">
                                        Format yang didukung: .xlsx, .xls
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-600 text-sm text-center">{error}</p>
                    </div>
                )}

                {/* Selected File Display */}
                {selectedFile && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <FileSpreadsheet size={20} className="text-green-600" />
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
                            className="bg-green-600 hover:bg-green-700 text-white px-12"
                        >
                            Simpan
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default UploadExcelModal;
