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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      build_stages: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          logs: string[] | null
          pipeline_run_id: string
          stage_name: string
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          logs?: string[] | null
          pipeline_run_id: string
          stage_name: string
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          logs?: string[] | null
          pipeline_run_id?: string
          stage_name?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "build_stages_pipeline_run_id_fkey"
            columns: ["pipeline_run_id"]
            isOneToOne: false
            referencedRelation: "pipeline_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      deployments: {
        Row: {
          created_at: string
          deployed_at: string | null
          ecs_service: string | null
          id: string
          image_tag: string
          image_uri: string | null
          pipeline_run_id: string
          status: string
        }
        Insert: {
          created_at?: string
          deployed_at?: string | null
          ecs_service?: string | null
          id?: string
          image_tag: string
          image_uri?: string | null
          pipeline_run_id: string
          status?: string
        }
        Update: {
          created_at?: string
          deployed_at?: string | null
          ecs_service?: string | null
          id?: string
          image_tag?: string
          image_uri?: string | null
          pipeline_run_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "deployments_pipeline_run_id_fkey"
            columns: ["pipeline_run_id"]
            isOneToOne: false
            referencedRelation: "pipeline_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_runs: {
        Row: {
          commit_message: string | null
          commit_sha: string | null
          completed_at: string | null
          created_at: string
          github_repo: string
          id: string
          started_at: string
          status: string
          triggered_by: string | null
        }
        Insert: {
          commit_message?: string | null
          commit_sha?: string | null
          completed_at?: string | null
          created_at?: string
          github_repo: string
          id?: string
          started_at?: string
          status?: string
          triggered_by?: string | null
        }
        Update: {
          commit_message?: string | null
          commit_sha?: string | null
          completed_at?: string | null
          created_at?: string
          github_repo?: string
          id?: string
          started_at?: string
          status?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      pipeline_stages_config: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          function_name: string | null
          icon: string | null
          id: string
          order_index: number
          stage_name: string
          template_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          function_name?: string | null
          icon?: string | null
          id?: string
          order_index: number
          stage_name: string
          template_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          function_name?: string | null
          icon?: string | null
          id?: string
          order_index?: number
          stage_name?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_config_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "pipeline_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      service_accounts: {
        Row: {
          api_key: string
          created_at: string
          id: string
          last_used_at: string | null
          name: string
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          last_used_at?: string | null
          name: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          last_used_at?: string | null
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_service_account: {
        Args: { _api_key: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "developer" | "viewer"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "developer", "viewer"],
    },
  },
} as const
