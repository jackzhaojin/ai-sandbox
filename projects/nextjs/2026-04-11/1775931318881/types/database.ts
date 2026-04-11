/**
 * Database schema types for Supabase
 * These represent the tables in your cloud Supabase instance
 */

export interface Database {
  public: {
    Tables: {
      shipments: {
        Row: {
          id: string;
          reference_number: string;
          status: string;
          origin: Record<string, unknown>;
          destination: Record<string, unknown>;
          package: Record<string, unknown>;
          selected_rate: Record<string, unknown> | null;
          payment_method: string | null;
          pickup_slot: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference_number: string;
          status?: string;
          origin: Record<string, unknown>;
          destination: Record<string, unknown>;
          package: Record<string, unknown>;
          selected_rate?: Record<string, unknown> | null;
          payment_method?: string | null;
          pickup_slot?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference_number?: string;
          status?: string;
          origin?: Record<string, unknown>;
          destination?: Record<string, unknown>;
          package?: Record<string, unknown>;
          selected_rate?: Record<string, unknown> | null;
          payment_method?: string | null;
          pickup_slot?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      carrier_rates: {
        Row: {
          id: string;
          carrier: string;
          service: string;
          base_price: number;
          total_price: number;
          currency: string;
          delivery_days: number | null;
          delivery_date: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          carrier: string;
          service: string;
          base_price: number;
          total_price: number;
          currency: string;
          delivery_days?: number | null;
          delivery_date?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          carrier?: string;
          service?: string;
          base_price?: number;
          total_price?: number;
          currency?: string;
          delivery_days?: number | null;
          delivery_date?: string | null;
          active?: boolean;
          created_at?: string;
        };
      };
      pickup_slots: {
        Row: {
          id: string;
          date: string;
          start_time: string;
          end_time: string;
          available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          start_time: string;
          end_time: string;
          available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          available?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
