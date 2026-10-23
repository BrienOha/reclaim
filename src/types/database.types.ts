export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          currency: string;
          theme_mode: 'light' | 'dark' | 'system';
          has_completed_onboarding: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          theme_mode?: 'light' | 'dark' | 'system';
          has_completed_onboarding?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          currency?: string;
          theme_mode?: 'light' | 'dark' | 'system';
          has_completed_onboarding?: boolean;
          updated_at?: string;
        };
      };
      streaks: {
        Row: {
          id: string;
          user_id: string;
          habit_name: string;
          category: string;
          started_at: string;
          longest_streak_days: number;
          icon: string;
          accent_color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          habit_name: string;
          category?: string;
          started_at?: string;
          longest_streak_days?: number;
          icon?: string;
          accent_color?: string;
          created_at?: string;
        };
        Update: {
          habit_name?: string;
          category?: string;
          started_at?: string;
          longest_streak_days?: number;
          icon?: string;
          accent_color?: string;
        };
      };
      streak_logs: {
        Row: {
          id: string;
          user_id: string;
          streak_id: string;
          event_type: 'urge_resisted' | 'restarted' | 'milestone';
          mood: number | null;
          trigger_reason: string | null;
          notes: string | null;
          occurred_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          streak_id: string;
          event_type: 'urge_resisted' | 'restarted' | 'milestone';
          mood?: number | null;
          trigger_reason?: string | null;
          notes?: string | null;
          occurred_at?: string;
        };
        Update: {
          event_type?: 'urge_resisted' | 'restarted' | 'milestone';
          mood?: number | null;
          trigger_reason?: string | null;
          notes?: string | null;
        };
      };
      daily_checkins: {
        Row: {
          id: string;
          user_id: string;
          checkin_date: string;
          mood: number;
          journal_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          checkin_date?: string;
          mood: number;
          journal_note?: string | null;
          created_at?: string;
        };
        Update: {
          mood?: number;
          journal_note?: string | null;
        };
      };
      hobbies: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          icon: string;
          color: string;
          mini_projects: string[];
          creative_challenges: string[];
          total_minutes_logged: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          icon?: string;
          color?: string;
          mini_projects?: string[];
          creative_challenges?: string[];
          total_minutes_logged?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          icon?: string;
          color?: string;
          mini_projects?: string[];
          creative_challenges?: string[];
          total_minutes_logged?: number;
          is_active?: boolean;
        };
      };
      hobby_sessions: {
        Row: {
          id: string;
          user_id: string;
          hobby_id: string;
          duration_minutes: number;
          notes: string | null;
          attachment_urls: string[];
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          hobby_id: string;
          duration_minutes: number;
          notes?: string | null;
          attachment_urls?: string[];
          completed_at?: string;
        };
        Update: {
          duration_minutes?: number;
          notes?: string | null;
          attachment_urls?: string[];
        };
      };
      task_lists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          position?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          color?: string;
          position?: number;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          list_id: string | null;
          goal_id: string | null;
          title: string;
          notes: string | null;
          deadline: string | null;
          priority: 'low' | 'medium' | 'high' | 'urgent';
          tags: string[];
          subtasks: { id: string; title: string; completed: boolean }[];
          is_completed: boolean;
          completed_at: string | null;
          is_recurring: boolean;
          recurrence_rule: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          list_id?: string | null;
          goal_id?: string | null;
          title: string;
          notes?: string | null;
          deadline?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          tags?: string[];
          subtasks?: { id: string; title: string; completed: boolean }[];
          is_completed?: boolean;
          completed_at?: string | null;
          is_recurring?: boolean;
          recurrence_rule?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          list_id?: string | null;
          goal_id?: string | null;
          title?: string;
          notes?: string | null;
          deadline?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          tags?: string[];
          subtasks?: { id: string; title: string; completed: boolean }[];
          is_completed?: boolean;
          completed_at?: string | null;
          is_recurring?: boolean;
          recurrence_rule?: string | null;
          position?: number;
          updated_at?: string;
        };
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          entry_date: string;
          title: string;
          body: string;
          mood: number | null;
          font_family: string;
          canvas_layout: CanvasItem[];
          exported_image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entry_date?: string;
          title: string;
          body: string;
          mood?: number | null;
          font_family?: string;
          canvas_layout?: CanvasItem[];
          exported_image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          entry_date?: string;
          title?: string;
          body?: string;
          mood?: number | null;
          font_family?: string;
          canvas_layout?: CanvasItem[];
          exported_image_url?: string | null;
          updated_at?: string;
        };
      };
      finance_weeks: {
        Row: {
          id: string;
          user_id: string;
          week_start_date: string;
          allowance_amount: number;
          savings_allocation: number;
          currency: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start_date: string;
          allowance_amount?: number;
          savings_allocation?: number;
          currency?: string;
          created_at?: string;
        };
        Update: {
          allowance_amount?: number;
          savings_allocation?: number;
          currency?: string;
        };
      };
      finance_expenses: {
        Row: {
          id: string;
          user_id: string;
          week_id: string;
          expense_date: string;
          amount: number;
          category: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_id: string;
          expense_date?: string;
          amount: number;
          category: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          expense_date?: string;
          amount?: number;
          category?: string;
          note?: string | null;
        };
      };
      finance_wishlist: {
        Row: {
          id: string;
          user_id: string;
          item_name: string;
          price: number;
          image_url: string | null;
          link_url: string | null;
          priority: 'low' | 'medium' | 'high';
          is_bought: boolean;
          bought_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_name: string;
          price: number;
          image_url?: string | null;
          link_url?: string | null;
          priority?: 'low' | 'medium' | 'high';
          is_bought?: boolean;
          bought_at?: string | null;
          created_at?: string;
        };
        Update: {
          item_name?: string;
          price?: number;
          image_url?: string | null;
          link_url?: string | null;
          priority?: 'low' | 'medium' | 'high';
          is_bought?: boolean;
          bought_at?: string | null;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          tier: 'small' | 'big' | 'life';
          title: string;
          description: string | null;
          category: string;
          target_date: string | null;
          cover_image_url: string | null;
          is_pinned_of_week: boolean;
          is_archived: boolean;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier: 'small' | 'big' | 'life';
          title: string;
          description?: string | null;
          category?: string;
          target_date?: string | null;
          cover_image_url?: string | null;
          is_pinned_of_week?: boolean;
          is_archived?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tier?: 'small' | 'big' | 'life';
          title?: string;
          description?: string | null;
          category?: string;
          target_date?: string | null;
          cover_image_url?: string | null;
          is_pinned_of_week?: boolean;
          is_archived?: boolean;
          completed_at?: string | null;
          updated_at?: string;
        };
      };
      goal_milestones: {
        Row: {
          id: string;
          goal_id: string;
          user_id: string;
          title: string;
          is_completed: boolean;
          linked_task_id: string | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          user_id: string;
          title: string;
          is_completed?: boolean;
          linked_task_id?: string | null;
          position?: number;
          created_at?: string;
        };
        Update: {
          title?: string;
          is_completed?: boolean;
          linked_task_id?: string | null;
          position?: number;
        };
      };
    };
  };
}

export interface CanvasItem {
  id: string;
  type: 'photo' | 'sticker';
  uri?: string;
  stickerKey?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  borderColor?: string;
  borderWidth?: number;
}
