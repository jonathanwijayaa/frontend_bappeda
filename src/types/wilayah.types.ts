export interface Kemantren {
  id: string;
  nama_kemantren: string;
}

export interface Kelurahan {
  id_kelurahan: string;
  id_kemantren: string;
  nama_kelurahan: string;
}

export const dummyKemantren: Kemantren[] = [
  { id: "KEM-01", nama_kemantren: "Danurejan" },
  { id: "KEM-02", nama_kemantren: "Gedongtengen" },
  { id: "KEM-03", nama_kemantren: "Gondokusuman" },
  { id: "KEM-04", nama_kemantren: "Gondomanan" },
  { id: "KEM-05", nama_kemantren: "Jetis" },
  { id: "KEM-06", nama_kemantren: "Kotagede" },
  { id: "KEM-07", nama_kemantren: "Kraton" },
  { id: "KEM-08", nama_kemantren: "Mantrijeron" },
  { id: "KEM-09", nama_kemantren: "Mergangsan" },
  { id: "KEM-10", nama_kemantren: "Ngampilan" },
  { id: "KEM-11", nama_kemantren: "Pakualaman" },
  { id: "KEM-12", nama_kemantren: "Tegalrejo" },
  { id: "KEM-13", nama_kemantren: "Umbulharjo" },
  { id: "KEM-14", nama_kemantren: "Wirobrajan" },
];
export const dummyKelurahan: Kelurahan[] = [
  // 1. Danurejan
  { id_kelurahan: "KEL-01-01", id_kemantren: "KEM-01", nama_kelurahan: "Bausasran" },
  { id_kelurahan: "KEL-01-02", id_kemantren: "KEM-01", nama_kelurahan: "Tegalpanggung" },
  { id_kelurahan: "KEL-01-03", id_kemantren: "KEM-01", nama_kelurahan: "Suryatmajan" },

  // 2. Gedongtengen
  { id_kelurahan: "KEL-02-01", id_kemantren: "KEM-02", nama_kelurahan: "Pringgokusuman" },
  { id_kelurahan: "KEL-02-02", id_kemantren: "KEM-02", nama_kelurahan: "Sosromenduran" },

  // 3. Gondokusuman
  { id_kelurahan: "KEL-03-01", id_kemantren: "KEM-03", nama_kelurahan: "Baciro" },
  { id_kelurahan: "KEL-03-02", id_kemantren: "KEM-03", nama_kelurahan: "Demangan" },
  { id_kelurahan: "KEL-03-03", id_kemantren: "KEM-03", nama_kelurahan: "Klitren" },
  { id_kelurahan: "KEL-03-04", id_kemantren: "KEM-03", nama_kelurahan: "Kotabaru" },
  { id_kelurahan: "KEL-03-05", id_kemantren: "KEM-03", nama_kelurahan: "Terban" },

  // 4. Gondomanan
  { id_kelurahan: "KEL-04-01", id_kemantren: "KEM-04", nama_kelurahan: "Ngupasan" },
  { id_kelurahan: "KEL-04-02", id_kemantren: "KEM-04", nama_kelurahan: "Prawirodirjan" },

  // 5. Jetis
  { id_kelurahan: "KEL-05-01", id_kemantren: "KEM-05", nama_kelurahan: "Bumijo" },
  { id_kelurahan: "KEL-05-02", id_kemantren: "KEM-05", nama_kelurahan: "Cokrodiningratan" },
  { id_kelurahan: "KEL-05-03", id_kemantren: "KEM-05", nama_kelurahan: "Gowongan" },

  // 6. Kotagede
  { id_kelurahan: "KEL-06-01", id_kemantren: "KEM-06", nama_kelurahan: "Jagalan" },
  { id_kelurahan: "KEL-06-02", id_kemantren: "KEM-06", nama_kelurahan: "Prenggan" },
  { id_kelurahan: "KEL-06-03", id_kemantren: "KEM-06", nama_kelurahan: "Rejowinangun" },

  // 7. Kraton
  { id_kelurahan: "KEL-07-01", id_kemantren: "KEM-07", nama_kelurahan: "Kadipaten" },
  { id_kelurahan: "KEL-07-02", id_kemantren: "KEM-07", nama_kelurahan: "Panembahan" },
  { id_kelurahan: "KEL-07-03", id_kemantren: "KEM-07", nama_kelurahan: "Patehan" },

  // 8. Mantrijeron
  { id_kelurahan: "KEL-08-01", id_kemantren: "KEM-08", nama_kelurahan: "Gedongkiwo" },
  { id_kelurahan: "KEL-08-02", id_kemantren: "KEM-08", nama_kelurahan: "Mantrijeron" },
  { id_kelurahan: "KEL-08-03", id_kemantren: "KEM-08", nama_kelurahan: "Suryodiningratan" },

  // 9. Mergangsan
  { id_kelurahan: "KEL-09-01", id_kemantren: "KEM-09", nama_kelurahan: "Brontokusuman" },
  { id_kelurahan: "KEL-09-02", id_kemantren: "KEM-09", nama_kelurahan: "Keparakan" },
  { id_kelurahan: "KEL-09-03", id_kemantren: "KEM-09", nama_kelurahan: "Wirogunan" },

  // 10. Ngampilan
  { id_kelurahan: "KEL-10-01", id_kemantren: "KEM-10", nama_kelurahan: "Ngampilan" },
  { id_kelurahan: "KEL-10-02", id_kemantren: "KEM-10", nama_kelurahan: "Notoprajan" },

  // 11. Pakualaman
  { id_kelurahan: "KEL-11-01", id_kemantren: "KEM-11", nama_kelurahan: "Gunungketur" },
  { id_kelurahan: "KEL-11-02", id_kemantren: "KEM-11", nama_kelurahan: "Purwokinanti" },

  // 12. Tegalrejo
  { id_kelurahan: "KEL-12-01", id_kemantren: "KEM-12", nama_kelurahan: "Bener" },
  { id_kelurahan: "KEL-12-02", id_kemantren: "KEM-12", nama_kelurahan: "Karangwaru" },
  { id_kelurahan: "KEL-12-03", id_kemantren: "KEM-12", nama_kelurahan: "Kricak" },
  { id_kelurahan: "KEL-12-04", id_kemantren: "KEM-12", nama_kelurahan: "Tegalrejo" },

  // 13. Umbulharjo
  { id_kelurahan: "KEL-13-01", id_kemantren: "KEM-13", nama_kelurahan: "Giwangan" },
  { id_kelurahan: "KEL-13-02", id_kemantren: "KEM-13", nama_kelurahan: "Mujamuju" },
  { id_kelurahan: "KEL-13-03", id_kemantren: "KEM-13", nama_kelurahan: "Pandeyan" },
  { id_kelurahan: "KEL-13-04", id_kemantren: "KEM-13", nama_kelurahan: "Semaki" },
  { id_kelurahan: "KEL-13-05", id_kemantren: "KEM-13", nama_kelurahan: "Sorosutan" },
  { id_kelurahan: "KEL-13-06", id_kemantren: "KEM-13", nama_kelurahan: "Tahunan" },
  { id_kelurahan: "KEL-13-07", id_kemantren: "KEM-13", nama_kelurahan: "Warungboto" },

  // 14. Wirobrajan
  { id_kelurahan: "KEL-14-01", id_kemantren: "KEM-14", nama_kelurahan: "Pakuncen" },
  { id_kelurahan: "KEL-14-02", id_kemantren: "KEM-14", nama_kelurahan: "Patangpuluhan" },
  { id_kelurahan: "KEL-14-03", id_kemantren: "KEM-14", nama_kelurahan: "Wirobrajan" },
];
