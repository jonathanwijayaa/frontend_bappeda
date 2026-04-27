// components/ui/YearPicker.tsx
// Kalender picker hanya untuk tahun — menampilkan grid tahun dalam popup
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

interface YearPickerProps {
    value: string;           // tahun terpilih, '' jika belum dipilih
    onChange: (year: string) => void;
    placeholder?: string;
    minYear?: number;        // tahun minimum yang bisa dipilih
    maxYear?: number;        // tahun maksimum yang bisa dipilih
    className?: string;
}

const COLS = 4; // jumlah kolom grid tahun
const ROWS = 4; // jumlah baris — 4×4 = 16 tahun per halaman

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

    // Halaman yang ditampilkan — setiap halaman = COLS*ROWS tahun
    const pageSize = COLS * ROWS;
    const initialPage = selectedYear
        ? Math.floor((selectedYear - minYear) / pageSize)
        : Math.floor((maxYear - minYear) / pageSize);

    const [page, setPage] = useState(initialPage);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Tahun pertama yang ditampilkan di halaman ini
    const firstYear = minYear + page * pageSize;
    const years = Array.from({ length: pageSize }, (_, i) => firstYear + i).filter(
        y => y >= minYear && y <= maxYear
    );

    const canPrev = firstYear > minYear;
    const canNext = firstYear + pageSize - 1 < maxYear;

    // Tutup popup jika klik di luar
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelect = (year: number) => {
        onChange(String(year));
        setOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Input trigger */}
            <button
                type="button"
                onClick={() => setOpen(prev => !prev)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
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

            {/* Popup kalender tahun */}
            {open && (
                <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-56">
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
                                            ? 'text-gray-200 cursor-not-allowed'
                                            : isSelected
                                                ? 'bg-green-500 text-white shadow-sm'
                                                : isCurrent
                                                    ? 'bg-green-50 text-green-700 border border-green-200'
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
            )}
        </div>
    );
};

export default YearPicker;
