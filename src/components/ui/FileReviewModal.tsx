import React from 'react';
import Modal from './Modal';
import Button from './Button';

interface FileReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    data: any[];
    dataType: 'opd' | 'kader' | 'relawan';
    title: string;
}

const FileReviewModal: React.FC<FileReviewModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    data,
    dataType,
    title
}) => {
    const renderTableHeaders = () => {
        switch (dataType) {
            case 'opd':
                return (
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama OPD</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alamat</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PIC</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontak</th>
                    </tr>
                );
            case 'kader':
                return (
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Kader</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PIC</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontak</th>
                    </tr>
                );
            case 'relawan':
                return (
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIK</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alamat</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelurahan</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kader</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jabatan</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kedinasan</th>
                    </tr>
                );
        }
    };

    const renderTableRows = () => {
        return data.map((item, index) => {
            switch (dataType) {
                case 'opd':
                    return (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.namaOpd || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.status || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.alamat || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.pic || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.kontak || '-'}</td>
                        </tr>
                    );
                case 'kader':
                    return (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.namaKader || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.status || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.pic || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.kontak || '-'}</td>
                        </tr>
                    );
                case 'relawan':
                    return (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.namaLengkap || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.nik || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.alamat || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.kelurahan || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.kader || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.jabatan || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.kedinasan || '-'}</td>
                        </tr>
                    );
            }
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            subtitle={`Review data yang akan ditambahkan (${data.length} data)`}
            maxWidth="4xl"
        >
            <div className="space-y-6">
                {/* Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                {renderTableHeaders()}
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {renderTableRows()}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <span className="font-semibold">Perhatian:</span> Pastikan data yang ditampilkan sudah benar sebelum melakukan konfirmasi.
                        Data yang sudah dikonfirmasi akan langsung ditambahkan ke sistem.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 pt-2">
                    <Button
                        type="button"
                        onClick={onClose}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-12"
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        className="bg-green-600 hover:bg-green-700 text-white px-12"
                    >
                        Konfirmasi
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default FileReviewModal;
