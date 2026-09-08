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
      groups: {
        Row: {
          archived: boolean;
          created_at: string;
          currency: string;
          group_type: string;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          archived?: boolean;
          created_at?: string;
          currency?: string;
          group_type?: string;
          id?: string;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          archived?: boolean;
          created_at?: string;
          currency?: string;
          group_type?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          color: string | null;
          created_at: string;
          group_id: string;
          id: string;
          is_you: boolean;
          member_user_id: string | null;
          name: string;
          user_id: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          group_id: string;
          id?: string;
          is_you?: boolean;
          member_user_id?: string | null;
          name: string;
          user_id: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          group_id?: string;
          id?: string;
          is_you?: boolean;
          member_user_id?: string | null;
          name?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
      };
      group_expenses: {
        Row: {
          amount: number;
          category: string;
          created_at: string;
          description: string;
          expense_date: string;
          group_id: string;
          id: string;
          notes: string | null;
          paid_by: string;
          split_type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          category?: string;
          created_at?: string;
          description: string;
          expense_date?: string;
          group_id: string;
          id?: string;
          notes?: string | null;
          paid_by: string;
          split_type?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          category?: string;
          created_at?: string;
          description?: string;
          expense_date?: string;
          group_id?: string;
          id?: string;
          notes?: string | null;
          paid_by?: string;
          split_type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_expenses_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_expenses_paid_by_fkey";
            columns: ["paid_by"];
            isOneToOne: false;
            referencedRelation: "group_members";
            referencedColumns: ["id"];
          },
        ];
      };
      group_expense_splits: {
        Row: {
          created_at: string;
          expense_id: string;
          id: string;
          member_id: string;
          share_amount: number;
          share_units: number | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expense_id: string;
          id?: string;
          member_id: string;
          share_amount: number;
          share_units?: number | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expense_id?: string;
          id?: string;
          member_id?: string;
          share_amount?: number;
          share_units?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_expense_splits_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "group_expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_expense_splits_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "group_members";
            referencedColumns: ["id"];
          },
        ];
      };
      group_settlements: {
        Row: {
          amount: number;
          created_at: string;
          from_member_id: string;
          group_id: string;
          id: string;
          note: string | null;
          settled_at: string;
          to_member_id: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          from_member_id: string;
          group_id: string;
          id?: string;
          note?: string | null;
          settled_at?: string;
          to_member_id: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          from_member_id?: string;
          group_id?: string;
          id?: string;
          note?: string | null;
          settled_at?: string;
          to_member_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_settlements_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_settlements_from_member_id_fkey";
            columns: ["from_member_id"];
            isOneToOne: false;
            referencedRelation: "group_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_settlements_to_member_id_fkey";
            columns: ["to_member_id"];
            isOneToOne: false;
            referencedRelation: "group_members";
            referencedColumns: ["id"];
          },
        ];
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
          group_expense_id: string | null;
          group_settlement_id: string | null;
          id: string;
          import_hash: string | null;
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
          group_expense_id?: string | null;
          group_settlement_id?: string | null;
          id?: string;
          import_hash?: string | null;
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
          group_expense_id?: string | null;
          group_settlement_id?: string | null;
          id?: string;
          import_hash?: string | null;
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
          {
            foreignKeyName: "transactions_group_expense_id_fkey";
            columns: ["group_expense_id"];
            isOneToOne: false;
            referencedRelation: "group_expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_group_settlement_id_fkey";
            columns: ["group_settlement_id"];
            isOneToOne: false;
            referencedRelation: "group_settlements";
            referencedColumns: ["id"];
          },
        ];
      };
      user_preferences: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          currency: string;
          display_name: string | null;
          id: string;
          monthly_budget_default: number | null;
          updated_at: string;
          user_id: string;
          username: string | null;
          username_updated_at: string | null;
          previous_username: string | null;
          upi_id: string | null;
          is_developer: boolean;
          blocked_until: string | null;
          last_seen_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          currency?: string;
          display_name?: string | null;
          id?: string;
          monthly_budget_default?: number | null;
          updated_at?: string;
          user_id: string;
          username?: string | null;
          username_updated_at?: string | null;
          previous_username?: string | null;
          upi_id?: string | null;
          is_developer?: boolean;
          blocked_until?: string | null;
          last_seen_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          currency?: string;
          display_name?: string | null;
          id?: string;
          monthly_budget_default?: number | null;
          updated_at?: string;
          user_id?: string;
          username?: string | null;
          username_updated_at?: string | null;
          previous_username?: string | null;
          upi_id?: string | null;
          is_developer?: boolean;
          blocked_until?: string | null;
          last_seen_at?: string | null;
        };
        Relationships: [];
      };
      friend_requests: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      group_invites: {
        Row: {
          id: string;
          group_id: string;
          code: string;
          created_by: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          code?: string;
          created_by: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          code?: string;
          created_by?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_invites_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
      };
      uploaded_imports: {
        Row: {
          bank_detected: string | null;
          created_at: string;
          file_name: string;
          id: string;
          rows_detected: number;
          rows_duplicate: number;
          rows_imported: number;
          source_type: string;
          user_id: string;
        };
        Insert: {
          bank_detected?: string | null;
          created_at?: string;
          file_name: string;
          id?: string;
          rows_detected?: number;
          rows_duplicate?: number;
          rows_imported?: number;
          source_type: string;
          user_id: string;
        };
        Update: {
          bank_detected?: string | null;
          created_at?: string;
          file_name?: string;
          id?: string;
          rows_detected?: number;
          rows_duplicate?: number;
          rows_imported?: number;
          source_type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          created_at: string;
          id: string;
          last_message_at: string | null;
          user_a: string;
          user_b: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_message_at?: string | null;
          user_a: string;
          user_b: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_message_at?: string | null;
          user_a?: string;
          user_b?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          read_at: string | null;
          sender_id: string;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          read_at?: string | null;
          sender_id: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          read_at?: string | null;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth_key: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth_key?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_group_admin: { Args: { _group_id: string }; Returns: boolean };
      is_group_member: { Args: { _group_id: string }; Returns: boolean };
      is_expense_group_member: { Args: { _expense_id: string }; Returns: boolean };
      search_users: {
        Args: { _query: string };
        Returns: { user_id: string; username: string | null; display_name: string | null; avatar_url: string | null }[];
      };
      get_friends: {
        Args: Record<PropertyKey, never>;
        Returns: { friend_id: string; username: string | null; display_name: string | null; avatar_url: string | null }[];
      };
      get_incoming_requests: {
        Args: Record<PropertyKey, never>;
        Returns: {
          request_id: string;
          user_id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
        }[];
      };
      get_outgoing_requests: {
        Args: Record<PropertyKey, never>;
        Returns: {
          request_id: string;
          user_id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
        }[];
      };
      remove_friend: { Args: { _friend_id: string }; Returns: undefined };
      join_group_via_invite: { Args: { _code: string }; Returns: string };
      get_group_payment_info: {
        Args: { _group_id: string };
        Returns: { member_user_id: string; display_name: string | null; upi_id: string | null }[];
      };
      is_developer: { Args: Record<string, never>; Returns: boolean };
      admin_get_user_stats: { Args: Record<string, never>; Returns: { total_users: number }[] };
      admin_get_user_list: {
        Args: Record<string, never>;
        Returns: {
          user_id: string;
          email: string | null;
          display_name: string | null;
          username: string | null;
          created_at: string;
          last_seen_at: string | null;
          blocked_until: string | null;
          is_developer: boolean;
          chat_messages_sent: number;
          chat_rate_per_day: number;
        }[];
      };
      admin_block_user: { Args: { _user_id: string; _hours: number }; Returns: undefined };
      admin_unblock_user: { Args: { _user_id: string }; Returns: undefined };
      are_friends: { Args: { _a: string; _b: string }; Returns: boolean };
      is_conversation_participant: { Args: { _conversation_id: string }; Returns: boolean };
      get_or_create_conversation: { Args: { _friend_id: string }; Returns: string };
      get_monthly_message_count: { Args: { _conversation_id: string }; Returns: number };
      mark_conversation_read: { Args: { _conversation_id: string }; Returns: undefined };
      get_total_unread_count: { Args: Record<PropertyKey, never>; Returns: number };
      get_conversations: {
        Args: Record<PropertyKey, never>;
        Returns: {
          conversation_id: string;
          friend_id: string;
          friend_username: string | null;
          friend_display_name: string | null;
          friend_avatar_url: string | null;
          last_message: string | null;
          last_message_at: string | null;
          unread_count: number;
        }[];
      };
      delete_my_account_data: { Args: Record<PropertyKey, never>; Returns: undefined };
      delete_my_financial_data: { Args: Record<PropertyKey, never>; Returns: undefined };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
