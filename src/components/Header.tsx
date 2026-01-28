import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
    title: string;
    caption: string;
}

const Header: React.FC<HeaderProps> = ({ title, caption }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    const handleEditProfile = () => {
        setIsDropdownOpen(false);
        navigate('/edit-profil');
    };

    const handleLogout = () => {
        setIsDropdownOpen(false);
        // In production, this would clear auth tokens and redirect to login
        console.log('Logout clicked');
        alert('Logout functionality will be implemented');
    };

    return (
        <div className="bg-white border-b border-gray-200 px-8 py-4">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
                    <p className="text-sm text-gray-500 mt-1">{caption}</p>
                </div>
                <div className="flex items-center gap-3 relative" ref={dropdownRef}>
                    <div className="text-right">
                        <p className="text-sm font-medium text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.roleDisplay}</p>
                    </div>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="focus:outline-none"
                    >
                        <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-10 h-10 rounded-full cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all"
                        />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                            <button
                                onClick={handleEditProfile}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                <User size={18} />
                                <span>Edit Profil</span>
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                <LogOut size={18} />
                                <span>Keluar</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {title === 'Dashboard' && (
                <div className="mt-4 text-right">
                    <p className="text-sm italic text-gray-600">Data Ditampilkan secara real-time</p>
                </div>
            )}
        </div>
    );
};

export default Header;
