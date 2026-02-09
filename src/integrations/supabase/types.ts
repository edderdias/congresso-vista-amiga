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
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name: string
          email: string
          phone?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      groups: {
        Row: {
          id: string
          group_number: number
          overseer_id: string | null
          assistant_id: string | null
          field_service_meeting: string | null
          publisher_count: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          group_number: number
          overseer_id?: string | null
          assistant_id?: string | null
          field_service_meeting?: string | null
          publisher_count?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          group_number?: number
          overseer_id?: string | null
          assistant_id?: string | null
          field_service_meeting?: string | null
          publisher_count?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_overseer_id_fkey"
            columns: ["overseer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
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
      preaching_reports: {
        Row: {
          id: string
          reporter_name: string | null
          group_id: number | null
          month: number
          year: number
          hours: number | null
          placements: number | null
          videos: number | null
          return_visits: number | null
          bible_studies: number | null
          notes: string | null
          pioneer_status: Database["public"]["Enums"]["pioneer_status"] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          reporter_name?: string | null
          group_id?: number | null
          month: number
          year: number
          hours?: number | null
          placements?: number | null
          videos?: number | null
          return_visits?: number | null
          bible_studies?: number | null
          notes?: string | null
          pioneer_status?: Database["public"]["Enums"]["pioneer_status"] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          reporter_name?: string | null
          group_id?: number | null
          month?: number
          year?: number
          hours?: number | null
          placements?: number | null
          videos?: number | null
          return_visits?: number | null
          bible_studies?: number | null
          notes?: string | null
          pioneer_status?: Database["public"]["Enums"]["pioneer_status"] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      territories: {
        Row: {
          id: string
          number: string
          name: string
          description: string | null
          status: Database["public"]["Enums"]["territory_status"] | null
          assigned_to: string | null
          assigned_date: string | null
          completed_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          number: string
          name: string
          description?: string | null
          status?: Database["public"]["Enums"]["territory_status"] | null
          assigned_to?: string | null
          assigned_date?: string | null
          completed_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          number?: string
          name?: string
          description?: string | null
          status?: Database["public"]["Enums"]["territory_status"] | null
          assigned_to?: string | null
          assigned_date?: string | null
          completed_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "territories_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      designations: {
        Row: {
          id: string
          user_id: string
          designation_type: Database["public"]["Enums"]["designation_type"]
          meeting_date: string
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          designation_type: Database["public"]["Enums"]["designation_type"]
          meeting_date: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          designation_type?: Database["public"]["Enums"]["designation_type"]
          meeting_date?: string
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "designations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
      designation_type: "sound" | "attendant" | "literature" | "cleaning" | "security"
      pioneer_status: "publicador" | "pioneiro_auxiliar" | "pioneiro_regular"
      territory_status: "available" | "assigned" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}