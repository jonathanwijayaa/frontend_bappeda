import { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "../lib/axios";
import type { AutoOption } from "../types/common.types";

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
        const { data } = await apiClient.get("/wilayah/kemantren");
        if (data.success) {
          setKemantrenList(data.data);
        }
      } catch (err) {
        console.error("Gagal mengambil data kemantren:", err);
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
      console.error("Gagal mengambil data kelurahan:", err);
    } finally {
      setIsLoadingKelurahan(false);
    }
  }, []);

  // Computed options — agar consumer tidak perlu useMemo manual
  const kemantrenOptions = useMemo<AutoOption[]>(
    () => kemantrenList.map((item) => ({ label: item.nama_kemantren, value: item.id })),
    [kemantrenList],
  );

  const kelurahanOptions = useMemo<AutoOption[]>(
    () => kelurahanList.map((item) => ({ label: item.nama_kelurahan, value: item.id_kelurahan })),
    [kelurahanList],
  );

  return {
    fetchKelurahanByKemantrenId,
    isLoadingKelurahan,
    isLoadingKemantren,
    kelurahanList,
    kelurahanOptions,
    kemantrenList,
    kemantrenOptions,
    setKelurahanList,
  };
};

