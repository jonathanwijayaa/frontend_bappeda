import React from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';

const UserSwitcher: React.FC = () => {
    const { user, switchUser } = useAuth();

    return (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-50">
            <p className="text-sm font-semibold mb-2">Demo: Switch User Role</p>
            <div className="flex gap-2">
                <Button
                    variant={user.role === 'super_admin' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => switchUser('super_admin')}
                >
                    Super Admin
                </Button>
                <Button
                    variant={user.role === 'opd' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => switchUser('opd')}
                >
                    OPD
                </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Current: {user.roleDisplay}</p>
        </div>
    );
};

export default UserSwitcher;
