import React from 'react';
import { FileText, Download, BookOpen } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

import templateRelawan from '../excel/Template_Data_Relawan.xlsx';
import templateOPD from '../excel/Template_Data_OPD.xlsx';
import templateKader from '../excel/Template_Data_Kader.xlsx';

interface DocumentItem {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    fileName: string;
    downloadUrl?: string;
}

const Dokumen: React.FC = () => {
    const documents: DocumentItem[] = [
        {
            id: 'guidebook',
            title: 'Buku Panduan Aplikasi',
            description: 'Panduan lengkap penggunaan aplikasi untuk semua pengguna',
            icon: <BookOpen size={24} className="text-blue-600" />,
            fileName: 'Buku_Panduan_Aplikasi.pdf'
        },
        {
            id: 'template-relawan',
            title: 'Templat Excel Data Relawan',
            description: 'Templat untuk mengunggah data relawan secara massal',
            icon: <FileText size={24} className="text-green-600" />,
            fileName: 'Template_Data_Relawan.xlsx',
            downloadUrl: templateRelawan
        },
        {
            id: 'template-opd',
            title: 'Templat Excel Data OPD',
            description: 'Templat untuk mengunggah data OPD secara massal',
            icon: <FileText size={24} className="text-green-600" />,
            fileName: 'Template_Data_OPD.xlsx',
            downloadUrl: templateOPD
        },
        {
            id: 'template-kader',
            title: 'Templat Excel Data Kader',
            description: 'Templat untuk mengunggah data kader secara massal',
            icon: <FileText size={24} className="text-teal-600" />,
            fileName: 'Template_Data_Kader.xlsx',
            downloadUrl: templateKader
        }
    ];

    // Unduh file template atau panduan jika URL file tersedia.
    const handleDownload = (doc: DocumentItem) => {
        if (!doc.downloadUrl) {
            console.log('File belum tersedia:', doc.fileName);
            return;
        }

        const link = document.createElement('a');
        link.href = doc.downloadUrl;
        link.download = doc.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {documents.map((doc) => (
                    <Card key={doc.id}>
                        <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className="shrink-0 w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                                {doc.icon}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {doc.title}
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    {doc.description}
                                </p>

                                {/* Download Button */}
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleDownload(doc)}
                                    className="flex items-center gap-2"
                                >
                                    <Download size={16} />
                                    Unduh
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Info Card */}
            <Card>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">
                        Informasi Penting
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>Pastikan menggunakan templat Excel yang sesuai saat mengunggah data</li>
                        <li>Jangan mengubah struktur kolom pada templat Excel</li>
                        <li>Untuk bantuan lebih lanjut, silakan baca guidebook aplikasi</li>
                        <li>Hubungi administrator jika mengalami kendala</li>
                    </ul>
                </div>
            </Card>
        </div>
    );
};

export default Dokumen;
