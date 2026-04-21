export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      budgets: {
        Row: {
          amount: number;
          category: string;
          created_at: string;
          id: string;
          month: number;
          updated_at: string;
          user_id: string;
          year: number;
        };
        Insert: {
          amount: number;
          category: string;
          created_at?: string;
          id?: string;
          month: number;
          updated_at?: string;
          user_id: string;
          year: number;
        };
        Update: {
          amount?: number;
          category?: string;
          created_at?: string;
          id?: string;
          month?: number;
          updated_at?: string;
          user_id?: string;
          year?: number;
        };
        Relationships: [];
      };
      debt_settlements: {
        Row: {
          amount_settled: number;
          created_at: string;
          debt_id: string;
          id: string;
          note: string | null;
          settled_at: string;
          user_id: string;
        };
        Insert: {
          amount_settled: number;
          created_at?: string;
          debt_id: string;
          id?: string;
          note?: string | null;
          settled_at: string;
          user_id: string;
        };
        Update: {
          amount_settled?: number;
          created_at?: string;
          debt_id?: string;
          id?: string;
          note?: string | null;
          settled_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "debt_settlements_debt_id_fkey";
            columns: ["debt_id"];
            isOneToOne: false;
            referencedRelation: "debts";
            referencedColumns: ["id"];
          },
        ];
      };
      debts: {
        Row: {
          created_at: string;
          debt_date: string;
          description: string | null;
          due_date: string | null;
          id: string;
          original_amount: number;
          person_name: string;
          remaining_amount: number;
          status: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          debt_date: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          original_amount: number;
          person_name: string;
          remaining_amount: number;
          status?: string;
          type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          debt_date?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          original_amount?: number;
          person_name?: string;
          remaining_amount?: number;
          status?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      monthly_balances: {
        Row: {
          closing_balance: number;
          created_at: string;
          id: string;
          month: string;
          user_id: string;
        };
        Insert: {
          closing_balance?: number;
          created_at?: string;
          id?: string;
          month: string;
          user_id: string;
        };
        Update: {
          closing_balance?: number;
          created_at?: string;
          id?: string;
          month?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount: number;
          category: string;
          created_at: string;
          custom_category: string | null;
          date: string;
          debt_id: string | null;
          description: string | null;
          id: string;
          payment_method: string | null;
          source: string | null;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          category: string;
          created_at?: string;
          custom_category?: string | null;
          date?: string;
          debt_id?: string | null;
          description?: string | null;
          id?: string;
          payment_method?: string | null;
          source?: string | null;
          type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          category?: string;
          created_at?: string;
          custom_category?: string | null;
          date?: string;
          debt_id?: string | null;
          description?: string | null;
          id?: string;
          payment_method?: string | null;
          source?: string | null;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_debt_id_fkey";
            columns: ["debt_id"];
            isOneToOne: false;
            referencedRelation: "debts";
            referencedColumns: ["id"];
          },
        ];
      };
      user_preferences: {
        Row: {
          created_at: string;
          currency: string;
          display_name: string | null;
          id: string;
          monthly_budget_default: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          display_name?: string | null;
          id?: string;
          monthly_budget_default?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          display_name?: string | null;
          id?: string;
          monthly_budget_default?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
