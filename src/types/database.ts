export interface Database {
  public: {
    Tables: {
      raw_crawl_data: {
        Row: {
          id: number
          source_site: string
          source_url: string
          raw_html: string
          metadata: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          source_site: string
          source_url: string
          raw_html: string
          metadata?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          source_site?: string
          source_url?: string
          raw_html?: string
          metadata?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
      }
      campaigns: {
        Row: {
          id: number
          source_site: string
          campaign_id: string
          title: string
          description: string | null
          thumbnail_image: string | null
          detail_url: string | null
          applications_current: number
          applications_total: number
          reward_points: number
          category: string | null
          location_type: string | null
          channels: string[]
          raw_data_id: number | null
          extracted_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          source_site: string
          campaign_id: string
          title: string
          description?: string | null
          thumbnail_image?: string | null
          detail_url?: string | null
          applications_current?: number
          applications_total?: number
          reward_points?: number
          category?: string | null
          location_type?: string | null
          channels?: string[]
          raw_data_id?: number | null
          extracted_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          source_site?: string
          campaign_id?: string
          title?: string
          description?: string | null
          thumbnail_image?: string | null
          detail_url?: string | null
          applications_current?: number
          applications_total?: number
          reward_points?: number
          category?: string | null
          location_type?: string | null
          channels?: string[]
          raw_data_id?: number | null
          extracted_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      extractor_versions: {
        Row: {
          id: number
          version: string
          description: string
          extraction_logic: Record<string, unknown>
          created_at: string
          is_active: boolean
        }
        Insert: {
          id?: number
          version: string
          description: string
          extraction_logic: Record<string, unknown>
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: number
          version?: string
          description?: string
          extraction_logic?: Record<string, unknown>
          created_at?: string
          is_active?: boolean
        }
      }
      regions: {
        Row: {
          id: number
          code: string
          name: string
          official_code: string | null
          level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          code: string
          name: string
          official_code?: string | null
          level: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          code?: string
          name?: string
          official_code?: string | null
          level?: number
          created_at?: string
          updated_at?: string
        }
      }
      sub_regions: {
        Row: {
          id: number
          code: string
          name: string
          parent_code: string
          official_code: string | null
          region_id: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          code: string
          name: string
          parent_code: string
          official_code?: string | null
          region_id: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          code?: string
          name?: string
          parent_code?: string
          official_code?: string | null
          region_id?: number
          created_at?: string
          updated_at?: string
        }
      }
      region_sync_logs: {
        Row: {
          id: number
          last_sync_at: string
          status: 'success' | 'error'
          error_message: string | null
          total_regions: number
          total_sub_regions: number
          created_at: string
        }
        Insert: {
          id?: number
          last_sync_at?: string
          status: 'success' | 'error'
          error_message?: string | null
          total_regions: number
          total_sub_regions: number
          created_at?: string
        }
        Update: {
          id?: number
          last_sync_at?: string
          status?: 'success' | 'error'
          error_message?: string | null
          total_regions?: number
          total_sub_regions?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type DbRegion = Database['public']['Tables']['regions']['Row'];
export type DbSubRegion = Database['public']['Tables']['sub_regions']['Row'];
export type RegionSyncLog = Database['public']['Tables']['region_sync_logs']['Row'];