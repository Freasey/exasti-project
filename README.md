# EcoCycle - Ride Green, Live Clean

Pelacak bersepeda real-time untuk kota, dibuat sebagai aplikasi web (bukan
aplikasi mobile) memakai Next.js. Rider merekam perjalanan lewat GPS browser,
aplikasi menghitung jarak, kecepatan, elevasi, dan karbon yang dihemat, lalu
mengubahnya jadi poin yang bisa ditukar dengan voucher partner.

**Akun demo:** `demo@ecocycle.id` / `demo1234` - atau langsung klik tombol
**Coba Akun Demo** di halaman login.

---

## Fitur

| Halaman | Isi |
| --- | --- |
| `/` | Landing page publik |
| `/login`, `/register` | Autentikasi + tombol akun demo satu klik |
| `/dashboard` | Sambutan, total poin & level, **streak gowes**, grafik CO₂, leaderboard, reward, aktivitas terakhir |
| `/ride` | **Live tracking**: peta mengikuti posisi, jarak/durasi/kecepatan/elevasi berjalan, jeda-lanjut, simpan atau buang |
| `/activities` | Riwayat ride dengan pratinjau rute + paginasi |
| `/activities/[id]` | Detail ride: peta rute, statistik lengkap, dampak lingkungan, grafik elevasi/kecepatan, kudos, ubah judul |
| `/live` | Peta semua rider yang sedang gowes saat ini (auto-refresh) |
| `/analytics` | KPI, jarak per minggu, pola hari & jam, heatmap rute, rekor |
| `/rewards` | Katalog voucher, penukaran poin, kode voucher, riwayat |
| `/leaderboard` | Peringkat mingguan / bulanan / sepanjang masa |
| `/settings` | Profil, unggah foto (Vercel Blob), badge pencapaian |

Tambahan:

- **Streak gowes** - hari aktif dihitung dari ride yang selesai, lengkap
  dengan deretan tujuh hari terakhir dan badge 3 / 7 / 30 hari.
- **Mode simulasi GPS** di halaman `/ride` - supaya demo bisa dijalankan dari
  desktop tanpa perangkat GPS betulan.
- **Sesi tahan refresh** - track disimpan ke `localStorage`, jadi ride tidak
  hilang kalau tab tertutup atau halaman dimuat ulang.
- **Wake Lock** - layar tidak mati saat merekam (di browser yang mendukung).

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** - token warna EcoCycle didefinisikan di `src/app/globals.css`
- **Neon Postgres** via `@neondatabase/serverless` (HTTP driver, cocok untuk serverless)
- **Vercel Blob** - arsip track GPS mentah + foto profil
- **Leaflet + react-leaflet** dengan basemap gelap CARTO (butuh API key gratis
  dari CARTO, lihat `NEXT_PUBLIC_CARTO_API_KEY` di `.env.example`)
- **Recharts** untuk grafik, **lucide-react** untuk ikon
- **jose** (JWT httpOnly cookie) + **bcryptjs** untuk autentikasi

## Menjalankan secara lokal

```bash
npm install
```

Salin `.env.example` jadi `.env.local` lalu isi:

```
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
AUTH_SECRET=string-acak-panjang
BLOB_READ_WRITE_TOKEN=        # opsional saat development
ORS_API_KEY=                  # opsional, untuk perencana rute Green Route
```

Siapkan database (membuat tabel, katalog reward, badge, akun demo, dan
rider pesaing beserta riwayat ride-nya):

```bash
npm run db:setup
```

Jalankan aplikasi:

```bash
npm run dev
```

Buka http://localhost:3000 lalu klik **Coba Akun Demo**.

### Perintah lain

```bash
npm run db:reset
```

Menghapus semua tabel lalu membangun ulang dari nol - berguna kalau ingin data
demo yang segar.

```bash
npm run bike-lanes:sync
```

Menarik jalur ramah sepeda Jabodetabek dari OpenStreetMap ke tabel `bike_lanes`
(dipakai fitur **Green Route**). Idempoten dan aman diulang - kalau ada petak
yang gagal karena server Overpass sedang penuh, jalankan lagi untuk melengkapi.
Pakai `-- --bbox=south,west,north,east` untuk kota lain.

Data OSM berlisensi ODbL, jadi atribusi di peta wajib tetap tampil.

## Struktur

