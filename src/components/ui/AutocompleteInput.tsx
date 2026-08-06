import React, { useState, useRef, useEffect } from 'react';

interface AutocompleteOption {
    label: string;  // teks yang ditampilkan di dropdown
    value: string;  // nilai yang disimpan ke state form
}

interface AutocompleteInputProps {
    name: string;
    value: string;
    options: AutocompleteOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
    /** Jika true, teks yang tidak cocok data akan menampilkan warning (bukan error) */
    warnIfNotFound?: boolean;
    warnMessage?: string;
    disabled?: boolean;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
    name,
    value,
    options,
    onChange,
    placeholder = 'Ketik untuk mencari...',
    className = '',
    required = false,
    warnIfNotFound = true,
    warnMessage = 'Nilai ini tidak ditemukan di database. Pastikan ejaan sudah benar.',
    disabled = false,
}) => {
    const [inputValue, setInputValue] = useState(value);
    const [isOpen, setIsOpen] = useState(false);
    const [filtered, setFiltered] = useState<AutocompleteOption[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync inputValue with external value prop
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setInputValue(text);
        onChange(text);

        if (text.trim().length > 0) {
            const results = options.filter(opt =>
                opt.label.toLowerCase().includes(text.toLowerCase())
            );
            setFiltered(results);
            setIsOpen(true);
        } else {
            setFiltered(options);
            setIsOpen(options.length > 0);
        }
    };

    const handleFocus = () => {
        const results = inputValue.trim()
            ? options.filter(opt => opt.label.toLowerCase().includes(inputValue.toLowerCase()))
            : options;
        setFiltered(results);
        setIsOpen(results.length > 0);
    };

    const handleSelect = (opt: AutocompleteOption) => {
        setInputValue(opt.label);
        onChange(opt.label);
        setIsOpen(false);
    };

    // Determine if current value is in options (case-insensitive)
    const isMatchFound = inputValue.trim() === '' ||
        options.some(opt => opt.label.toLowerCase() === inputValue.toLowerCase());

    const showWarning = warnIfNotFound && !isMatchFound && inputValue.trim().length > 0;

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            <input
                type="text"
                name={name}
                value={inputValue}
                onChange={handleInput}
                onFocus={handleFocus}
                placeholder={placeholder}
                required={required}
                autoComplete="off"
                disabled={disabled}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm transition-colors ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' :
                        showWarning
                            ? 'border-yellow-400 focus:ring-yellow-300'
                            : 'border-gray-400 focus:ring-blue-500'
                    }`}
            />

            {/* Warning badge */}
            {showWarning && (
                <div className="mt-1 flex items-start gap-1 text-yellow-700 text-xs">
                    <span>️</span>
                    <span>{warnMessage}</span>
                </div>
            )}

            {/* Dropdown suggestions */}
            {isOpen && filtered.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    {filtered.map((opt, idx) => (
                        <li
                            key={idx}
                            onMouseDown={(e) => {
                                e.preventDefault(); // prevent blur before click
                                handleSelect(opt);
                            }}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-800 transition-colors"
                        >
                            {/* Highlight matching text */}
                            {highlightMatch(opt.label, inputValue)}
                        </li>
                    ))}
                </ul>
            )}

            {/* No result info */}
            {isOpen && filtered.length === 0 && inputValue.trim().length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-2 text-sm text-gray-400 italic">
                    Tidak ditemukan di database. Input bebas tetap diterima.
                </div>
            )}
        </div>
    );
};

// Helper: bold the matching part of text in dropdown
function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
        <>
            {text.slice(0, idx)}
            <strong className="text-blue-600">{text.slice(idx, idx + query.length)}</strong>
            {text.slice(idx + query.length)}
        </>
    );
}

export default AutocompleteInput;
