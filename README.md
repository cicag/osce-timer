# OSCE Timer

Timer stase OSCE untuk tampilan proyektor. Satu rotasi berjalan 15 menit, 11 rotasi, dengan fase otomatis dan isyarat suara Bahasa Indonesia.

## Alur

- Rotasi: **11**, masing-masing **15:00** (`ROTATION_TIME = 900`).
- Fase per rotasi: `MEMBACA SOAL` (0–60s) → `PELAKSANAAN UJIAN` (60–780s) → `WARNING` (780–840s) → `PINDAH STASE` (840–900s).
- Setelah rotasi ke-6 masuk **FREEZE** selama **8:00** (`FREEZE_TIME = 480`), lalu lanjut rotasi berikutnya.
- Warna latar dan teks fase mengikuti state (`reading`, `exam`, `warning`, `move`, `freeze`).

## Kontrol

- **Mulai / Jeda / Lanjutkan** — tombol utama.
- **Reset** — kembali ke rotasi 1.
- **Layar Penuh** — fullscreen.
- **Lewati Fase** — maju ke fase berikutnya.
- **Tombol 1–11** — lompat langsung ke rotasi.

## Catatan

- Isyarat suara memakai Web Speech API (`speechSynthesis`, `id-ID`); ketersediaan suara bergantung pada browser/OS.
- Halaman mengunci klik kanan, seleksi, dan sebagian pintasan developer (mode kios). Tidak ada penanda indeks mesin pencari (`noindex`).

## Konfigurasi

Ubah konstanta di bagian atas `app.js`:

```js
const TOTAL_ROTATION = 11;
const ROTATION_TIME = 900;
const FREEZE_TIME = 480;
```