```
src/
  app/
    (auth)/         login & register (layout split-screen)
    (app)/          area privat: dashboard, ride, activities, analytics, ...
    api/            route handler: auth, rides, live, rewards, profile
    actions/        server action (logout)
  components/
    map/            komponen Leaflet (dimuat dinamis tanpa SSR)
    charts/         grafik Recharts
    ui/             primitive: Button, Card, Field, Avatar, Progress
  lib/
    db.ts           koneksi Neon
    schema.sql      skema database
    metrics.ts      matematika domain: jarak, elevasi, CO₂, poin, level
    streak.ts       aturan streak + query hari aktif (fungsi hitungnya murni)
    rides.ts        mulai / ping / selesaikan ride
    queries.ts      seluruh query baca untuk halaman
    blob.ts         Vercel Blob (track & avatar)
    seed.ts         data demo
  proxy.ts          penjaga rute privat di edge
scripts/
  setup-db.ts       runner migrasi + seed
```

## Cara angka dihitung

Semua rumus ada di `src/lib/metrics.ts`, dan **statistik final selalu dihitung
ulang di server** dari track GPS mentah - angka yang dikirim browser hanya untuk
tampilan, jadi poin tidak bisa dipalsukan dari sisi klien.

| Besaran | Rumus |
| --- | --- |
| Jarak | Haversine antar titik, lompatan > 40 m/s dibuang sebagai noise |
| Moving time | Hanya sampel dengan kecepatan ≥ 0,8 m/s |
| Elevasi | Altitude dihaluskan (moving average 5), kenaikan dihitung dengan histeresis 3 m |
| CO₂ dihemat | `0,192 kg × km` (rata-rata emisi mobil bensin) |
| Setara pohon | `CO₂ ÷ 14,25 kg` (serapan satu pohon per tahun) |
| BBM dihemat | `CO₂ ÷ 2,44 kg` (emisi 1 liter bensin) |
| Poin | `10/km + 1/menit gowes`, bonus 50 di ≥ 10 km dan 100 di ≥ 25 km |
| Level | XP untuk naik level = `250 × level` |
| Streak | Hari aktif = total jarak hari itu ≥ 1 km, dikelompokkan menurut `Asia/Jakarta`. Boleh libur 1 hari, tapi jatah itu hanya berlaku sekali per 7 hari |

## Peran Vercel Blob

Track GPS penuh bisa berisi ribuan titik. Supaya tabel Postgres tetap ramping:

- **Vercel Blob** menyimpan track penuh (`tracks/{rideId}.json`) dan foto profil
  (`avatars/{userId}-{timestamp}.{ext}`).
- **Postgres** menyimpan `polyline` (≤ 300 titik hasil Ramer–Douglas–Peucker)
  untuk peta, dan `profile` (≈ 120 sampel elevasi/kecepatan) untuk grafik.

Store yang dipakai bersifat **private** (`access: "private"`), jadi blob tidak
punya URL publik:

- `track_url` di tabel `rides` menyimpan **pathname**, bukan URL. Isinya hanya
  dibaca di server lewat `fetchTrack()` - jejak lokasi mentah tidak pernah
  diekspos ke browser.
- Foto profil disajikan lewat route proxy `GET /api/blob/avatars/...` yang
  mengalirkan berkas dari Blob setelah memastikan pengunjung sudah masuk. Hanya
  folder `avatars/` yang boleh dibaca lewat route ini; permintaan ke `tracks/`
  dijawab 404.

Kalau kamu memakai store **public**, ubah konstanta `ACCESS` di
`src/lib/blob.ts` menjadi `"public"` - `putAvatar` bisa mengembalikan
`blob.url` langsung dan route proxy tidak lagi diperlukan.

Kalau `BLOB_READ_WRITE_TOKEN` belum diisi, aplikasi tetap berjalan normal -
hanya arsip track penuh dan unggah foto profil yang dinonaktifkan.

## Deploy ke Vercel

1. Push repositori ini ke GitHub, lalu **Import Project** di Vercel.
2. Di **Storage**, hubungkan **Neon** (atau pakai `DATABASE_URL` yang sudah ada)
   dan buat **Blob store** - Vercel akan mengisi `BLOB_READ_WRITE_TOKEN`
   otomatis ke project.
3. Tambahkan environment variable:
   - `DATABASE_URL`
   - `AUTH_SECRET` (buat baru untuk produksi, mis. `openssl rand -base64 32`)
4. Jalankan `npm run db:setup` sekali dari lokal dengan `DATABASE_URL` produksi
   agar tabel dan data demo tersedia.
5. Deploy.

> **Catatan GPS:** Geolocation API hanya aktif di `https://` (atau `localhost`).
> Setelah deploy ke Vercel, live tracking langsung bisa dipakai dari HP lewat
> browser tanpa instalasi apa pun.

## Batasan yang diketahui

- Akun demo dipakai bersama semua orang yang menekan tombol demo, jadi
  perubahan profil di akun itu terlihat oleh pengunjung lain.
- Belum ada fitur follow/teman; feed dan leaderboard bersifat global.
- Ride yang sudah selesai bisa diubah judul dan catatannya, tapi belum bisa
  dihapus (poin yang sudah masuk perlu dikembalikan lebih dulu).
