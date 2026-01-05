// src/lib/database.types.ts
// Supabase Database Types - Generated from schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      machines: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          updated_at?: string
        }
      }
      parts: {
        Row: {
          id: string
          name: string
          machine_id: string
          pipe_size: string
          part_family: string
          part_number: string | null
          description: string | null
          image_url: string | null
          stock: number | null
          location: string | null
          pdf_url: string | null
          pdf_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          machine_id: string
          pipe_size: string
          part_family: string
          part_number?: string | null
          description?: string | null
          image_url?: string | null
          stock?: number | null
          location?: string | null
          pdf_url?: string | null
          pdf_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          machine_id?: string
          pipe_size?: string
          part_family?: string
          part_number?: string | null
          description?: string | null
          image_url?: string | null
          stock?: number | null
          location?: string | null
          pdf_url?: string | null
          pdf_name?: string | null
          updated_at?: string
        }
      }
      tools: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          location?: string | null
          updated_at?: string
        }
      }
      pipe_sizes: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      changeover_templates: {
        Row: {
          id: string
          machine_id: string
          name: string
          estimated_time: number | null
          documents: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          machine_id: string
          name: string
          estimated_time?: number | null
          documents?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          machine_id?: string
          name?: string
          estimated_time?: number | null
          documents?: Json | null
          updated_at?: string
        }
      }
      changeover_steps: {
        Row: {
          id: string
          template_id: string
          title: string
          description: string
          order_num: number
          required_part_names: string[] | null
          required_tools: Json | null
          image_urls: string[] | null
          pdf_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_id: string
          title: string
          description: string
          order_num: number
          required_part_names?: string[] | null
          required_tools?: Json | null
          image_urls?: string[] | null
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          title?: string
          description?: string
          order_num?: number
          required_part_names?: string[] | null
          required_tools?: Json | null
          image_urls?: string[] | null
          pdf_url?: string | null
          updated_at?: string
        }
      }
      changeover_logs: {
        Row: {
          id: string
          machine_id: string
          from_size: string
          to_size: string
          duration: number
          machine_name: string | null
          operator_name: string | null
          step_notes: Json | null
          final_note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          machine_id: string
          from_size: string
          to_size: string
          duration: number
          machine_name?: string | null
          operator_name?: string | null
          step_notes?: Json | null
          final_note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          machine_id?: string
          from_size?: string
          to_size?: string
          duration?: number
          machine_name?: string | null
          operator_name?: string | null
          step_notes?: Json | null
          final_note?: string | null
        }
      }
      consumable_items: {
        Row: {
          id: string
          name: string
          machine_id: string | null
          stock: number
          min_stock: number | null
          unit: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          machine_id?: string | null
          stock: number
          min_stock?: number | null
          unit?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          machine_id?: string | null
          stock?: number
          min_stock?: number | null
          unit?: string | null
          updated_at?: string
        }
      }
      consumable_logs: {
        Row: {
          id: string
          item_id: string
          machine_id: string
          quantity_used: number
          operator_name: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          machine_id: string
          quantity_used: number
          operator_name?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          machine_id?: string
          quantity_used?: number
          operator_name?: string | null
          note?: string | null
        }
      }
    }
  }
}
