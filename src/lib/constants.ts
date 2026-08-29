/** Kredensial akun demo - dipakai tombol "Coba Akun Demo" di halaman login. */
export const DEMO_EMAIL = "demo@ecocycle.id";
export const DEMO_PASSWORD = "demo1234";

/** Interval kirim posisi ke server saat live tracking (ms). */
export const LIVE_PING_INTERVAL_MS = 15_000;
/** Interval refresh peta Live Riders (ms). */
export const LIVE_REFRESH_MS = 20_000;

/**
 * Zona waktu acuan aplikasi. Dipakai untuk mengelompokkan ride per hari
 * (streak) supaya hasilnya sama di mana pun server dijalankan - Vercel
 * berjalan di UTC, jadi tanpa ini gowes subuh masuk ke hari sebelumnya.
 */
export const APP_TIMEZONE = "Asia/Jakarta";
