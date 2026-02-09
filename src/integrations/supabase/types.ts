export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      publishers: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          birth_date: string | null
          baptism_date: string | null
          gender: 'M' | 'F' | null
          privileges: string[]
          hope: 'anointed' | 'other_sheep' | null
          status: 'active' | 'inactive'
          group_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          full_name: string
          phone?: string | null
          birth_date?: string | null
          baptism_date?: string | null
          gender?: 'M' | 'F' | null
          privileges?: string[]
          hope?: 'anointed' | 'other_sheep' | null
          status?: 'active' | 'inactive'
          group_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          phone?: string | null
          birth_date?: string | null
          baptism_date?: string | null
          gender?: 'M' | 'F' | null
          privileges?: string[]
          hope?: 'anointed' | 'other_sheep' | null
          status?: 'active' | 'inactive'
          group_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "publishers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          }
        ]
      }
      designations: {
        Row: {
          created_at: string | null
          designation_type: Database["public"]["Enums"]["designation_type"]
          id: string
          meeting_date: string
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          designation_type: Database["public"]["Enums"]["designation_type"]
          id?: string
          meeting_date: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          designation_type?: Database["public"]["Enums"]["designation_type"]
          id?: string
          meeting_date?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "designations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          assistant_id: string | null
          created_at: string | null
          field_service_meeting: string | null
          group_number: number
          id: string
          overseer_id: string | null
          publisher_count: number
          updated_at: string | null
        }
        Insert: {
          assistant_id?: string | null
          created_at?: string | null
          field_service_meeting?: string | null
          group_number: number
          id?: string
          overseer_id?: string | null
          publisher_count?: number
          updated_at?: string | null
        }
        Update: {
          assistant_id?: string | null
          created_at?: string | null
          field_service_meeting?: string | null
          group_number?: number
          id?: string
          overseer_id?: string | null
          publisher_count?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_overseer_id_fkey"
            columns: ["overseer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      preaching_reports: {
        Row: {
          bible_studies: number | null
          created_at: string | null
          hours: number | null
          id: string
          month: number
          notes: string | null
          placements: number | null
          return_visits: number | null
          reporter_name: string | null
          updated_at: string | null
          videos: number | null
          year: number
          group_id: number | null
          pioneer_status: Database["public"]["Enums"]["pioneer_status"] | null
        }
        Insert: {
          bible_studies?: number | null
          created_at?: string | null
          hours?: number | null
          id?: string
          month: number
          notes?: string | null
          placements?: number | null
          return_visits?: number | null
          reporter_name?: string | null
          updated_at?: string | null
          videos?: number | null
          year: number
          group_id?: number | null
          pioneer_status?: Database["public"]["Enums"]["pioneer_status"] | null
        }
        Update: {
          bible_studies?: number | null
          created_at?: string | null
          hours?: number | null
          id?: string
          month?: number
          notes?: string | null
          placements?: number | null
          return_visits?: number | null
          reporter_name?: string | null
          updated_at?: string | null
          videos?: number | null
          year?: number
          group_id?: number | null
          pioneer_status?: Database["public"]["Enums"]["pioneer_status"] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      territories: {
        Row: {
          assigned_date: string | null
          assigned_to: string | null
          completed_date: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          number: string
          status: Database["public"]["Enums"]["territory_status"] | null
          updated_at: string | null
        }
        Insert: {
          assigned_date?: string | null
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          number: string
          status?: Database["public"]["Enums"]["territory_status"] | null
          updated_at?: string | null
        }
        Update: {
          assigned_date?: string | null
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          number?: string
          status?: Database["public"]["Enums"]["territory_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "territories_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      designation_type:
        | "sound"
        | "attendant"
        | "literature"
        | "cleaning"
        | "security"
      pioneer_status: "publicador" | "pioneiro_auxiliar" | "pioneiro_regular"
      territory_status: "available" | "assigned" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  T extends keyof Database['public']['Tables']
> = Database['public']['Tables'][T]['Row']

export type TablesInsert<
  T extends keyof Database['public']['Tables']
> = Database['public']['Tables'][T]['Insert']

export type TablesUpdate<
  T extends keyof Database['public']['Tables']
> = Database['public']['Tables'][T]['Update']

export type Enums<
  T extends keyof Database['public']['Enums']
> = Database['public']['Enums'][T]