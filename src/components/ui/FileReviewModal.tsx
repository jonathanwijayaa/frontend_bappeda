import React from "react";
import Modal from "./Modal";
import Button from "./Button";
import * as XLSX from "xlsx";

interface FileReviewModalProps {
  data: unknown[];
  dataType: "kader" | "opd" | "relawan";
  // Mengubah emptyColumns menjadi errorMessages agar menampung info error kosong maupun salah format
  errors?: { errorMessages: string[]; rowNumber: number }[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}

const FileReviewModal: React.FC<FileReviewModalProps> = ({
  data,
  dataType,
  errors = [],
  isOpen,
  onClose,
  onConfirm,
  title,
}) => {
  const cleanData = data.filter((_, idx) => !errors.some((e) => e.rowNumber === idx + 2));
  const dirtyDataList = data.filter((_, idx) => errors.some((e) => e.rowNumber === idx + 2));
  const hasDirtyData = dirtyDataList.length > 0;

  const downloadDirtyData = () => {
    const exportData = dirtyDataList.map((row) => {
      const originalIndex = data.findIndex((d) => d === row);
      const rowError = errors.find((e) => e.rowNumber === originalIndex + 2);
      return {
        ...row,
        Keterangan_Error: rowError ? rowError.errorMessages.join(" | ") : "Error tidak diketahui",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Kotor");
    XLSX.writeFile(workbook, `Data_Kotor_${dataType}.xlsx`);
  };

  const handleConfirm = () => {
    if (hasDirtyData) {
      downloadDirtyData();
    }
    onConfirm();
  };

  const renderTableHeaders = () => {
    switch (dataType) {
      case "opd":
        return (
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              No
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nama OPD
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Alamat
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              PIC
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              NIK PIC
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Kontak
            </th>
          </tr>
        );
      case "kader":
        return (
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              No
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              OPD
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nama Kader
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Deskripsi
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              PIC
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              NIK PIC
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              No HP
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Alamat PIC
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Kelurahan PIC
            </th>
          </tr>
        );
      case "relawan":
        return (
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              No
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nama Lengkap
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              L/P
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              NIK
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Alamat
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              No HP
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              OPD
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Kemantren
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Kelurahan
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Kader
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Jabatan
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Detail Jabatan
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Penugasan
            </th>
          </tr>
        );
    }
  };

  const renderTableRows = (displayData: unknown[]) => {
    return displayData.map((item, index) => {
      const r: Record<string, unknown> = {};
      for (const key of Object.keys(item)) {
        r[key.toLowerCase().replace(/[^a-z0-9]/g, "")] = item[key];
      }

      const get = (keys: string[]) => {
        for (const k of keys) if (r[k] !== undefined && r[k] !== "") return String(r[k]);
        return "-";
      };

      switch (dataType) {
        case "opd":
          return (
            <tr key={index} className="hover:bg-gray-50 border-b">
              <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{get(["namaopd", "nama"])}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{get(["status"])}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{get(["alamat"])}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{get(["pic", "namapic"])}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{get(["nikpic", "nik"])}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{get(["kontak", "nohp"])}</td>
            </tr>
          );
        case "kader":
          return (
            <tr key={index} className="hover:bg-gray-50 border-b">
              <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{get(["opd", "instansi"])}</td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {get(["namakader", "kader", "nama"])}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">{get(["deskripsi"])}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{get(["pic", "namapic"])}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{get(["nikpic", "nik"])}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{get(["nohp", "kontak", "hp"])}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{get(["alamatpic", "alamat"])}</td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {get(["kelurahanpic", "kelurahan"])}
              </td>
            </tr>
          );
        case "relawan":
          return (
            <tr key={index} className="hover:bg-gray-50 border-b">
              <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{get(["namalengkap", "nama"])}</td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {get(["jeniskelamin", "jk", "jenis"])}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">{get(["nik"])}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{get(["alamat", "alamatktp"])}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{get(["nohp", "hp", "telepon"])}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{get(["opd", "instansi"])}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{get(["kemantren", "kecamatan"])}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{get(["kelurahan", "desa"])}</td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {get(["kader", "komunitaskader"])}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">{get(["jabatan", "peran"])}</td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {get(["detailjabatan", "detail"])}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">{get(["penugasan", "tugas"])}</td>
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
      subtitle={`Review data yang akan ditambahkan. Tersedia ${cleanData.length} data bersih yang bisa diupload.`}
      maxWidth="6xl"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sisi Kiri: Data Bersih */}
          <div className="flex flex-col space-y-3 max-h-[500px]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-green-700">
                Data Bersih ({cleanData.length})
              </h3>
            </div>
            <div className="border border-green-200 rounded-lg overflow-y-auto flex-1 bg-white">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-green-50 sticky top-0 border-b border-green-200 z-10 shadow-sm">
                  {renderTableHeaders()}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cleanData.length > 0 ? (
                    renderTableRows(cleanData)
                  ) : (
                    <tr>
                      <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                        Tidak ada data bersih
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sisi Kanan: Data Kotor */}
          <div className="flex flex-col space-y-3 max-h-[500px]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-red-700">
                Data Kotor ({dirtyDataList.length})
              </h3>
              {hasDirtyData && (
                <span className="text-xs text-gray-400 italic">
                  File Excel akan otomatis terunduh saat simpan
                </span>
              )}
            </div>
            <div
              className={`border rounded-lg overflow-y-auto flex-1 bg-white ${hasDirtyData ? "border-red-200" : "border-gray-200"}`}
            >
              <table className="min-w-full divide-y divide-gray-200">
                <thead
                  className={`${hasDirtyData ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"} sticky top-0 border-b z-10 shadow-sm`}
                >
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Baris
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Keterangan Masalah Konten
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {hasDirtyData ? (
                    errors.map((err, idx) => (
                      <tr key={idx} className="hover:bg-red-50 border-b">
                        <td className="px-4 py-3 text-sm text-gray-900 text-center font-medium bg-red-50 border-r">
                          {err.rowNumber}
                        </td>
                        <td className="px-6 py-3 text-sm text-red-600 font-medium whitespace-pre-wrap">
                          {/* ── DI SINI PERUBAHAN MENJADI BULLET POINTS ── */}
                          {err.errorMessages.length === 1 ? (
                            <p>{err.errorMessages[0]}</p>
                          ) : (
                            <ul className="list-disc pl-5 space-y-1">
                              {err.errorMessages.map((msg, msgIdx) => (
                                <li key={msgIdx}>{msg}</li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-gray-500">
                        Tidak ada data kotor
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Informasi:</span>{" "}
            {hasDirtyData
              ? `Data bersih akan disimpan ke sistem dan file Excel berisi ${dirtyDataList.length} data kotor akan otomatis terunduh untuk diperbaiki.`
              : "Data bersih akan langsung ditambahkan ke sistem setelah Anda memberikan konfirmasi. Pastikan data sudah benar."}
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
            onClick={handleConfirm}
            disabled={cleanData.length === 0}
            className={`${cleanData.length === 0 ? "bg-gray-400 cursor-not-allowed opacity-50" : "bg-green-600 hover:bg-green-700"} text-white px-12 transition-colors`}
          >
            {cleanData.length === 0
              ? "Tidak Ada Data Bersih"
              : hasDirtyData
                ? `Simpan & Unduh Data Kotor (${dirtyDataList.length})`
                : "Simpan Data Bersih"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default FileReviewModal;
