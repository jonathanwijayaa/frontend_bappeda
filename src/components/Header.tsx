import React from 'react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
    title: string;
    caption: string;
}

const Header: React.FC<HeaderProps> = ({ title, caption }) => {
    const { user } = useAuth();

    return (
        <div className="bg-white border-b border-gray-200 px-8 py-4">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
                    <p className="text-sm text-gray-500 mt-1">{caption}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-sm font-medium text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.roleDisplay}</p>
                    </div>
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                    />
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
