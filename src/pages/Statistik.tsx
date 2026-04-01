//Statistik.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import DonutChart from '../components/charts/DonutChart';
import HorizontalBarChart from '../components/charts/HorizontalBarChart';
import { ChartData, StatistikState } from '../types/statistik.types';
import { apiFetch } from '../utils/api';

const Statistik: React.FC = () => {
    const { isSuperAdmin, user } = useAuth();
    const isOpd = user?.role === 'opd';

    const [state, setState] = useState<StatistikState>({
        gender: [],
        kelurahan: [],
        relawanPerKader: [],
        kaderPerOpd: [],    
        loading: true,
        error: null,
    });

    useEffect(() => {
    const fetchAll = async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            const [genderRes, kelurahanRes, relawanKaderRes, kaderOpdRes] =
                await Promise.all([
                    apiFetch('/statistik/gender').then(r => r.json()),
                    apiFetch('/statistik/kelurahan').then(r => r.json()),
                    apiFetch('/statistik/relawan-per-kader').then(r => r.json()),
                    apiFetch('/statistik/kader-per-opd').then(r => r.json()),
                ]);

            const genderFormatted: ChartData[] = genderRes.data.map(
                (d: { gender: string; jumlah: string }) => ({
                    name: d.gender === 'L' ? 'Laki-laki' : 'Perempuan',
                    value: parseInt(d.jumlah),
                })
            );

            const kelurahanFormatted: ChartData[] = kelurahanRes.data.map(
                (d: { kelurahan: string; jumlah: string }) => ({
                    name: d.kelurahan,
                    value: parseInt(d.jumlah),
                })
            );

            setState({
                gender: genderFormatted,
                kelurahan: kelurahanFormatted,
                relawanPerKader: relawanKaderRes.data.map((d: ChartData) => ({
                    ...d,
                    value: parseInt(d.value as any),
                })),
                kaderPerOpd: kaderOpdRes.data.map((d: ChartData) => ({
                    ...d,
                    value: parseInt(d.value as any),
                })),
                loading: false,
                error: null,
            });
        } catch (err) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: 'Gagal memuat data statistik.',
            }));
        }
    };

    fetchAll();
}, []);

    if (state.loading) return <p className="text-center py-10">Memuat statistik...</p>;
    if (state.error) return <p className="text-center text-red-500 py-10">{state.error}</p>;

    return (
        <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Kolom Kiri */}
            <div className="flex flex-col gap-6 flex-1">
                <Card title="Demografi Gender" collapsible>
                    <DonutChart data={state.gender} dataKey="value" nameKey="name" />
                </Card>

                <Card
                    title={
                        isOpd
                            ? 'Jumlah Relawan Per Kader (${user?.nama_opd ??})'
                            : 'Jumlah Relawan Per Kader'
                    }
                    collapsible
                >
                    <HorizontalBarChart
                        data={state.relawanPerKader}
                        dataKey="value"
                        xAxisKey="name"
                    />
                </Card>
            </div>

            {/* Kolom Kanan */}
            <div className="flex flex-col gap-6 flex-1">
                <Card title="Demografi Kelurahan" collapsible>
                    <HorizontalBarChart
                        data={state.kelurahan}
                        dataKey="value"
                        xAxisKey="name"
                        color="#E76F51"
                    />
                </Card>

                {/* Super admin: semua OPD | OPD: hanya OPD sendiri */}
                {(isSuperAdmin || isOpd) && (
                    <Card
                        title={
                            isOpd
                                ? 'Jumlah Kader (${user?.nama_opd ??})'
                                : 'Jumlah Kader Per OPD'
                        }
                        collapsible
                    >
                        <HorizontalBarChart
                            data={state.kaderPerOpd}
                            dataKey="value"
                            xAxisKey="name"
                        />
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Statistik;