import { useState, useEffect, useCallback } from 'react';
import apiClient from '../lib/axios';

export interface Kemantren {
    id: string;
    nama_kemantren: string;
}

export interface Kelurahan {
    id_kelurahan: string;
    id_kemantren: string;
    nama_kelurahan: string;
}

export const useWilayah = () => {
    const [kemantrenList, setKemantrenList] = useState<Kemantren[]>([]);
    const [kelurahanList, setKelurahanList] = useState<Kelurahan[]>([]);
    const [isLoadingKemantren, setIsLoadingKemantren] = useState(false);
    const [isLoadingKelurahan, setIsLoadingKelurahan] = useState(false);

    // Load Kemantren once on mount
    useEffect(() => {
        const fetchKemantren = async () => {
            setIsLoadingKemantren(true);
            try {
                const { data } = await apiClient.get('/wilayah/kemantren');
                if (data.success) {
                    setKemantrenList(data.data);
                }
            } catch (err) {
                console.error('Gagal mengambil data kemantren:', err);
            } finally {
                setIsLoadingKemantren(false);
            }
        };
        fetchKemantren();
    }, []);

    // Load Kelurahan when kemantren is selected
    const fetchKelurahanByKemantrenId = useCallback(async (idKemantren: string) => {
        if (!idKemantren) {
            setKelurahanList([]);
            return;
        }
        setIsLoadingKelurahan(true);
        try {
            const { data } = await apiClient.get(`/wilayah/kelurahan/${idKemantren}`);
            if (data.success) {
                setKelurahanList(data.data);
            }
        } catch (err) {
            console.error('Gagal mengambil data kelurahan:', err);
        } finally {
            setIsLoadingKelurahan(false);
        }
    }, []);

    return {
        kemantrenList,
        kelurahanList,
        fetchKelurahanByKemantrenId,
        isLoadingKemantren,
        isLoadingKelurahan,
        setKelurahanList
    };
};
