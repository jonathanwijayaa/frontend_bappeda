/// <reference types="node" />

import { buildOPDData } from "@/helpers/formOPD.helper";
import { buildKaderData } from "@/helpers/formKader.helper";
import { buildRelawanData } from "@/helpers/formRelawan.helper";
import * as fs from "fs";
import * as path from "path";
import XLSX from "xlsx";

type GenerateOptions = {
  type?: "valid" | "invalid";
  total?: number;
};

function ensureOutputDir() {
  const outputDir = path.resolve("src/assets/files");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  return outputDir;
}

/* ======================================
   OPD GENERATOR
====================================== */
export function generateOPDExcel(options?: GenerateOptions) {
  const { type = "valid", total = 1 } = options || {};
  const outputDir = ensureOutputDir();

  const templatePath = path.resolve("src/assets/files/Template_Data_OPD.xlsx");
  const outputPath = path.join(outputDir, `OPD_${Date.now()}.xlsx`);

  const workbook = XLSX.readFile(templatePath);
  const sheetName = workbook.SheetNames[0];

  const data = Array.from({ length: total }).map(() => {
    if (type === "invalid") {
      return {
        "NAMA OPD": "@@@###",
        STATUS: "???",
        ALAMAT: "",
        PIC: "",
        "NIK PIC": "abc",
        KONTAK: "not-a-phone",
      };
    }
    return buildOPDData();
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  workbook.Sheets[sheetName] = worksheet;
  XLSX.writeFile(workbook, outputPath);

  return outputPath;
}

/* ======================================
   KADER GENERATOR
====================================== */
export function generateKaderExcel(options?: GenerateOptions) {
  const { type = "valid", total = 1 } = options || {};
  const outputDir = ensureOutputDir();

  const templatePath = path.resolve("src/assets/files/Template_Data_Kader.xlsx");
  const outputPath = path.join(outputDir, `KADER_${Date.now()}.xlsx`);

  const workbook = XLSX.readFile(templatePath);
  const sheetName = workbook.SheetNames[0];

  const data = Array.from({ length: total }).map(() => {
    if (type === "invalid") {
      return {
        OPD: "",
        "NAMA KADER": "###",
        DESKRIPSI: "",
        STATUS: "??",
        PIC: "",
        "NIK PIC": "abc",
        "NO HP": "not-phone",
        "ALAMAT PIC": "",
        "KELURAHAN PIC": "",
      };
    }
    return buildKaderData();
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  workbook.Sheets[sheetName] = worksheet;
  XLSX.writeFile(workbook, outputPath);

  return outputPath;
}

/* ======================================
   RELAWAN GENERATOR
====================================== */
export function generateRelawanExcel(options?: GenerateOptions) {
  const { type = "valid", total = 1 } = options || {};
  const outputDir = ensureOutputDir();

  const templatePath = path.resolve("src/assets/files/Template_Data_Relawan.xlsx");
  const outputPath = path.join(outputDir, `RELAWAN_${Date.now()}.xlsx`);

  const workbook = XLSX.readFile(templatePath);
  const sheetName = workbook.SheetNames[0];

  const data = Array.from({ length: total }).map(() => {
    if (type === "invalid") {
      return {
        "NAMA LENGKAP": "###",
        "JENIS KELAMIN": "?",
        NIK: "0000",
        ALAMAT: "",
        "NO HP": "abc",
        OPD: "",
        KELURAHAN: "",
        KADER: "",
        JABATAN: "",
        "DETAIL JABATAN": "",
        PENUGASAN: "",
      };
    }

    const relawan = buildRelawanData();

    // Importer Excel hanya menerima "Laki-Laki", "Perempuan", "L", atau "P",
    // sedangkan buildRelawanData() memakai label tombol form ("Laki-laki (L)")
    return {
      ...relawan,
      "JENIS KELAMIN": relawan["JENIS KELAMIN"].includes("(L)") ? "L" : "P",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  workbook.Sheets[sheetName] = worksheet;
  XLSX.writeFile(workbook, outputPath);

  return outputPath;
}