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
      // ... rest of the tables stay the same
    }
    // ... rest of the types stay the same
  }
}