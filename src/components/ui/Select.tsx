import React, { useState, useRef, useEffect, ButtonHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
    value: string;
    label: string;
}

// Gunakan ButtonHTMLAttributes karena elemen trigger berupa <button>
interface SelectProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
    options?: SelectOption[];
    placeholder?: string;
    value?: string;
    name?: string;
    onChange?: (e: { target: { value: string; name?: string } }) => void;
}

const Select: React.FC<SelectProps> = ({
    options = [],
    placeholder = 'Pilih...',
    value = '',
    onChange,
    disabled = false,
    className = '',
    name,
    onClick, // ambil onClick jika ada passing dari luar
    ...props
}) => {
    const [open, setOpen] = useState(false);
    const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
    const triggerRef = useRef<HTMLButtonElement>(null);

    // Cari label dari value yang sedang aktif
    const selectedOption = options.find(opt => opt.value === value);

    // Hitung posisi popup (serupa dengan logika YearPicker)
    const openPopup = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (disabled) return;

        if (onClick) {
            onClick(e);
        }

        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            // Estimasi tinggi maksimal dropdown list (max-h-60 = ~240px)
            const popupHeight = Math.min(options.length * 36 + 16, 240);
            const spaceBelow = window.innerHeight - rect.bottom;

            setPopupStyle({
                position: 'fixed',
                left: rect.left,
                width: rect.width,
                top: spaceBelow >= popupHeight
                    ? rect.bottom + 4           // Tampil ke bawah
                    : rect.top - popupHeight - 4, // Tampil ke atas jika ruang bawah sempit
                zIndex: 9999,
            });
        }
        setOpen(prev => !prev);
    };

    // Handler klik di luar untuk menutup dropdown
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (
                triggerRef.current &&
                !triggerRef.current.contains(e.target as Node) &&
                !(e.target as HTMLElement).closest('[data-select-popup]')
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // Handle pemilihan opsi
    const handleSelectOption = (optValue: string) => {
        if (onChange) {
            onChange({
                target: {
                    value: optValue,
                    name: name
                }
            });
        }
        setOpen(false);
    };

    // Elemen Popup Combobox
    const popup = open ? (
        <div
            data-select-popup
            style={popupStyle}
            className="bg-white border border-gray-200 rounded-xl shadow-2xl p-1.5 max-h-60 overflow-y-auto"
        >
            {/* Option default / Reset / Placeholder */}
            <button
                type="button"
                onClick={() => handleSelectOption('')}
                className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors mb-0.5
                    ${value === '' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-500 hover:bg-gray-100'}
                `}
            >
                <span>{placeholder}</span>
                {value === '' && <Check size={14} className="text-blue-600" />}
            </button>

            {/* List Option */}
            {options.map((option, index) => {
                const isSelected = option.value === value;
                return (
                    <button
                        key={index}
                        type="button"
                        onClick={() => handleSelectOption(option.value)}
                        className={`
                            w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors
                            ${isSelected
                                ? 'bg-blue-600 text-white font-semibold'
                                : 'text-gray-700 hover:bg-gray-100'}
                        `}
                    >
                        <span className="truncate">{option.label}</span>
                        {isSelected && <Check size={14} className="text-white flex-shrink-0 ml-2" />}
                    </button>
                );
            })}
        </div>
    ) : null;

    return (
        <div className={`relative ${className}`}>
            {/* Input Trigger Button */}
            <button
                ref={triggerRef}
                type="button"
                onClick={openPopup}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between gap-2 px-3 py-2 border rounded-lg bg-white text-xs transition-colors
                    ${disabled
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : open
                            ? 'border-blue-500 ring-2 ring-blue-500/20'
                            : 'border-gray-300 hover:border-blue-400 text-gray-900'
                    }
                `}
                {...props}
            >
                <span className={`truncate text-left ${!selectedOption?.value ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>

                <ChevronDown
                    size={14}
                    className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-blue-600' : ''}`}
                />
            </button>

            {/* Portal Popup agar tidak terpotong (overflow: hidden) oleh Card parent */}
            {typeof document !== 'undefined' && createPortal(popup, document.body)}
        </div>
    );
};

export default Select;