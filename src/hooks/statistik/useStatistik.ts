/**
 * hooks/statistik/useStatistik.ts
 * Fetch semua data statistik secara paralel.
 */
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../lib/axios";
import type { ChartData } from "../../types/statistik.types";

export const STATISTIK_KEYS = {
  all: ["statistik"] as const,
  gender: () => [...STATISTIK_KEYS.all, "gender"] as const,
  kaderPerOpd: () => [...STATISTIK_KEYS.all, "kaderPerOpd"] as const,
  kelurahan: () => [...STATISTIK_KEYS.all, "kelurahan"] as const,
  relawanPerKader: () => [...STATISTIK_KEYS.all, "relawanPerKader"] as const,
};

// Ambil statistik relawan berdasarkan jenis kelamin.
export const useStatistikGender = () =>
  useQuery({
    queryFn: async (): Promise<ChartData[]> => {
      const { data } = await apiClient.get("/statistik/gender");
      return data.data.map((d: { gender: string; jumlah: string }) => ({
        name: d.gender === "L" ? "Laki-laki" : "Perempuan",
        value: parseInt(d.jumlah),
      }));
    },
    queryKey: STATISTIK_KEYS.gender(),
  });

// Ambil statistik relawan berdasarkan kelurahan.
export const useStatistikKelurahan = () =>
  useQuery({
    queryFn: async (): Promise<ChartData[]> => {
      const { data } = await apiClient.get("/statistik/kelurahan");
      return data.data.map((d: { jumlah: string; kelurahan: string }) => ({
        name: d.kelurahan,
        value: parseInt(d.jumlah),
      }));
    },
    queryKey: STATISTIK_KEYS.kelurahan(),
  });

// Ambil statistik jumlah relawan per kader.
export const useStatistikRelawanPerKader = () =>
  useQuery({
    queryFn: async (): Promise<ChartData[]> => {
      const { data } = await apiClient.get("/statistik/relawan-per-kader");
      return data.data.map((d: ChartData) => ({ ...d, value: parseInt(d.value as unknown) }));
    },
    queryKey: STATISTIK_KEYS.relawanPerKader(),
  });

// Ambil statistik jumlah kader per OPD.
export const useStatistikKaderPerOpd = () =>
  useQuery({
    queryFn: async (): Promise<ChartData[]> => {
      const { data } = await apiClient.get("/statistik/kader-per-opd");
      return data.data.map((d: ChartData) => ({ ...d, value: parseInt(d.value as unknown) }));
    },
    queryKey: STATISTIK_KEYS.kaderPerOpd(),
  });
