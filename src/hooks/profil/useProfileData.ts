/**
 * hooks/profil/useProfileData.ts
 * Fetch profil user yang sedang login.
 */
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../lib/axios";
import type { ProfileData } from "../../types";

export const PROFIL_KEYS = {
  all: ["profil"] as const,
  me: () => [...PROFIL_KEYS.all, "me"] as const,
};

// Ambil profil user yang sedang login untuk halaman profil.
export const useProfileData = () =>
  useQuery({
    queryFn: async (): Promise<ProfileData> => {
      const { data } = await apiClient.get("/profile/me");
      if (!data.success) throw new Error(data.message || "Gagal memuat profil");
      return data.data;
    },
    queryKey: PROFIL_KEYS.me(),
  });
