/**
 * hooks/statistik/useStatistik.ts
 * Fetch semua data statistik secara paralel.
 */
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/axios';
import { ChartData } from '../../types/statistik.types';

export const STATISTIK_KEYS = {
    all: ['statistik'] as const,
    gender: () => [...STATISTIK_KEYS.all, 'gender'] as const,
    kelurahan: () => [...STATISTIK_KEYS.all, 'kelurahan'] as const,
    relawanPerKader: () => [...STATISTIK_KEYS.all, 'relawanPerKader'] as const,
    kaderPerOpd: () => [...STATISTIK_KEYS.all, 'kaderPerOpd'] as const,
};

// Ambil statistik relawan berdasarkan jenis kelamin.
export const useStatistikGender = () =>
    useQuery({
        queryKey: STATISTIK_KEYS.gender(),
        queryFn: async (): Promise<ChartData[]> => {
            const { data } = await apiClient.get('/statistik/gender');
            return data.data.map((d: { gender: string; jumlah: string }) => ({
                name: d.gender === 'L' ? 'Laki-laki' : 'Perempuan',
                value: parseInt(d.jumlah),
            }));
        },
    });

// Ambil statistik relawan berdasarkan kelurahan.
export const useStatistikKelurahan = () =>
    useQuery({
        queryKey: STATISTIK_KEYS.kelurahan(),
        queryFn: async (): Promise<ChartData[]> => {
            const { data } = await apiClient.get('/statistik/kelurahan');
            return data.data.map((d: { kelurahan: string; jumlah: string }) => ({
                name: d.kelurahan,
                value: parseInt(d.jumlah),
            }));
        },
    });

// Ambil statistik jumlah relawan per kader.
export const useStatistikRelawanPerKader = () =>
    useQuery({
        queryKey: STATISTIK_KEYS.relawanPerKader(),
        queryFn: async (): Promise<ChartData[]> => {
            const { data } = await apiClient.get('/statistik/relawan-per-kader');
            return data.data.map((d: ChartData) => ({ ...d, value: parseInt(d.value as any) }));
        },
    });

// Ambil statistik jumlah kader per OPD.
export const useStatistikKaderPerOpd = () =>
    useQuery({
        queryKey: STATISTIK_KEYS.kaderPerOpd(),
        queryFn: async (): Promise<ChartData[]> => {
            const { data } = await apiClient.get('/statistik/kader-per-opd');
            return data.data.map((d: ChartData) => ({ ...d, value: parseInt(d.value as any) }));
        },
    });
