// components/ui/YearPicker.tsx
// Kalender picker hanya untuk tahun — popup via Portal agar tidak terclip oleh overflow:hidden parent
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

interface YearPickerProps {
    value: string;
    onChange: (year: string) => void;
    placeholder?: string;
    minYear?: number;
    maxYear?: number;
    className?: string;
}

const COLS = 4;
const ROWS = 4;

const YearPicker: React.FC<YearPickerProps> = ({
    value,
    onChange,
    placeholder = 'Pilih Tahun',
    minYear = 2000,
    maxYear = new Date().getFullYear(),
    className = '',
}) => {
    const currentYear = new Date().getFullYear();
    const selectedYear = value ? Number(value) : null;

    const pageSize = COLS * ROWS;
    const initialPage = selectedYear
        ? Math.floor((selectedYear - minYear) / pageSize)
        : Math.floor((maxYear - minYear) / pageSize);

    const [page, setPage] = useState(initialPage);
    const [open, setOpen] = useState(false);
    const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});

    const triggerRef = useRef<HTMLButtonElement>(null);

    const firstYear = minYear + page * pageSize;
    const years = Array.from({ length: pageSize }, (_, i) => firstYear + i).filter(
        y => y >= minYear && y <= maxYear
    );

    const canPrev = firstYear > minYear;
    const canNext = firstYear + pageSize - 1 < maxYear;

    // Hitung posisi popup berdasarkan posisi trigger button
    const openPopup = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const popupHeight = 210; // perkiraan tinggi popup
            const spaceBelow = window.innerHeight - rect.bottom;

            setPopupStyle({
                position: 'fixed',
                left: rect.left,
                width: rect.width < 224 ? 224 : rect.width, // minimal 14rem (w-56)
                top: spaceBelow >= popupHeight
                    ? rect.bottom + 4          // tampil ke bawah
                    : rect.top - popupHeight - 4, // tampil ke atas jika tidak cukup
                zIndex: 9999,
            });
        }
        setOpen(prev => !prev);
    };

    // Tutup jika klik di luar
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (
                triggerRef.current &&
                !triggerRef.current.contains(e.target as Node) &&
                !(e.target as HTMLElement).closest('[data-yearpicker-popup]')
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Reset halaman ketika minYear berubah (tahun akhir mengikuti tahun awal)
    useEffect(() => {
        const newInitial = selectedYear
            ? Math.floor((Math.max(selectedYear, minYear) - minYear) / pageSize)
            : Math.floor((maxYear - minYear) / pageSize);
        setPage(Math.max(0, newInitial));
    }, [minYear]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSelect = (year: number) => {
        onChange(String(year));
        setOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    const popup = open ? (
        <div
            data-yearpicker-popup
            style={popupStyle}
            className="bg-white border border-gray-200 rounded-xl shadow-2xl p-3"
        >
            {/* Header navigasi halaman */}
            <div className="flex items-center justify-between mb-2">
                <button
                    type="button"
                    onClick={() => setPage(p => p - 1)}
                    disabled={!canPrev}
                    className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-semibold text-gray-600">
                    {firstYear} – {Math.min(firstYear + pageSize - 1, maxYear)}
                </span>
                <button
                    type="button"
                    onClick={() => setPage(p => p + 1)}
                    disabled={!canNext}
                    className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Grid tahun */}
            <div className="grid grid-cols-4 gap-1">
                {years.map(year => {
                    const isSelected = year === selectedYear;
                    const isCurrent = year === currentYear;
                    const isDisabled = year < minYear || year > maxYear;

                    return (
                        <button
                            key={year}
                            type="button"
                            onClick={() => !isDisabled && handleSelect(year)}
                            disabled={isDisabled}
                            className={`
                                py-1.5 rounded-lg text-xs font-medium transition-colors
                                ${isDisabled
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : isSelected
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : isCurrent
                                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                            : 'hover:bg-gray-100 text-gray-700'
                                }
                            `}
                        >
                            {year}
                        </button>
                    );
                })}
            </div>
        </div>
    ) : null;

    return (
        <div className={`relative ${className}`}>
            {/* Input trigger */}
            <button
                ref={triggerRef}
                type="button"
                onClick={openPopup}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
                <span className="flex items-center gap-2">
                    <CalendarDays size={14} className="text-gray-400 flex-shrink-0" />
                    <span className={selectedYear ? 'text-gray-800 font-medium' : 'text-gray-400'}>
                        {selectedYear ?? placeholder}
                    </span>
                </span>
                {selectedYear ? (
                    <span
                        onClick={handleClear}
                        className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer text-xs leading-none"
                        title="Hapus pilihan"
                    >
                        ✕
                    </span>
                ) : (
                    <ChevronRight size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`} />
                )}
            </button>

            {/* Render popup via Portal agar tidak terclip oleh overflow:hidden parent (Card, dll) */}
            {typeof document !== 'undefined' && createPortal(popup, document.body)}
        </div>
    );
};

export default YearPicker;
