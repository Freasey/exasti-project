export type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  is_demo: boolean;
  points_balance: number;
  lifetime_points: number;
  created_at: string;
};

/** Baris mentah tabel users - hanya dipakai di server saat autentikasi. */
export type UserRow = User & { password_hash: string };

export type SessionUser = Pick<
  User,
  "id" | "name" | "username" | "email" | "avatar_url" | "is_demo"
>;

export type RideStatus = "active" | "completed";

export type Ride = {
  id: string;
  user_id: string;
  title: string;
  note: string | null;
  status: RideStatus;
  started_at: string;
  ended_at: string | null;
  duration_s: number;
  moving_s: number;
  distance_m: number;
  avg_speed: number;
  max_speed: number;
  elev_gain: number;
  calories: number;
  co2_kg: number;
  points: number;
  polyline: [number, number][];
  profile: ProfilePoint[];
  /** Pathname track penuh di Vercel Blob (store privat), mis. `tracks/<id>.json`. */
  track_url: string | null;
  last_lat: number | null;
  last_lng: number | null;
  last_ping: string | null;
  created_at: string;
};

/** Satu sampel untuk grafik elevasi & kecepatan pada halaman detail ride. */
export type ProfilePoint = {
  d: number;   // jarak kumulatif (meter)
  alt: number | null;
  spd: number; // km/jam
};

export type RideWithUser = Ride & {
  user_name: string;
  username: string;
  user_avatar: string | null;
  kudos_count: number;
  kudos_given: boolean;
};

export type Reward = {
  id: string;
  slug: string;
  brand: string;
  title: string;
  value_label: string;
  points_cost: number;
  accent: string;
  stock: number;
  active: boolean;
  sort_order: number;
};

export type Redemption = {
  id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  code: string;
  status: string;
  created_at: string;
  brand: string;
  title: string;
  value_label: string;
  accent: string;
};

export type Achievement = {
  code: string;
  name: string;
  description: string;
  icon: string;
  metric: string;
  threshold: number;
  sort_order: number;
  unlocked_at: string | null;
};

/** Titik GPS mentah yang direkam browser selama live tracking. */
export type TrackPoint = {
  lat: number;
  lng: number;
  t: number; // epoch ms
  alt?: number | null;
  spd?: number | null; // m/s
  acc?: number | null; // meter
};
