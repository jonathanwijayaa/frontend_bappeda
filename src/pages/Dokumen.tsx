import React from "react";
import { FileText, Download, BookOpen } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

import templateRelawan from "../excel/Template_Data_Relawan.xlsx";
import templateOPD from "../excel/Template_Data_OPD.xlsx";
import templateKader from "../excel/Template_Data_Kader.xlsx";
import {DocumentItem} from "../types/dokumen.types";

const Dokumen: React.FC = () => {
  const documents: DocumentItem[] = [
    {
      description: "Panduan lengkap penggunaan aplikasi untuk semua pengguna",
      fileName: "Buku_Panduan_Aplikasi.pdf",
      icon: <BookOpen size={24} className="text-blue-600" />,
      id: "guidebook",
      title: "Buku Panduan Aplikasi",
    },
    {
      description: "Format untuk mengunggah data relawan secara massal",
      downloadUrl: templateRelawan,
      fileName: "Template_Data_Relawan.xlsx",
      icon: <FileText size={24} className="text-green-600" />,
      id: "template-relawan",
      title: "Format Excel Data Relawan",
    },
    {
      description: "Format untuk mengunggah data OPD secara massal",
      downloadUrl: templateOPD,
      fileName: "Template_Data_OPD.xlsx",
      icon: <FileText size={24} className="text-green-600" />,
      id: "template-opd",
      title: "Format Excel Data OPD",
    },
    {
      description: "Format untuk mengunggah data kader secara massal",
      downloadUrl: templateKader,
      fileName: "Template_Data_Kader.xlsx",
      icon: <FileText size={24} className="text-teal-600" />,
      id: "template-kader",
      title: "Format Excel Data Kader",
    },
  ];

  // Unduh file template atau panduan jika URL file tersedia.
  const handleDownload = (doc: DocumentItem) => {
    if (!doc.downloadUrl) {
      return;
    }

    const link = document.createElement("a");
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
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{doc.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{doc.description}</p>

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
          <h4 className="font-semibold text-blue-900 mb-2">Informasi Penting</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Pastikan menggunakan format Excel yang sesuai saat mengunggah data</li>
            <li>Jangan mengubah struktur kolom pada format Excel</li>
            <li>Untuk bantuan lebih lanjut, silakan baca guidebook aplikasi</li>
            <li>Hubungi administrator jika mengalami kendala</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default Dokumen;
