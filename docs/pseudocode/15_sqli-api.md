# Modul SQL Injection Lapis API (TCSQLA)
<!-- prefix: TCSQLA -->

```text
// Berkas: src/tests/security/sqlInjectionApi.spec.ts
// Lapis API: TANPA THINK_TIME (bukan interaksi pengguna);
// LOAD_TIME menjadi batas waktu setiap request.
payload ← {"' OR '1'='1", "' OR '1'='1' --", "admin' --",
           "admin' #", "' OR 1=1--", "') OR ('1'='1",
           "'; DROP TABLE users; --", "' OR 'x'='x",
           "1' UNION SELECT null, username, password",
           dan payload kutip ganda}                 // 10 payload
payloadWaktu ← {"x' OR SLEEP(5) --", "x'); SELECT pg_sleep(5); --",
                "x' OR pg_sleep(5) --"}

PROSEDUR PastikanAman(respons)
    PASTIKAN status respons < 500
    PASTIKAN badan respons tidak memuat tanda error SQL
AKHIR PROSEDUR

SEBELUM SEMUA TEST
    respons ← KIRIM POST "/auth/login" dengan kredensial
              Super Admin (maks LOAD_TIME)
    PASTIKAN respons berhasil dan token tidak kosong
    tokenAdmin ← token dari respons
AKHIR SEBELUM

TEST "TCSQLA.1 Endpoint login menolak auth bypass"
    UNTUK SETIAP p DALAM payload LAKUKAN
        respons ← KIRIM POST "/auth/login" {nik: p, password: p}
                  (maks LOAD_TIME)
        PASTIKAN status respons ≠ 200
        PASTIKAN badan respons tidak memuat "token"
        PastikanAman(respons)
    AKHIR UNTUK
    respons ← KIRIM POST "/auth/login" {nik: NIK Super Admin,
              password: "' OR '1'='1' --"} (maks LOAD_TIME)
    PASTIKAN status ≠ 200, tanpa "token", memuat "password salah"
    PastikanAman(respons)
    respons ← KIRIM POST "/auth/login" {nik: "1' UNION SELECT
              nik,password FROM users--", password: "x"}
    PASTIKAN status ≠ 200 dan tanpa "token"
    PastikanAman(respons)
AKHIR TEST

TEST "TCSQLA.2 Login tidak rentan time-based blind SQLi"
    KIRIM POST "/auth/login" dengan password salah  // waktu acuan
    UNTUK SETIAP p DALAM payloadWaktu LAKUKAN
        mulai ← waktu sekarang
        respons ← KIRIM POST "/auth/login" {nik: NIK Super Admin,
                  password: p} (maks LOAD_TIME)
        PASTIKAN waktu sekarang – mulai < 3 detik
        PASTIKAN status respons ≠ 200
        PastikanAman(respons)
    AKHIR UNTUK
AKHIR TEST

TEST "TCSQLA.3 Parameter query aman dari injeksi"
    target ← {("/admin/logs?limit=", 1000), ("/opd?search=", "")}
    UNTUK SETIAP (endpoint, nilaiJinak) DALAM target LAKUKAN
        dataPenuh ← jumlah data KIRIM GET endpoint + nilaiJinak
                    dengan tokenAdmin (maks LOAD_TIME)
        UNTUK SETIAP p DALAM payload LAKUKAN
            respons ← KIRIM GET endpoint + p dengan tokenAdmin
                      (maks LOAD_TIME)
            PastikanAman(respons)
            JIKA respons berhasil MAKA
                PASTIKAN jumlah data respons <= dataPenuh
            AKHIR JIKA
        AKHIR UNTUK
    AKHIR UNTUK
AKHIR TEST

TEST "TCSQLA.4 Endpoint buat OPD menolak SQLi di body"
    UNTUK SETIAP p DALAM {"'; DROP TABLE opd; --", "' OR '1'='1",
            "test'); DELETE FROM opd;--"} LAKUKAN
        respons ← KIRIM POST "/opd" {nama_opd: p, data lain valid}
                  dengan tokenAdmin (maks LOAD_TIME)
        PASTIKAN status respons >= 400            // tidak tersimpan
        PastikanAman(respons)
    AKHIR UNTUK
AKHIR TEST

TEST "TCSQLA.5 Endpoint terproteksi menolak tanpa token"
    respons ← KIRIM GET "/admin/logs?limit=' OR 1=1--" tanpa token
              (maks LOAD_TIME)
    PASTIKAN status respons 401 atau 403
    PastikanAman(respons)
AKHIR TEST
```

**TC-ID yang dicakup (5):** TCSQLA.1, TCSQLA.2, TCSQLA.3, TCSQLA.4, TCSQLA.5
