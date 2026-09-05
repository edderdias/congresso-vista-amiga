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
          status: 'pending' | 'active' | 'inactive'
          role: 'admin' | 'user'
          permissions: Json
        }
        Insert: {
          id: string
          full_name: string
          email: string
          phone?: string | null
          created_at?: string | null
          updated_at?: string | null
          status?: 'pending' | 'active' | 'inactive'
          role?: 'admin' | 'user'
          permissions?: Json
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string | null
          created_at?: string | null
          updated_at?: string | null
          status?: 'pending' | 'active' | 'inactive'
          role?: 'admin' | 'user'
          permissions?: Json
        }
        Relationships: []
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
          status: 'active' | 'inactive' | 'repreendido' | 'removido' | 'mudou'
          group_id: string | null
          aux_pioneer_mode: 'indeterminado' | 'mes_unico' | 'periodo' | null
          aux_pioneer_start_month: string | null
          aux_pioneer_end_month: string | null
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
          status?: 'active' | 'inactive' | 'repreendido' | 'removido' | 'mudou'
          group_id?: string | null
          aux_pioneer_mode?: 'indeterminado' | 'mes_unico' | 'periodo' | null
          aux_pioneer_start_month?: string | null
          aux_pioneer_end_month?: string | null
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
          status?: 'active' | 'inactive' | 'repreendido' | 'removido' | 'mudou'
          group_id?: string | null
          aux_pioneer_mode?: 'indeterminado' | 'mes_unico' | 'periodo' | null
          aux_pioneer_start_month?: string | null
          aux_pioneer_end_month?: string | null
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
          credits: number | null
          total_hours: number | null
          placements: number | null
          videos: number | null
          return_visits: number | null
          bible_studies: number | null
          notes: string | null
          pioneer_status: 'publicador' | 'pioneiro_auxiliar' | 'pioneiro_regular' | null
          created_at: string | null
          updated_at: string | null
          publisher_id: string | null
          participated: boolean | null
        }
        Insert: {
          id?: string
          reporter_name?: string | null
          group_id?: number | null
          month: number
          year: number
          hours?: number | null
          credits?: number | null
          total_hours?: number | null
          placements?: number | null
          videos?: number | null
          return_visits?: number | null
          bible_studies?: number | null
          notes?: string | null
          pioneer_status?: 'publicador' | 'pioneiro_auxiliar' | 'pioneiro_regular' | null
          created_at?: string | null
          updated_at?: string | null
          publisher_id?: string | null
          participated?: boolean | null
        }
        Update: {
          id?: string
          reporter_name?: string | null
          group_id?: number | null
          month?: number
          year?: number
          hours?: number | null
          credits?: number | null
          total_hours?: number | null
          placements?: number | null
          videos?: number | null
          return_visits?: number | null
          bible_studies?: number | null
          notes?: string | null
          pioneer_status?: 'publicador' | 'pioneiro_auxiliar' | 'pioneiro_regular' | null
          created_at?: string | null
          updated_at?: string | null
          publisher_id?: string | null
          participated?: boolean | null
        }
        Relationships: []
      }
    }
  }
}