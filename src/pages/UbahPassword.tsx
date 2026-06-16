// UbahPassword.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import RelawanMenu from '../components/RelawanMenu';
import Toast, { ToastType } from '../components/ui/Toast';
import { parseErrorMessage } from '../utils/parseErrorMessage';
import { Eye, EyeOff, CheckCircle2, XCircle, Circle, Loader2 } from 'lucide-react';
import apiClient from '../lib/axios';

interface ValidationRule {
    label: string;
    test: (password: string) => boolean;
}

// ── PENGUATAN AUTENTIKASI: ATURAN VALIDASI BARU ──
const validationRules: ValidationRule[] = [
    { label: 'Minimal 8 karakter', test: (p) => p.length >= 8 },
    { label: 'Mengandung angka', test: (p) => /\d/.test(p) },
    { 
        label: 'Minimal 1 karakter spesial (contoh: !, @, #, $, %, ^, *, _, +)', 
        test: (p) => /[^A-Za-z0-9]/.test(p) 
    },
];

const UbahPassword = () => {
    const [form, setForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // State untuk validasi password lama secara real-time
    const [oldPasswordStatus, setOldPasswordStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fungsi untuk memverifikasi password lama ke backend
    // Cek password lama ke backend sebelum user bisa menyimpan password baru.
    const verifyOldPassword = useCallback(async (password: string) => {
        if (!password.trim()) {
            setOldPasswordStatus('idle');
            return;
        }

        setOldPasswordStatus('checking');
        try {
            const { data: result } = await apiClient.post('/relawan/verify-password', { password });

            if (result.success && result.match) {
                setOldPasswordStatus('valid');
            } else {
                setOldPasswordStatus('invalid');
            }
        } catch {
            setOldPasswordStatus('invalid');
        }
    }, []);

    // Debounce verifikasi password lama (700ms setelah user berhenti mengetik)
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        if (!form.oldPassword.trim()) {
            setOldPasswordStatus('idle');
            return;
        }

        setOldPasswordStatus('checking');
        debounceTimerRef.current = setTimeout(() => {
            void verifyOldPassword(form.oldPassword);
        }, 700);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [form.oldPassword, verifyOldPassword]);

    const isNewPasswordValid = validationRules.every((r) => r.test(form.newPassword));
    const passwordsMatch = form.newPassword === form.confirmPassword && form.confirmPassword !== '';
    const canSubmit =
        oldPasswordStatus === 'valid' &&
        isNewPasswordValid &&
        passwordsMatch &&
        !isSubmitting;

    // Validasi dan kirim permintaan ubah kata sandi relawan.
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setIsSubmitting(true);
        try {
            const { data: result } = await apiClient.post('/relawan/change-password', {
                old_password: form.oldPassword,
                new_password: form.newPassword,
            });

            if (result.success) {
                setToast({ message: result.message || 'Kata sandi berhasil diubah!', type: 'success' });
                setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                setOldPasswordStatus('idle');
            } else {
                setToast({ message: result.message || 'Gagal mengubah kata sandi', type: 'error' });
            }
        } catch (e: any) {
            setToast({ message: parseErrorMessage(e, 'Terjadi kesalahan sistem'), type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper untuk menentukan border color berdasarkan status validasi password lama
    const getOldPasswordBorderClass = () => {
        switch (oldPasswordStatus) {
            case 'valid':
                return 'border-green-400 ring-1 ring-green-300';
            case 'invalid':
                return 'border-red-400 ring-1 ring-red-300';
            case 'checking':
                return 'border-yellow-400 ring-1 ring-yellow-300';
            default:
                return 'border-gray-300';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <RelawanMenu />

            <div className="px-4 py-6 max-w-md mx-auto">
                <h1 className="text-xl font-bold text-gray-800 text-center mb-4">Ubah Kata Sandi</h1>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 space-y-5">

                    {/* Old Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Kata Sandi Lama
                            {oldPasswordStatus === 'checking' && (
                                <Loader2 size={15} className="inline ml-2 text-yellow-500 animate-spin" />
                            )}
                            {oldPasswordStatus === 'valid' && (
                                <CheckCircle2 size={15} className="inline ml-2 text-green-500" />
                            )}
                            {oldPasswordStatus === 'invalid' && (
                                <XCircle size={15} className="inline ml-2 text-red-500" />
                            )}
                        </label>
                        <div className={`flex items-center border rounded-xl px-3 transition-colors ${getOldPasswordBorderClass()} focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-400`}>
                            <input
                                id="old-password"
                                type={showOld ? 'text' : 'password'}
                                value={form.oldPassword}
                                onChange={(e) => setForm((p) => ({ ...p, oldPassword: e.target.value }))}
                                placeholder="Masukkan kata sandi lama"
                                className="flex-1 py-3 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowOld((v) => !v)}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                tabIndex={-1}
                            >
                                {showOld ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                        </div>
                        {oldPasswordStatus === 'invalid' && (
                            <p className="text-xs text-red-500 mt-1.5">Kata sandi lama tidak sesuai.</p>
                        )}
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Kata Sandi Baru</label>
                        <div className={`flex items-center border rounded-xl px-3 transition-colors ${
                            form.newPassword === ''
                                ? 'border-gray-300'
                                : isNewPasswordValid
                                ? 'border-green-400 ring-1 ring-green-300'
                                : 'border-red-400 ring-1 ring-red-300'
                        } focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-400`}>
                            <input
                                id="new-password"
                                type={showNew ? 'text' : 'password'}
                                value={form.newPassword}
                                onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                                placeholder="Masukkan kata sandi baru"
                                className="flex-1 py-3 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew((v) => !v)}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                tabIndex={-1}
                            >
                                {showNew ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                        </div>

                        {/* Validation hints */}
                        {form.newPassword !== '' && !isNewPasswordValid && (
                            <p className="text-xs text-red-500 mt-1.5">
                                Harap penuhi semua syarat kata sandi di bawah ini.
                            </p>
                        )}

                        <ul className="mt-2.5 space-y-1.5">
                            {validationRules.map((rule) => {
                                const passed = rule.test(form.newPassword);
                                return (
                                    <li key={rule.label} className="flex items-center gap-2">
                                        {passed ? (
                                            <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                                        ) : (
                                            <Circle size={14} className={`flex-shrink-0 ${form.newPassword ? 'text-red-400' : 'text-gray-300'}`} />
                                        )}
                                        <span className={`text-xs ${passed ? 'text-green-600' : form.newPassword ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                            {rule.label}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Kata Sandi Baru</label>
                        <div className={`flex items-center border rounded-xl px-3 transition-colors ${
                            form.confirmPassword === ''
                                ? 'border-gray-300'
                                : passwordsMatch
                                ? 'border-green-400 ring-1 ring-green-300'
                                : 'border-red-400 ring-1 ring-red-300'
                        } focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-400`}>
                            <input
                                id="confirm-password"
                                type={showConfirm ? 'text' : 'password'}
                                value={form.confirmPassword}
                                onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                                placeholder="Ulangi kata sandi baru"
                                className="flex-1 py-3 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm((v) => !v)}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                tabIndex={-1}
                            >
                                {showConfirm ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                        </div>
                        {form.confirmPassword !== '' && !passwordsMatch && (
                            <p className="text-xs text-red-500 mt-1.5">Kata Sandi tidak cocok.</p>
                        )}
                        {passwordsMatch && (
                            <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                                <CheckCircle2 size={13} /> Kata sandi cocok
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                            canSubmit
                                ? 'bg-green-600 hover:bg-green-700 active:scale-95 shadow-md shadow-green-200'
                                : 'bg-gray-300 cursor-not-allowed'
                        }`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            'Ubah Kata Sandi'
                        )}
                    </button>
                </form>

                {/* Info card */}
                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-xs text-blue-700 leading-relaxed">
                        <span className="font-semibold">Tips:</span> Gunakan kombinasi huruf, angka, dan karakter spesial (!@#$%^&*()_+) agar kata sandi lebih tangguh dan aman dari ancaman peretasan.
                    </p>
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default UbahPassword;