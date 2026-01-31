import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Login = () => {
    const [nik, setNik] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!nik.trim() || !password.trim()) {
            setError('NIK dan Password harus diisi');
            return;
        }

        setIsLoading(true);

        try {
            const result = await login(nik, password);
            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.message || 'Login gagal');
            }
        } catch (err) {
            setError('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="shadow-lg">
                    <div className="p-8">
                        <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">
                            Selamat Datang
                        </h1>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* NIK Input */}
                            <div>
                                <label htmlFor="nik" className="block text-sm font-medium text-gray-700 mb-2">
                                    NIK
                                </label>
                                <Input
                                    id="nik"
                                    type="text"
                                    value={nik}
                                    onChange={(e) => setNik(e.target.value)}
                                    placeholder=""
                                    className="bg-gray-100"
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Password Input */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder=""
                                    className="bg-gray-100"
                                    showPasswordToggle
                                    disabled={isLoading}
                                />
                                <div className="mt-2 text-right">
                                    <a
                                        href="#"
                                        className="text-sm text-gray-600 hover:text-gray-800 underline"
                                        onClick={(e) => e.preventDefault()}
                                    >
                                        Lupa Password ?
                                    </a>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="mx-auto w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Memproses...' : 'Masuk'}
                            </Button>
                        </form>

                        {/* Demo Credentials Info */}
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-800 font-semibold mb-2">Demo Credentials:</p>
                            <p className="text-xs text-blue-700">Super Admin - NIK: 123456, Password: admin123</p>
                            <p className="text-xs text-blue-700">OPD - NIK: 654321, Password: opd123</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Login;
