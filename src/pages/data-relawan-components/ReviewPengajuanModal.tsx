import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import type { PengajuanAPIData } from "../../types/relawan.types";

interface ReviewPengajuanModalProps {
  isOpen: boolean;
  onClose: () => void;
  pengajuan: PengajuanAPIData | null;
  onReview: (status: "Disetujui" | "Ditolak", note: string) => Promise<void>;
  isReviewing: boolean;
}

export const ReviewPengajuanModal: React.FC<ReviewPengajuanModalProps> = ({
  isOpen,
  onClose,
  pengajuan,
  onReview,
  isReviewing,
}) => {
  const [verificationNote, setVerificationNote] = useState("");
  const [isDataChecked, setIsDataChecked] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVerificationNote("");
      setIsDataChecked(false);
    }
  }, [isOpen]);

  if (!pengajuan) return null;
  const isPending = pengajuan.status_pengajuan === "Menunggu Review";

  let dataBaru: Record<string, unknown> = {};
  try {
    dataBaru =
      typeof pengajuan.data_baru === "string"
        ? JSON.parse(pengajuan.data_baru)
        : (pengajuan.data_baru as Record<string, unknown>) || {};
  } catch {
    dataBaru = {};
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isPending ? "Review Pengajuan Perubahan Data" : "Detail Riwayat Pengajuan"}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {!isPending && (
          <div
            className={`p-3 rounded-lg border text-sm flex items-center justify-between ${
              pengajuan.status_pengajuan === "Ditolak"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-green-50 border-green-200 text-green-800"
            }`}
          >
            <span className="font-semibold">Status: {pengajuan.status_pengajuan}</span>
            {pengajuan.tanggal_verifikasi && (
              <span className="text-xs">
                Diproses: {new Date(pengajuan.tanggal_verifikasi).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-blue-800">Informasi Pengajuan</p>
          <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
            <span className="font-medium">NIK:</span>
            <span>{pengajuan.nik}</span>
            <span className="font-medium">Nama:</span>
            <span>{pengajuan.nama_lengkap}</span>
            <span className="font-medium">Jenis Perubahan:</span>
            <span>{pengajuan.jenis_perubahan}</span>
            <span className="font-medium">Catatan Relawan:</span>
            <span>{pengajuan.catatan_relawan || "-"}</span>
            {pengajuan.nama_verifikator && (
              <>
                <span className="font-medium">Diverifikasi Oleh:</span>
                <span className="font-semibold text-gray-900">{pengajuan.nama_verifikator}</span>
              </>
            )}
          </div>
        </div>

        {Object.keys(dataBaru).length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-yellow-800">Detail Perubahan yang Diajukan</p>
            <div className="grid grid-cols-2 gap-2 text-sm text-yellow-700">
              {Boolean(dataBaru.nama_lengkap) && (
                <>
                  <span className="font-medium">Nama Lengkap Baru:</span>
                  <span className="font-semibold">{String(dataBaru.nama_lengkap)}</span>
                </>
              )}
              {Boolean(dataBaru.alamat_ktp) && (
                <>
                  <span className="font-medium">Alamat KTP Baru:</span>
                  <span className="font-semibold">{String(dataBaru.alamat_ktp)}</span>
                </>
              )}
            </div>
          </div>
        )}

        {isPending ? (
          <>
            <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
              <input
                type="checkbox"
                id="dataChecked"
                checked={isDataChecked}
                onChange={(e) => setIsDataChecked(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor="dataChecked" className="text-sm text-gray-700">
                Saya telah memverifikasi kebenaran data yang diajukan
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Verifikator (opsional)</label>
              <textarea
                value={verificationNote}
                onChange={(e) => setVerificationNote(e.target.value)}
                placeholder="Tuliskan catatan untuk relawan..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button onClick={onClose} className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-6">Batal</Button>
              <Button
                onClick={() => onReview("Ditolak", verificationNote)}
                disabled={!isDataChecked || isReviewing}
                className="bg-red-600 hover:bg-red-700 text-white px-6 disabled:opacity-50"
              >
                {isReviewing ? <Loader2 size={16} className="animate-spin" /> : "Tolak"}
              </Button>
              <Button
                onClick={() => onReview("Disetujui", verificationNote)}
                disabled={!isDataChecked || isReviewing}
                className="bg-green-600 hover:bg-green-700 text-white px-6 disabled:opacity-50"
              >
                {isReviewing ? <Loader2 size={16} className="animate-spin" /> : "Setujui"}
              </Button>
            </div>
          </>
        ) : (
          <>
            {pengajuan.catatan_verifikator && (
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                <span className="font-semibold text-gray-700 block mb-1">Catatan dari Verifikator:</span>
                <p className="text-gray-600">{pengajuan.catatan_verifikator}</p>
              </div>
            )}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button onClick={onClose} className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-8">Tutup</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};