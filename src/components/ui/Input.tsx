import React, { InputHTMLAttributes, useState } from 'react';
import { Search, Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    showPasswordToggle?: boolean;
}

const Input: React.FC<InputProps> = ({
    type = 'text',
    placeholder = '',
    className = '',
    icon,
    showPasswordToggle = false,
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

    return (
        <div className="relative">
            {icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">
                    {icon}
                </div>
            )}
            <input
                type={inputType}
                placeholder={placeholder}
                className={`w-full px-4 py-2 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent  ${icon ? 'pl-10' : ''
                    } ${showPasswordToggle ? 'pr-10' : ''} ${className}`}
                {...props}
            />
            {showPasswordToggle && (
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            )}
        </div>
    );
};

interface SearchInputProps extends Omit<InputProps, 'icon'> {
    placeholder?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
    placeholder = 'Cari',
    className = '',
    ...props
}) => {
    return (
        <Input
            placeholder={placeholder}
            icon={<Search size={18} />}
            className={`bg-[#ffffff] ${className}`}
            {...props}
        />
    );
};

export default Input;
