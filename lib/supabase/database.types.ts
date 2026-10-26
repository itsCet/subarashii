// Types de la base Supabase. Écrits à la main pour démarrer ; à régénérer avec :
//   npx supabase gen types typescript --project-id <id> > lib/supabase/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Role = "client" | "cashier" | "admin";
export type Track = "free" | "premium";
export type QuestFrequency = "daily" | "weekly";
export type QuestVerification = "self" | "purchase" | "spend";

type Table<Row, Required extends keyof Row = never> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  role: Role;
  xp: number;
  level: number;
  current_season_spent: number;
  is_premium_pass: boolean;
  favorite_universes?: Universe[];
  onboarded_at?: string | null;
  created_at: string;
};

export type Universe = "manga" | "tcg" | "gaming" | "bar";

export type Season = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
};

export type BattlePassTier = {
  id: string;
  season_id: string;
  level: number;
  xp_required: number;
  free_reward: string | null;
  premium_reward: string | null;
  icon_name: string | null;
  free_icon_name: string | null;
  free_redeemable: boolean;
  premium_redeemable: boolean;
};

export type UserReward = {
  id: string;
  user_id: string;
  tier_id: string;
  track: Track;
  claimed_at: string;
  redeemed_at: string | null;
  redeemed_by: string | null;
};

export type MyReward = {
  id: string;
  tier_level: number;
  track: Track;
  reward: string | null;
  icon_name: string | null;
  redeemable: boolean;
  claimed_at: string;
  redeemed_at: string | null;
};

export type PendingReward = Omit<MyReward, "redeemable" | "redeemed_at">;

export type Transaction = {
  id: string;
  user_id: string;
  cashier_id: string | null;
  season_id: string | null;
  amount_chf: number;
  xp_gained: number;
  created_at: string;
};

export type Quest = {
  id: string;
  slug: string;
  title: string;
  description: string;
  xp_reward: number;
  frequency: QuestFrequency;
  verification: QuestVerification;
  target_value: number;
  icon_name: string | null;
  is_active: boolean;
  sort_order: number;
};

export type UserQuest = {
  id: string;
  user_id: string;
  quest_id: string;
  period_start: string;
  completed_at: string;
};

export type PlayerQuest = Omit<Quest, "is_active" | "sort_order"> & {
  progress: number;
  completed: boolean;
};

export type EventCategory = "tcg" | "game_night" | "nocturne";

export type CafeEvent = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: EventCategory;
  tag: string | null;
  starts_at: string;
  ends_at: string | null;
  price_chf: number;
  conditions: string | null;
  capacity: number | null;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
};

export type EventRegistration = {
  id: string;
  event_id: string;
  user_id: string;
  created_at: string;
};

export type UpcomingEvent = Omit<CafeEvent, "is_published" | "created_at"> & {
  spots_left: number | null;
  is_registered: boolean;
};

export type ProductCategory = "bar" | "manga" | "tcg" | "goodies";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  price_chf: number;
  stock: number | null;
  image_url: string | null;
  is_new: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type StaffEvent = Omit<CafeEvent, "created_at"> & { registrations: number };

export type RecentTransaction = {
  id: string;
  created_at: string;
  amount_chf: number;
  xp_gained: number;
  member: string | null;
  cashier: string | null;
};

export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";
export type PaymentMethod = "counter" | "online";

/** Commande telle que renvoyée par les fonctions SQL (`order_json`). */
export type Order = {
  id: string;
  number: number;
  user_id: string | null;
  username: string | null;
  source: "pos" | "app";
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: "unpaid" | "paid";
  total_chf: number;
  note: string | null;
  created_at: string;
  paid_at: string | null;
  completed_at: string | null;
  items: { name: string; unit_price_chf: number; quantity: number; product_id: string | null }[];
};

export type LeaderboardEntry = Pick<Profile, "id" | "username" | "avatar_url" | "level" | "xp"> & {
  rank: number;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, "id">;
      seasons: Table<Season, "title" | "start_date" | "end_date">;
      battle_pass_tiers: Table<BattlePassTier, "season_id" | "level" | "xp_required">;
      user_rewards: Table<UserReward, "user_id" | "tier_id">;
      transactions: Table<Transaction, "user_id" | "amount_chf" | "xp_gained">;
      quests: Table<Quest, "slug" | "title" | "description" | "xp_reward" | "frequency" | "verification">;
      user_quests: Table<UserQuest, "user_id" | "quest_id" | "period_start">;
      events: Table<CafeEvent, "slug" | "title" | "category" | "starts_at">;
      event_registrations: Table<EventRegistration, "event_id" | "user_id">;
      products: Table<Product, "name" | "category" | "price_chf">;
    };
    Views: { [_ in never]: never };
    Functions: {
      record_transaction: { Args: { p_user_id: string; p_amount_chf: number }; Returns: Json };
      claim_reward: { Args: { p_tier_id: string; p_track: Track }; Returns: UserReward };
      complete_quest: { Args: { p_quest_id: string }; Returns: Json };
      get_my_quests: { Args: Record<PropertyKey, never>; Returns: PlayerQuest[] };
      get_leaderboard: { Args: { p_limit?: number }; Returns: LeaderboardEntry[] };
      get_upcoming_events: { Args: { p_limit?: number }; Returns: UpcomingEvent[] };
      register_for_event: { Args: { p_event_id: string }; Returns: number | null };
      cancel_event_registration: { Args: { p_event_id: string }; Returns: undefined };
      get_staff_events: { Args: Record<PropertyKey, never>; Returns: StaffEvent[] };
      get_event_registrations: {
        Args: { p_event_id: string };
        Returns: { user_id: string; username: string | null; registered_at: string }[];
      };
      get_recent_transactions: { Args: { p_limit?: number }; Returns: RecentTransaction[] };
      get_my_rewards: { Args: Record<PropertyKey, never>; Returns: MyReward[] };
      get_pending_rewards: { Args: { p_user_id: string }; Returns: PendingReward[] };
      redeem_reward: { Args: { p_user_reward_id: string }; Returns: string };
      pos_checkout: { Args: { p_user_id: string | null; p_items: Json }; Returns: Json };
      place_order: { Args: { p_items: Json; p_note: string; p_payment_method: PaymentMethod }; Returns: Json };
      cancel_my_order: { Args: { p_order_id: string }; Returns: Json };
      set_order_status: { Args: { p_order_id: string; p_status: "preparing" | "ready" | "cancelled" }; Returns: Json };
      complete_order: { Args: { p_order_id: string }; Returns: Json };
      get_orders: { Args: { p_scope?: "mine" | "open" }; Returns: Json[] };
      mark_order_paid: { Args: { p_order_id: string; p_session_id: string }; Returns: Json };
      expire_online_order: { Args: { p_order_id: string }; Returns: undefined };
      complete_onboarding: { Args: { p_username: string; p_universes: Universe[] }; Returns: Profile };
      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
