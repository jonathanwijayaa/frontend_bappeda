import { faker } from "@faker-js/faker";
import { Page } from "@playwright/test";

const OPD_LIST = [
  "Opd Demo",
  "Dinas Kesehatan (Dinkes)",
  "Dinas Perhubungan",
  "Dinas Sosial, Tenaga Kerja, dan Transmigrasi (Dinsosnakertrans)",
  "Dinas Pariwisata",
  "Dinas Kebudayaan",
  "Dinas Pemberdayaan Perempuan, Perlindungan Anak, Pengendalian Penduduk dan Keluarga Berencana (DP3AP2KB)",
];


const KADER_MAP: Record<string, string[]> = {
  "Opd Demo": ["Kader Angie Padberg", "Kader Dana West", "Kader Miss Gladys Mraz", "Demo Kader"],

  "Dinas Kesehatan (Dinkes)": ["KADER KESEHATAN"],

  "Dinas Perhubungan": ["Kader Perhubungan C", "Kader Perhubungan C1"],

  "Dinas Sosial, Tenaga Kerja, dan Transmigrasi (Dinsosnakertrans)": ["PORDAM", "TAGANA", "IPSM"],

  "Dinas Pariwisata": ["Kader Pariwisata 1", "Kader Pariwisata 2"],

  "Dinas Kebudayaan": ["Kader Kebudayaan 1", "Kader Kebudayaan 2"],

  "Dinas Pemberdayaan Perempuan, Perlindungan Anak, Pengendalian Penduduk dan Keluarga Berencana (DP3AP2KB)":
    ["SIGRAK", "POSYANDU", "PKK"],
};

export interface SKData {
  "NO SK": string;
  "JUDUL SK": string;
  "TANGGAL TERBIT" : string;
  "BATAS AKTIF" : string;
  OPD: string;
  KADER: string;
  "STATUS KEAKTIFAN"?: string;
}

interface IFillSKForm {
  data: SKData;
  page: Page;
}

function generateSafeSKTitle(): string {
  const skTitle = faker.company.name();
  return skTitle.replace(/[^a-zA-Z\s]/g, "").trim();
}

// With format example "800/123/BPBD/YYYY"
function generateSafeSKNumber(): string {
  const skNumber = faker.number.int({ min: 100, max: 999 });
  const skSubNumber = faker.number.int({ min: 100, max: 999 });
  const skOpd = OPD_LIST[Math.floor(Math.random() * OPD_LIST.length)];
  const currentYear = new Date().getFullYear();
  return `${skNumber}/${skSubNumber}/${skSubNumber}/${skOpd}/${currentYear}`;
}

// ========= UNDER CONSTRUCTION =========