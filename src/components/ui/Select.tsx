import React, { SelectHTMLAttributes } from 'react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    options?: SelectOption[];
    placeholder?: string;
}

const Select: React.FC<SelectProps> = ({
    options = [],
    placeholder = 'Pilih...',
    className = '',
    ...props
}) => {
    return (
        <select
            className={`px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${className}`}
            {...props}
        >
            <option value="">{placeholder}</option>
            {options.map((option, index) => (
                <option key={index} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};

export default Select;
