# ArbiterPro - FIDE Chess Tournament Management & Pairing System

Sistem Manajemen Turnamen Catur & Chief Arbiter terstandar FIDE (Fédération Internationale des Échecs) untuk mengelola pairing, hasil pertandingan, tie-break, dan administrasi turnamen secara profesional.

---

## Fitur Utama

- **Sistem Pairing Berstandar FIDE**:
  - **Swiss-System (FIDE Dutch System)**: Pengelompokan bracket skor otomatis, urutan meja berdasarkan skor tertinggi (Papan 1 = Partai Puncak), alternasi warna adil, dan **larangan ketat rematch** (pemain tidak akan bertemu lawan yang sama dua kali).
  - **Round-Robin (Berger Tables)**: Jadwal rotasi matriks kanonik FIDE Berger dengan tampilan *Crosstable Grid Matrix*.
  - **Knockout / Single-Elimination**: Bagan turnamen sistem gugur berjenjang.
- **Kalkulasi Otomatis Tie-Break FIDE**:
  - Buchholz & Buchholz Cut-1
  - Sonneborn-Berger (Neustadtl)
  - Direct Encounter (Head-to-head)
  - Progressive Score (Kumulatif) & Most Wins
- **Ekspor Dokumen & Laporan PDF Resmi**:
  - Unduh PDF Pairing & Hasil per ronde (Format tabel grid FIDE simetris lengkap dengan kolom Poin, Rating, dan kolom tanda tangan Chief Arbiter).
  - Unduh PDF Klasemen Resmi & Tie-breaks (Ukuran A4 Landscape siap cetak).
  - Ekspor format Markdown dan JSON tournament data.
- **Mode Kompak Input Skor Cepat**:
  - Antarmuka papan ringkas horizontal untuk input hasil instan (`1-0`, `½-½`, `0-1`, `Forfeit`) tanpa perlu scroll panjang.
- **Chief Arbiter Console**:
  - Pencatat pelanggaran resmi FIDE (Langkah tidak sah Art 7.5.5, Default time Art 6.7, Touch-move Art 4, Pelanggaran ponsel/elektronik Art 11.3).
  - Audit otomatis anomali pairing dan verifikasi bebas rematch.
- **Manajemen Turnamen Fleksibel**:
  - Tombol **New Game** untuk memulai turnamen baru dengan preset atau daftar pemain kustom.
  - Tombol **Reset Round** untuk mengosongkan skor ronde aktif tanpa merusak pairing.

---

## Panduan Deploy ke GitHub & Vercel

### Langkah 1: Push ke GitHub

Buka terminal di komputer Anda pada folder proyek ini, lalu jalankan perintah:

```bash
# 1. Inisialisasi Git repository (jika belum)
git init

# 2. Tambahkan semua file proyek
git add .

# 3. Buat commit pertama
git commit -m "feat: initial commit ArbiterPro chess tournament system"

# 4. Ganti nama branch utama menjadi main
git branch -M main

# 5. Hubungkan ke repository GitHub Anda (ganti URL di bawah dengan URL repo GitHub Anda)
git remote add origin https://github.com/USERNAME_ANDA/NAMA_REPO_ANDA.git

# 6. Push kode ke GitHub
git push -u origin main
```

---

### Langkah 2: Deploy ke Vercel

1. Buka [https://vercel.com](https://vercel.com) dan login menggunakan akun GitHub Anda.
2. Di dashboard Vercel, klik tombol **"Add New..."** lalu pilih **"Project"**.
3. Cari dan pilih repository GitHub yang baru saja Anda push (**Import**).
4. Vercel akan otomatis mendeteksi:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. *(Opsional)* Jika menggunakan environment variable Gemini API, masukkan `GEMINI_API_KEY` di bagian Environment Variables.
6. Klik **"Deploy"**.
7. Dalam waktu ~1 menit, aplikasi Anda akan online dengan domain gratis seperti:
   `https://nama-proyek-anda.vercel.app`

---

## Menjalankan di Lokal (Development)

Jika Anda ingin menjalankan proyek di komputer lokal:

```bash
# 1. Install dependensi
npm install

# 2. Jalankan server dev lokal
npm run dev

# Aplikasi akan berjalan di http://localhost:3000
```

Untuk memverifikasi build produksi:

```bash
npm run build
npm run preview
```

---

## Teknologi yang Digunakan

- **React 19** & **TypeScript**
- **Vite 8**
- **Tailwind CSS v4**
- **jsPDF** & **jspdf-autotable** (Mesin generator dokumen PDF FIDE)
- **Lucide React** (Ikonografi UI)
- **Vercel** (Hosting & deployment SPA)
