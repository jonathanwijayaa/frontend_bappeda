/**
 * hooks/useFormDirtyCheck.ts
 * Reusable hook untuk mendeteksi apakah form data berubah dibandingkan data asli.
 * Menggantikan pattern useMemo hasChanges yang duplikat di ManajemenOPD, DaftarKader, DataRelawan.
 */
import { useMemo } from "react";

/**
 * Bandingkan formData dengan originalData secara shallow.
 * @param formData - data form saat ini
 * @param originalData - data asli sebelum diedit (null = belum dipilih, selalu return false)
 * @param compareFn - opsional custom comparator. Jika tidak diberikan, default shallow compare semua key formData.
 * @returns boolean — true jika ada perubahan
 */
export function useFormDirtyCheck<
  TForm extends Record<string, unknown>,
  TOriginal extends Record<string, unknown>,
>(
  formData: TForm,
  originalData: TOriginal | null,
  compareFn?: (form: TForm, original: TOriginal) => boolean,
): boolean {
  return useMemo(() => {
    if (!originalData) return false;

    if (compareFn) {
      return compareFn(formData, originalData);
    }

    // Default: shallow compare setiap key di formData terhadap originalData
    return Object.keys(formData).some(
      (key) => formData[key] !== (originalData as Record<string, unknown>)[key],
    );
  }, [formData, originalData, compareFn]);
}
