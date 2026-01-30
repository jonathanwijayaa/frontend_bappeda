import React, { useState } from 'react';
import { Upload } from 'lucide-react';
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = () => {
        if (selectedFile) {
            console.log('Uploading file:', selectedFile);
            // Handle file upload logic here
            onClose();
            setSelectedFile(null);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        onClose();
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
                    <a
                        href="#"
                        className="text-blue-600 hover:text-blue-800 underline text-sm"
                        onClick={(e) => {
                            e.preventDefault();
                            console.log('Downloading template:', templateName);
                            // Handle template download
                        }}
                    >
                        Template Excel {templateName}
                    </a>
                </div>

                {/* Upload Icon and Area */}
                <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                        <Upload size={48} className="text-blue-500" />
                    </div>

                    <p className="text-gray-600 text-center mb-4">
                        {selectedFile ? selectedFile.name : 'Pilih file Excel untuk diunggah'}
                    </p>
                </div>

                {/* Upload Button */}
                <div className="flex justify-center">
                    <label className="cursor-pointer">
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <Button
                            type="button"
                            variant="primary"
                            className="px-8"
                        >
                            <Upload size={18} />
                            Unggah File
                        </Button>
                    </label>
                </div>

                {/* Submit Button */}
                {selectedFile && (
                    <div className="flex justify-center pt-4">
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
