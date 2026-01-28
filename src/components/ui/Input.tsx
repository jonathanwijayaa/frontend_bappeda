import React, { InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
    type = 'text',
    placeholder = '',
    className = '',
    icon,
    ...props
}) => {
    return (
        <div className="relative">
            {icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {icon}
                </div>
            )}
            <input
                type={type}
                placeholder={placeholder}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${icon ? 'pl-10' : ''
                    } ${className}`}
                {...props}
            />
        </div>
    );
};

interface SearchInputProps extends Omit<InputProps, 'icon'> {
    placeholder?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
    placeholder = 'Cari',
    ...props
}) => {
    return (
        <Input
            placeholder={placeholder}
            icon={<Search size={18} />}
            {...props}
        />
    );
};

export default Input;
