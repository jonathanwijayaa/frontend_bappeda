import React, { useState } from 'react';
import { Phone, MessageCircle, Clock } from 'lucide-react';
import Card from '../components/ui/Card';
import RelawanMenu from '../components/RelawanMenu';
import { useAuth } from '../context/AuthContext';

const SaranHotline: React.FC = () => {
    const { user } = useAuth();
    const isRelawan = user?.role === 'relawan';

    const [formData, setFormData] = useState({
        namaLengkap: '',
        noTelepon: '',
        saran: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate form
        if (!formData.namaLengkap || !formData.noTelepon || !formData.saran) {
            alert('Mohon lengkapi semua field');
            return;
        }

        // Log submission (API Call)
        console.log('Form submitted:', formData);
        alert('Terima kasih! Saran Anda telah dikirim.');

        // Reset form
        setFormData({
            namaLengkap: '',
            noTelepon: '',
            saran: ''
        });
    };

    // Shared contact info content
    const contactInfo = (
        <div className="space-y-5">
            {/* Telepon */}
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="text-gray-600" size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-600 mb-1">Telepon</p>
                    <p className="text-base font-semibold text-gray-800">0274-XXXXXXX</p>
                </div>
            </div>

            {/* WhatsApp */}
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="text-gray-600" size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-600 mb-1">WhatsApp</p>
                    <p className="text-base font-semibold text-gray-800">+62 812-XXXX-XXXX</p>
                </div>
            </div>

            {/* Jam Layanan */}
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="text-gray-600" size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-600 mb-1">Jam Layanan</p>
                    <p className="text-base font-semibold text-gray-800">Senin–Jumat, 08.00–16.00</p>
                </div>
            </div>
        </div>
    );

    // Shared form content
    const feedbackForm = (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama Lengkap */}
            <div>
                <input
                    type="text"
                    name="namaLengkap"
                    value={formData.namaLengkap}
                    onChange={handleInputChange}
                    placeholder="Nama Lengkap"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
            </div>

            {/* No. Telepon */}
            <div>
                <input
                    type="tel"
                    name="noTelepon"
                    value={formData.noTelepon}
                    onChange={handleInputChange}
                    placeholder="No. Telepon"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
            </div>

            {/* Saran */}
            <div>
                <textarea
                    name="saran"
                    value={formData.saran}
                    onChange={handleInputChange}
                    placeholder="Saran"
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
                />
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
                Kirim
            </button>
        </form>
    );

    // Mobile layout for Relawan
    if (isRelawan) {
        return (
            <div className="min-h-screen bg-gray-50">
                <RelawanMenu title="Icon App" />

                <div className="px-4 py-5 space-y-4">
                    {/* Page Title */}
                    <h1 className="text-2xl font-bold text-gray-800 text-center">Saran/Hotline</h1>

                    {/* Contact Information */}
                    <Card className="shadow-md">
                        <div className="p-4">
                            <h2 className="text-base font-bold text-gray-800 mb-4">Hotline BAPPEDA Kota Yogyakarta</h2>
                            {contactInfo}
                        </div>
                    </Card>

                    {/* Feedback Form */}
                    <Card className="shadow-md">
                        <div className="p-4">
                            {feedbackForm}
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    // Desktop layout for SuperAdmin / OPD
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sisi Kiri - Contact Information */}
                <Card title="Hotline BAPPEDA Kota Yogyakarta">
                    {contactInfo}
                </Card>

                {/* Sisi Kanan - Feedback Form */}
                <Card>
                    {feedbackForm}
                </Card>
            </div>
        </div>
    );
};

export default SaranHotline;
