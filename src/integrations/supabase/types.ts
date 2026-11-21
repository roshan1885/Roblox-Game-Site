export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string
          author_name: string | null
          content: string
          created_at: string
          id: string
          is_published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string
          author_name?: string | null
          content: string
          created_at?: string
          id?: string
          is_published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string | null
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      application_forms: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          role_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          role_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          role_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_forms_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: true
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          form_id: string
          id: string
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["application_status"]
          submitted_at: string
          user_id: string
        }
        Insert: {
          form_id: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string
          user_id: string
        }
        Update: {
          form_id?: string
          id?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "application_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_roles: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_recruitable: boolean
          name: string
          permissions: Database["public"]["Enums"]["app_permission"][]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_recruitable?: boolean
          name: string
          permissions?: Database["public"]["Enums"]["app_permission"][]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_recruitable?: boolean
          name?: string
          permissions?: Database["public"]["Enums"]["app_permission"][]
          updated_at?: string
        }
        Relationships: []
      }
      form_fields: {
        Row: {
          form_id: string
          id: string
          label: string
          options: string[]
          placeholder: string | null
          required: boolean
          sort_order: number
          type: Database["public"]["Enums"]["form_field_type"]
        }
        Insert: {
          form_id: string
          id?: string
          label: string
          options?: string[]
          placeholder?: string | null
          required?: boolean
          sort_order?: number
          type?: Database["public"]["Enums"]["form_field_type"]
        }
        Update: {
          form_id?: string
          id?: string
          label?: string
          options?: string[]
          placeholder?: string | null
          required?: boolean
          sort_order?: number
          type?: Database["public"]["Enums"]["form_field_type"]
        }
        Relationships: [
          {
            foreignKeyName: "form_fields_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "application_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_responses: {
        Row: {
          application_id: string
          field_id: string
          id: string
          user_id: string
          value: string
        }
        Insert: {
          application_id: string
          field_id: string
          id?: string
          user_id: string
          value?: string
        }
        Update: {
          application_id?: string
          field_id?: string
          id?: string
          user_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_responses_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_responses_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "form_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      game_info: {
        Row: {
          description: string
          game_url: string
          genre: string | null
          id: string
          legacy_id: string | null
          release_date: string | null
          thumbnail: string | null
          title: string
          updated_at: string
        }
        Insert: {
          description: string
          game_url: string
          genre?: string | null
          id?: string
          legacy_id?: string | null
          release_date?: string | null
          thumbnail?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          description?: string
          game_url?: string
          genre?: string | null
          id?: string
          legacy_id?: string | null
          release_date?: string | null
          thumbnail?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      legacy_users: {
        Row: {
          email: string
          is_active: boolean
          legacy_id: string
          linked_at: string | null
          linked_user_id: string | null
          original_created_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          username: string | null
        }
        Insert: {
          email: string
          is_active?: boolean
          legacy_id: string
          linked_at?: string | null
          linked_user_id?: string | null
          original_created_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          username?: string | null
        }
        Update: {
          email?: string
          is_active?: boolean
          legacy_id?: string
          linked_at?: string | null
          linked_user_id?: string | null
          original_created_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          username?: string | null
        }
        Relationships: []
      }
      notices: {
        Row: {
          author_id: string
          author_name: string | null
          content: string
          created_at: string
          id: string
          is_published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string
          author_name?: string | null
          content: string
          created_at?: string
          id?: string
          is_published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string | null
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          legacy_user_id: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          is_active?: boolean
          legacy_user_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          legacy_user_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          legacy_id: string | null
          maintenance_mode: boolean
          registration_open: boolean
          site_description: string | null
          site_name: string
          updated_at: string
        }
        Insert: {
          id?: string
          legacy_id?: string | null
          maintenance_mode?: boolean
          registration_open?: boolean
          site_description?: string | null
          site_name?: string
          updated_at?: string
        }
        Update: {
          id?: string
          legacy_id?: string | null
          maintenance_mode?: boolean
          registration_open?: boolean
          site_description?: string | null
          site_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string
          created_by: string | null
          icon: string | null
          id: string
          is_active: boolean
          label: string | null
          platform: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          platform: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          platform?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      task_reports: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id: string
          user_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_reports_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_role_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_role: {
        Args: {
          _actor: string
          _target_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      can_manage_user: {
        Args: { _actor: string; _target: string }
        Returns: boolean
      }
      get_my_access: { Args: never; Returns: Json }
      get_user_permissions: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_permission"][]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_permission: {
        Args: {
          _perm: Database["public"]["Enums"]["app_permission"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      link_legacy_user: {
        Args: { _email: string; _user_id: string }
        Returns: undefined
      }
      role_default_permissions: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: Database["public"]["Enums"]["app_permission"][]
      }
      role_level: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: number
      }
      set_user_active: {
        Args: { _active: boolean; _target: string }
        Returns: undefined
      }
      set_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _target: string
        }
        Returns: undefined
      }
      submit_application: {
        Args: { _form_id: string; _responses: Json }
        Returns: string
      }
    }
    Enums: {
      app_permission:
        | "CAN_POST_ANNOUNCEMENTS"
        | "CAN_POST_NOTICES"
        | "CAN_ASSIGN_TASKS"
        | "CAN_MANAGE_USERS"
        | "CAN_MANAGE_ROLES"
        | "CAN_VIEW_APPLICATIONS"
        | "CAN_MANAGE_APPLICATIONS"
        | "CAN_MANAGE_SOCIALS"
        | "CAN_CREATE_FORMS"
        | "ADMINISTRATOR"
      app_role:
        | "system"
        | "owner"
        | "co_owner"
        | "custom_role"
        | "application_reader"
        | "public"
      application_status: "PENDING" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED"
      form_field_type:
        | "TEXT"
        | "TEXTAREA"
        | "EMAIL"
        | "NUMBER"
        | "SELECT"
        | "CHECKBOX"
        | "RADIO"
        | "DATE"
      task_priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
      task_status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_permission: [
        "CAN_POST_ANNOUNCEMENTS",
        "CAN_POST_NOTICES",
        "CAN_ASSIGN_TASKS",
        "CAN_MANAGE_USERS",
        "CAN_MANAGE_ROLES",
        "CAN_VIEW_APPLICATIONS",
        "CAN_MANAGE_APPLICATIONS",
        "CAN_MANAGE_SOCIALS",
        "CAN_CREATE_FORMS",
        "ADMINISTRATOR",
      ],
      app_role: [
        "system",
        "owner",
        "co_owner",
        "custom_role",
        "application_reader",
        "public",
      ],
      application_status: ["PENDING", "UNDER_REVIEW", "ACCEPTED", "REJECTED"],
      form_field_type: [
        "TEXT",
        "TEXTAREA",
        "EMAIL",
        "NUMBER",
        "SELECT",
        "CHECKBOX",
        "RADIO",
        "DATE",
      ],
      task_priority: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      task_status: ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
    },
  },
} as const
