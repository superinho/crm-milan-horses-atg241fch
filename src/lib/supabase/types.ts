// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
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
    PostgrestVersion: '14.1'
  }
  public: {
    Tables: {
      auction_candidate_items: {
        Row: {
          created_at: string | null
          horse_id: string
          id: string
          list_id: string
          notes: string | null
          potential_score: number | null
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          horse_id: string
          id?: string
          list_id: string
          notes?: string | null
          potential_score?: number | null
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          horse_id?: string
          id?: string
          list_id?: string
          notes?: string | null
          potential_score?: number | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'auction_candidate_items_horse_id_fkey'
            columns: ['horse_id']
            isOneToOne: false
            referencedRelation: 'studbook_horses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'auction_candidate_items_horse_id_fkey'
            columns: ['horse_id']
            isOneToOne: false
            referencedRelation: 'studbook_horses_enriched'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'auction_candidate_items_list_id_fkey'
            columns: ['list_id']
            isOneToOne: false
            referencedRelation: 'auction_candidate_lists'
            referencedColumns: ['id']
          },
        ]
      }
      auction_candidate_lists: {
        Row: {
          created_at: string | null
          filters: Json | null
          id: string
          name: string
          notes: string | null
          status: string | null
          thesis: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          name: string
          notes?: string | null
          status?: string | null
          thesis?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          name?: string
          notes?: string | null
          status?: string | null
          thesis?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_settings: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          rule_key: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          rule_key: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          rule_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bids: {
        Row: {
          auction_id: string | null
          contact_id: string | null
          created_at: string | null
          date: string | null
          id: string
          lot_number: string | null
          payload: Json | null
          reason: string | null
          smartleiloes_event_id: string | null
          smartleiloes_id: string | null
          smartleiloes_lot_id: string | null
          value: number
        }
        Insert: {
          auction_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          lot_number?: string | null
          payload?: Json | null
          reason?: string | null
          smartleiloes_event_id?: string | null
          smartleiloes_id?: string | null
          smartleiloes_lot_id?: string | null
          value?: number
        }
        Update: {
          auction_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          lot_number?: string | null
          payload?: Json | null
          reason?: string | null
          smartleiloes_event_id?: string | null
          smartleiloes_id?: string | null
          smartleiloes_lot_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: 'bids_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contact_segmentation_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bids_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bids_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'customer_rfmv_extended_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bids_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'customer_rfmv_view'
            referencedColumns: ['id']
          },
        ]
      }
      campaign_recipients: {
        Row: {
          campaign_id: string | null
          channel: string
          contact_id: string | null
          created_at: string | null
          email: string | null
          id: string
          message: string
          metadata: Json | null
          opted_out_at: string | null
          phone: string | null
          score: number | null
          segment: string | null
          status: string
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          channel: string
          contact_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message: string
          metadata?: Json | null
          opted_out_at?: string | null
          phone?: string | null
          score?: number | null
          segment?: string | null
          status?: string
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          channel?: string
          contact_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          opted_out_at?: string | null
          phone?: string | null
          score?: number | null
          segment?: string | null
          status?: string
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'campaign_recipients_campaign_id_fkey'
            columns: ['campaign_id']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'campaign_recipients_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contact_segmentation_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'campaign_recipients_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'campaign_recipients_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'customer_rfmv_extended_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'campaign_recipients_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'customer_rfmv_view'
            referencedColumns: ['id']
          },
        ]
      }
      campaign_schedules: {
        Row: {
          campaign_id: string | null
          channel_type: string
          content: string | null
          created_at: string | null
          id: string
          processed_at: string | null
          scheduled_date: string
          status: string
          subject: string | null
          template_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          channel_type: string
          content?: string | null
          created_at?: string | null
          id?: string
          processed_at?: string | null
          scheduled_date?: string
          status?: string
          subject?: string | null
          template_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          channel_type?: string
          content?: string | null
          created_at?: string | null
          id?: string
          processed_at?: string | null
          scheduled_date?: string
          status?: string
          subject?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'campaign_schedules_campaign_id_fkey'
            columns: ['campaign_id']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'campaign_schedules_template_id_fkey'
            columns: ['template_id']
            isOneToOne: false
            referencedRelation: 'message_templates'
            referencedColumns: ['id']
          },
        ]
      }
      campaign_sends: {
        Row: {
          campaign_id: string | null
          campaign_recipient_id: string | null
          channel: string
          clicked_at: string | null
          content: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          interacted_at: string | null
          metadata: Json | null
          opened_at: string | null
          provider_id: string | null
          recipient_id: string | null
          schedule_id: string | null
          sent_at: string | null
          status: string
          subject: string | null
        }
        Insert: {
          campaign_id?: string | null
          campaign_recipient_id?: string | null
          channel: string
          clicked_at?: string | null
          content?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          interacted_at?: string | null
          metadata?: Json | null
          opened_at?: string | null
          provider_id?: string | null
          recipient_id?: string | null
          schedule_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
        }
        Update: {
          campaign_id?: string | null
          campaign_recipient_id?: string | null
          channel?: string
          clicked_at?: string | null
          content?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          interacted_at?: string | null
          metadata?: Json | null
          opened_at?: string | null
          provider_id?: string | null
          recipient_id?: string | null
          schedule_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'campaign_sends_campaign_id_fkey'
            columns: ['campaign_id']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'campaign_sends_campaign_recipient_id_fkey'
            columns: ['campaign_recipient_id']
            isOneToOne: false
            referencedRelation: 'campaign_recipients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'campaign_sends_recipient_id_fkey'
            columns: ['recipient_id']
            isOneToOne: false
            referencedRelation: 'contact_segmentation_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'campaign_sends_recipient_id_fkey'
            columns: ['recipient_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'campaign_sends_recipient_id_fkey'
            columns: ['recipient_id']
            isOneToOne: false
            referencedRelation: 'customer_rfmv_extended_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'campaign_sends_recipient_id_fkey'
            columns: ['recipient_id']
            isOneToOne: false
            referencedRelation: 'customer_rfmv_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'campaign_sends_schedule_id_fkey'
            columns: ['schedule_id']
            isOneToOne: false
            referencedRelation: 'campaign_schedules'
            referencedColumns: ['id']
          },
        ]
      }
      campaigns: {
        Row: {
          audience_filters: Json | null
          channels: string[] | null
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          metadata: Json | null
          name: string
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          audience_filters?: Json | null
          channels?: string[] | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          metadata?: Json | null
          name: string
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          audience_filters?: Json | null
          channels?: string[] | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          metadata?: Json | null
          name?: string
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          website?: string | null
        }
        Relationships: []
      }
      contact_interactions: {
        Row: {
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          date: string | null
          deal_id: string | null
          description: string | null
          id: string
          metadata: Json | null
          status: string | null
          type: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          deal_id?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          type: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          deal_id?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'contact_interactions_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contact_segmentation_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contact_interactions_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contact_interactions_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'customer_rfmv_extended_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contact_interactions_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'customer_rfmv_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contact_interactions_deal_id_fkey'
            columns: ['deal_id']
            isOneToOne: false
            referencedRelation: 'deals'
            referencedColumns: ['id']
          },
        ]
      }
      contact_tags: {
        Row: {
          contact_id: string
          tag_id: string
        }
        Insert: {
          contact_id: string
          tag_id: string
        }
        Update: {
          contact_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'contact_tags_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contact_segmentation_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contact_tags_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contact_tags_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'customer_rfmv_extended_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contact_tags_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'customer_rfmv_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contact_tags_tag_id_fkey'
            columns: ['tag_id']
            isOneToOne: false
            referencedRelation: 'tags'
            referencedColumns: ['id']
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          birth_date: string | null
          city: string | null
          cpf: string | null
          created_at: string | null
          document: string | null
          email: string
          id: string
          name: string
          notes: string | null
          origin: string | null
          phone: string
          preferences: Json | null
          smartleiloes_id: string | null
          source_payload: Json | null
          state: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          document?: string | null
          email: string
          id?: string
          name: string
          notes?: string | null
          origin?: string | null
          phone: string
          preferences?: Json | null
          smartleiloes_id?: string | null
          source_payload?: Json | null
          state?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          document?: string | null
          email?: string
          id?: string
          name?: string
          notes?: string | null
          origin?: string | null
          phone?: string
          preferences?: Json | null
          smartleiloes_id?: string | null
          source_payload?: Json | null
          state?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      deal_tasks: {
        Row: {
          created_at: string | null
          deal_id: string
          description: string
          id: string
          is_completed: boolean | null
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          description: string
          id?: string
          is_completed?: boolean | null
        }
        Update: {
          created_at?: string | null
          deal_id?: string
          description?: string
          id?: string
          is_completed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'deal_tasks_deal_id_fkey'
            columns: ['deal_id']
            isOneToOne: false
            referencedRelation: 'deals'
            referencedColumns: ['id']
          },
        ]
      }
      deals: {
        Row: {
          contact_id: string | null
          created_at: string | null
          expected_close_date: string | null
          id: string
          notes: string | null
          probability: number | null
          stage: string
          title: string
          updated_at: string | null
          value: number
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          probability?: number | null
          stage: string
          title: string
          updated_at?: string | null
          value?: number
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          probability?: number | null
          stage?: string
          title?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: 'deals_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contact_segmentation_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'deals_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'deals_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'customer_rfmv_extended_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'deals_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'customer_rfmv_view'
            referencedColumns: ['id']
          },
        ]
      }
      global_auction_houses: {
        Row: {
          country: string | null
          created_at: string | null
          id: string
          name: string
          normalized_name: string
          notes: string | null
          source_id: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          id?: string
          name: string
          normalized_name: string
          notes?: string | null
          source_id?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          id?: string
          name?: string
          normalized_name?: string
          notes?: string | null
          source_id?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'global_auction_houses_source_id_fkey'
            columns: ['source_id']
            isOneToOne: false
            referencedRelation: 'global_auction_sources'
            referencedColumns: ['id']
          },
        ]
      }
      global_auction_import_runs: {
        Row: {
          error_message: string | null
          finished_at: string | null
          id: string
          metadata: Json | null
          rows_imported: number | null
          rows_seen: number | null
          rows_skipped: number | null
          source_id: string | null
          source_url: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json | null
          rows_imported?: number | null
          rows_seen?: number | null
          rows_skipped?: number | null
          source_id?: string | null
          source_url?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          metadata?: Json | null
          rows_imported?: number | null
          rows_seen?: number | null
          rows_skipped?: number | null
          source_id?: string | null
          source_url?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'global_auction_import_runs_source_id_fkey'
            columns: ['source_id']
            isOneToOne: false
            referencedRelation: 'global_auction_sources'
            referencedColumns: ['id']
          },
        ]
      }
      global_auction_lots: {
        Row: {
          age: number | null
          auction_id: string
          birth_year: number | null
          breeder_name: string | null
          buyer_country: string | null
          buyer_name: string | null
          color: string | null
          confidence_score: number | null
          created_at: string | null
          currency: string
          dam_name: string | null
          dam_sire_name: string | null
          discipline: string
          hammer_price: number | null
          horse_name: string
          id: string
          lot_number: string | null
          normalized_horse_name: string
          price_text: string | null
          sex: string | null
          sire_name: string | null
          sold_status: string
          source_id: string | null
          source_payload: Json | null
          source_url: string | null
          studbook: string | null
          updated_at: string | null
          vendor_name: string | null
        }
        Insert: {
          age?: number | null
          auction_id: string
          birth_year?: number | null
          breeder_name?: string | null
          buyer_country?: string | null
          buyer_name?: string | null
          color?: string | null
          confidence_score?: number | null
          created_at?: string | null
          currency?: string
          dam_name?: string | null
          dam_sire_name?: string | null
          discipline?: string
          hammer_price?: number | null
          horse_name: string
          id?: string
          lot_number?: string | null
          normalized_horse_name: string
          price_text?: string | null
          sex?: string | null
          sire_name?: string | null
          sold_status?: string
          source_id?: string | null
          source_payload?: Json | null
          source_url?: string | null
          studbook?: string | null
          updated_at?: string | null
          vendor_name?: string | null
        }
        Update: {
          age?: number | null
          auction_id?: string
          birth_year?: number | null
          breeder_name?: string | null
          buyer_country?: string | null
          buyer_name?: string | null
          color?: string | null
          confidence_score?: number | null
          created_at?: string | null
          currency?: string
          dam_name?: string | null
          dam_sire_name?: string | null
          discipline?: string
          hammer_price?: number | null
          horse_name?: string
          id?: string
          lot_number?: string | null
          normalized_horse_name?: string
          price_text?: string | null
          sex?: string | null
          sire_name?: string | null
          sold_status?: string
          source_id?: string | null
          source_payload?: Json | null
          source_url?: string | null
          studbook?: string | null
          updated_at?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'global_auction_lots_auction_id_fkey'
            columns: ['auction_id']
            isOneToOne: false
            referencedRelation: 'global_auctions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'global_auction_lots_source_id_fkey'
            columns: ['source_id']
            isOneToOne: false
            referencedRelation: 'global_auction_sources'
            referencedColumns: ['id']
          },
        ]
      }
      global_auction_source_snapshots: {
        Row: {
          captured_at: string | null
          checksum: string
          content_type: string | null
          id: string
          import_run_id: string | null
          metadata: Json | null
          source_id: string | null
          source_url: string
        }
        Insert: {
          captured_at?: string | null
          checksum: string
          content_type?: string | null
          id?: string
          import_run_id?: string | null
          metadata?: Json | null
          source_id?: string | null
          source_url: string
        }
        Update: {
          captured_at?: string | null
          checksum?: string
          content_type?: string | null
          id?: string
          import_run_id?: string | null
          metadata?: Json | null
          source_id?: string | null
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: 'global_auction_source_snapshots_import_run_id_fkey'
            columns: ['import_run_id']
            isOneToOne: false
            referencedRelation: 'global_auction_import_runs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'global_auction_source_snapshots_source_id_fkey'
            columns: ['source_id']
            isOneToOne: false
            referencedRelation: 'global_auction_sources'
            referencedColumns: ['id']
          },
        ]
      }
      global_auction_sources: {
        Row: {
          access_level: string
          country: string | null
          created_at: string | null
          discipline_scope: string
          id: string
          name: string
          notes: string | null
          results_url: string | null
          scrape_strategy: string
          source_type: string
          status: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          access_level?: string
          country?: string | null
          created_at?: string | null
          discipline_scope?: string
          id?: string
          name: string
          notes?: string | null
          results_url?: string | null
          scrape_strategy?: string
          source_type?: string
          status?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          access_level?: string
          country?: string | null
          created_at?: string | null
          discipline_scope?: string
          id?: string
          name?: string
          notes?: string | null
          results_url?: string | null
          scrape_strategy?: string
          source_type?: string
          status?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      global_auctions: {
        Row: {
          auction_date: string | null
          auction_year: number | null
          category: string | null
          country: string | null
          created_at: string | null
          discipline: string
          house_id: string | null
          id: string
          location: string | null
          name: string
          normalized_name: string
          source_id: string | null
          source_payload: Json | null
          source_url: string | null
          updated_at: string | null
        }
        Insert: {
          auction_date?: string | null
          auction_year?: number | null
          category?: string | null
          country?: string | null
          created_at?: string | null
          discipline?: string
          house_id?: string | null
          id?: string
          location?: string | null
          name: string
          normalized_name: string
          source_id?: string | null
          source_payload?: Json | null
          source_url?: string | null
          updated_at?: string | null
        }
        Update: {
          auction_date?: string | null
          auction_year?: number | null
          category?: string | null
          country?: string | null
          created_at?: string | null
          discipline?: string
          house_id?: string | null
          id?: string
          location?: string | null
          name?: string
          normalized_name?: string
          source_id?: string | null
          source_payload?: Json | null
          source_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'global_auctions_house_id_fkey'
            columns: ['house_id']
            isOneToOne: false
            referencedRelation: 'global_auction_houses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'global_auctions_source_id_fkey'
            columns: ['source_id']
            isOneToOne: false
            referencedRelation: 'global_auction_sources'
            referencedColumns: ['id']
          },
        ]
      }
      message_events: {
        Row: {
          campaign_id: string | null
          contact_id: string | null
          created_at: string | null
          event_type: string
          id: string
          outbound_message_id: string | null
          payload: Json | null
          provider: string
        }
        Insert: {
          campaign_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          outbound_message_id?: string | null
          payload?: Json | null
          provider: string
        }
        Update: {
          campaign_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          outbound_message_id?: string | null
          payload?: Json | null
          provider?: string
        }
        Relationships: [
          {
            foreignKeyName: 'message_events_campaign_id_fkey'
            columns: ['campaign_id']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'message_events_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contact_segmentation_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'message_events_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'message_events_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'customer_rfmv_extended_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'message_events_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'customer_rfmv_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'message_events_outbound_message_id_fkey'
            columns: ['outbound_message_id']
            isOneToOne: false
            referencedRelation: 'outbound_messages'
            referencedColumns: ['id']
          },
        ]
      }
      message_templates: {
        Row: {
          body: string
          category: string
          created_at: string | null
          id: string
          subject: string | null
          title: string
          type: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          body: string
          category: string
          created_at?: string | null
          id?: string
          subject?: string | null
          title: string
          type: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          body?: string
          category?: string
          created_at?: string | null
          id?: string
          subject?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      outbound_messages: {
        Row: {
          body: string
          campaign_id: string | null
          campaign_recipient_id: string | null
          campaign_send_id: string | null
          channel: string
          contact_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          provider: string
          provider_message_id: string | null
          request_payload: Json | null
          response_payload: Json | null
          sent_at: string | null
          status: string
          subject: string | null
          to_address: string
          updated_at: string | null
        }
        Insert: {
          body: string
          campaign_id?: string | null
          campaign_recipient_id?: string | null
          campaign_send_id?: string | null
          channel: string
          contact_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          provider: string
          provider_message_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          to_address: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          campaign_id?: string | null
          campaign_recipient_id?: string | null
          campaign_send_id?: string | null
          channel?: string
          contact_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          provider?: string
          provider_message_id?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          to_address?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'outbound_messages_campaign_id_fkey'
            columns: ['campaign_id']
            isOneToOne: false
            referencedRelation: 'campaigns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'outbound_messages_campaign_recipient_id_fkey'
            columns: ['campaign_recipient_id']
            isOneToOne: false
            referencedRelation: 'campaign_recipients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'outbound_messages_campaign_send_id_fkey'
            columns: ['campaign_send_id']
            isOneToOne: false
            referencedRelation: 'campaign_sends'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'outbound_messages_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contact_segmentation_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'outbound_messages_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'outbound_messages_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'customer_rfmv_extended_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'outbound_messages_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'customer_rfmv_view'
            referencedColumns: ['id']
          },
        ]
      }
      purchases: {
        Row: {
          auction_id: string | null
          contact_id: string | null
          created_at: string | null
          date: string | null
          description: string | null
          id: string
          lot_number: string | null
          payload: Json | null
          smartleiloes_event_id: string | null
          smartleiloes_id: string | null
          smartleiloes_lot_id: string | null
          value: number
        }
        Insert: {
          auction_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          lot_number?: string | null
          payload?: Json | null
          smartleiloes_event_id?: string | null
          smartleiloes_id?: string | null
          smartleiloes_lot_id?: string | null
          value?: number
        }
        Update: {
          auction_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          lot_number?: string | null
          payload?: Json | null
          smartleiloes_event_id?: string | null
          smartleiloes_id?: string | null
          smartleiloes_lot_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: 'purchases_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contact_segmentation_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'purchases_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'purchases_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'customer_rfmv_extended_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'purchases_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'customer_rfmv_view'
            referencedColumns: ['id']
          },
        ]
      }
      smartleiloes_auctions: {
        Row: {
          created_at: string | null
          event_date: string | null
          event_type: string | null
          id: string
          payload: Json | null
          smartleiloes_id: string
          source_url: string | null
          status: string | null
          title: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          created_at?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          smartleiloes_id: string
          source_url?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          smartleiloes_id?: string
          source_url?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: []
      }
      smartleiloes_lots: {
        Row: {
          auction_id: string | null
          auction_smartleiloes_id: string | null
          category: string | null
          commercial_status: string | null
          created_at: string | null
          id: string
          lot_number: string | null
          payload: Json | null
          smartleiloes_id: string
          title: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          auction_id?: string | null
          auction_smartleiloes_id?: string | null
          category?: string | null
          commercial_status?: string | null
          created_at?: string | null
          id?: string
          lot_number?: string | null
          payload?: Json | null
          smartleiloes_id: string
          title: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          auction_id?: string | null
          auction_smartleiloes_id?: string | null
          category?: string | null
          commercial_status?: string | null
          created_at?: string | null
          id?: string
          lot_number?: string | null
          payload?: Json | null
          smartleiloes_id?: string
          title?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'smartleiloes_lots_auction_id_fkey'
            columns: ['auction_id']
            isOneToOne: false
            referencedRelation: 'smartleiloes_auctions'
            referencedColumns: ['id']
          },
        ]
      }
      smartleiloes_raw_records: {
        Row: {
          amount: number | null
          created_at: string | null
          external_id: string
          id: string
          payload: Json
          record_date: string | null
          record_type: string
          related_client_id: string | null
          related_event_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          external_id: string
          id?: string
          payload?: Json
          record_date?: string | null
          record_type: string
          related_client_id?: string | null
          related_event_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          external_id?: string
          id?: string
          payload?: Json
          record_date?: string | null
          record_type?: string
          related_client_id?: string | null
          related_event_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      smartleiloes_sync_runs: {
        Row: {
          created_at: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          started_at: string | null
          status: string
          summary: Json | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          summary?: Json | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          summary?: Json | null
        }
        Relationships: []
      }
      studbook_horses: {
        Row: {
          abcch_breeder_token: string | null
          abcch_detail_error: string | null
          abcch_detail_sync_status: string | null
          abcch_detail_synced_at: string | null
          abcch_owner_token: string | null
          abcch_token: string | null
          birth_date: string | null
          birth_year: number | null
          birthplace: string | null
          breed: string | null
          breeder_id: string | null
          coat: string | null
          created_at: string | null
          dam_name: string | null
          data_quality_score: number | null
          dna: string | null
          id: string
          import_batch_id: string | null
          last_synced_at: string | null
          microchip: string | null
          name: string
          normalized_name: string
          original_registration: string | null
          owner_id: string | null
          registration: string | null
          sex: string | null
          sire_name: string | null
          source: string | null
          source_checksum: string | null
          source_payload: Json | null
          source_url: string | null
          status: string | null
          ueln: string | null
          updated_at: string | null
        }
        Insert: {
          abcch_breeder_token?: string | null
          abcch_detail_error?: string | null
          abcch_detail_sync_status?: string | null
          abcch_detail_synced_at?: string | null
          abcch_owner_token?: string | null
          abcch_token?: string | null
          birth_date?: string | null
          birth_year?: number | null
          birthplace?: string | null
          breed?: string | null
          breeder_id?: string | null
          coat?: string | null
          created_at?: string | null
          dam_name?: string | null
          data_quality_score?: number | null
          dna?: string | null
          id?: string
          import_batch_id?: string | null
          last_synced_at?: string | null
          microchip?: string | null
          name: string
          normalized_name: string
          original_registration?: string | null
          owner_id?: string | null
          registration?: string | null
          sex?: string | null
          sire_name?: string | null
          source?: string | null
          source_checksum?: string | null
          source_payload?: Json | null
          source_url?: string | null
          status?: string | null
          ueln?: string | null
          updated_at?: string | null
        }
        Update: {
          abcch_breeder_token?: string | null
          abcch_detail_error?: string | null
          abcch_detail_sync_status?: string | null
          abcch_detail_synced_at?: string | null
          abcch_owner_token?: string | null
          abcch_token?: string | null
          birth_date?: string | null
          birth_year?: number | null
          birthplace?: string | null
          breed?: string | null
          breeder_id?: string | null
          coat?: string | null
          created_at?: string | null
          dam_name?: string | null
          data_quality_score?: number | null
          dna?: string | null
          id?: string
          import_batch_id?: string | null
          last_synced_at?: string | null
          microchip?: string | null
          name?: string
          normalized_name?: string
          original_registration?: string | null
          owner_id?: string | null
          registration?: string | null
          sex?: string | null
          sire_name?: string | null
          source?: string | null
          source_checksum?: string | null
          source_payload?: Json | null
          source_url?: string | null
          status?: string | null
          ueln?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'studbook_horses_breeder_id_fkey'
            columns: ['breeder_id']
            isOneToOne: false
            referencedRelation: 'studbook_people_orgs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'studbook_horses_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'studbook_people_orgs'
            referencedColumns: ['id']
          },
        ]
      }
      studbook_import_runs: {
        Row: {
          errors: Json | null
          finished_at: string | null
          id: string
          inserted_or_updated_horses: number | null
          inserted_or_updated_people: number | null
          notes: string | null
          search_terms: Json | null
          source: string
          started_at: string | null
          status: string
          total_source_rows: number | null
          unique_tokens: number | null
        }
        Insert: {
          errors?: Json | null
          finished_at?: string | null
          id?: string
          inserted_or_updated_horses?: number | null
          inserted_or_updated_people?: number | null
          notes?: string | null
          search_terms?: Json | null
          source?: string
          started_at?: string | null
          status?: string
          total_source_rows?: number | null
          unique_tokens?: number | null
        }
        Update: {
          errors?: Json | null
          finished_at?: string | null
          id?: string
          inserted_or_updated_horses?: number | null
          inserted_or_updated_people?: number | null
          notes?: string | null
          search_terms?: Json | null
          source?: string
          started_at?: string | null
          status?: string
          total_source_rows?: number | null
          unique_tokens?: number | null
        }
        Relationships: []
      }
      studbook_offspring: {
        Row: {
          child_birth_date: string | null
          child_id: string | null
          child_name: string
          child_registration: string | null
          child_sex: string | null
          created_at: string | null
          id: string
          parent_id: string
          source: string | null
          source_payload: Json | null
        }
        Insert: {
          child_birth_date?: string | null
          child_id?: string | null
          child_name: string
          child_registration?: string | null
          child_sex?: string | null
          created_at?: string | null
          id?: string
          parent_id: string
          source?: string | null
          source_payload?: Json | null
        }
        Update: {
          child_birth_date?: string | null
          child_id?: string | null
          child_name?: string
          child_registration?: string | null
          child_sex?: string | null
          created_at?: string | null
          id?: string
          parent_id?: string
          source?: string | null
          source_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'studbook_offspring_child_id_fkey'
            columns: ['child_id']
            isOneToOne: false
            referencedRelation: 'studbook_horses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'studbook_offspring_child_id_fkey'
            columns: ['child_id']
            isOneToOne: false
            referencedRelation: 'studbook_horses_enriched'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'studbook_offspring_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'studbook_horses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'studbook_offspring_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'studbook_horses_enriched'
            referencedColumns: ['id']
          },
        ]
      }
      studbook_pedigree_links: {
        Row: {
          created_at: string | null
          generation: number | null
          horse_id: string
          id: string
          related_horse_id: string | null
          related_name: string | null
          relation_type: string
          source: string | null
          source_payload: Json | null
        }
        Insert: {
          created_at?: string | null
          generation?: number | null
          horse_id: string
          id?: string
          related_horse_id?: string | null
          related_name?: string | null
          relation_type: string
          source?: string | null
          source_payload?: Json | null
        }
        Update: {
          created_at?: string | null
          generation?: number | null
          horse_id?: string
          id?: string
          related_horse_id?: string | null
          related_name?: string | null
          relation_type?: string
          source?: string | null
          source_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'studbook_pedigree_links_horse_id_fkey'
            columns: ['horse_id']
            isOneToOne: false
            referencedRelation: 'studbook_horses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'studbook_pedigree_links_horse_id_fkey'
            columns: ['horse_id']
            isOneToOne: false
            referencedRelation: 'studbook_horses_enriched'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'studbook_pedigree_links_related_horse_id_fkey'
            columns: ['related_horse_id']
            isOneToOne: false
            referencedRelation: 'studbook_horses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'studbook_pedigree_links_related_horse_id_fkey'
            columns: ['related_horse_id']
            isOneToOne: false
            referencedRelation: 'studbook_horses_enriched'
            referencedColumns: ['id']
          },
        ]
      }
      studbook_people_orgs: {
        Row: {
          city: string | null
          created_at: string | null
          id: string
          name: string
          normalized_name: string
          role: string
          source: string | null
          source_payload: Json | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          id?: string
          name: string
          normalized_name: string
          role?: string
          source?: string | null
          source_payload?: Json | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          id?: string
          name?: string
          normalized_name?: string
          role?: string
          source?: string | null
          source_payload?: Json | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      studio_goals: {
        Row: {
          base_text: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          subject: string | null
          title: string
          updated_at: string
        }
        Insert: {
          base_text?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          subject?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          base_text?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          subject?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          description: string | null
          due_date: string
          has_reminder: boolean | null
          id: string
          is_completed: boolean | null
          title: string
          type: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          due_date: string
          has_reminder?: boolean | null
          id?: string
          is_completed?: boolean | null
          title: string
          type?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string
          has_reminder?: boolean | null
          id?: string
          is_completed?: boolean | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contact_segmentation_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'customer_rfmv_extended_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'customer_rfmv_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_deal_id_fkey'
            columns: ['deal_id']
            isOneToOne: false
            referencedRelation: 'deals'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      contact_segmentation_view: {
        Row: {
          created_at: string | null
          distinct_auctions_bid: number | null
          email: string | null
          id: string | null
          last_bid_date: string | null
          name: string | null
          phone: string | null
          purchase_count: number | null
          segment: string | null
          total_purchase_value: number | null
        }
        Relationships: []
      }
      customer_rfmv_extended_view: {
        Row: {
          auction_count: number | null
          avg_ticket: number | null
          bid_count: number | null
          bid_value: number | null
          city: string | null
          created_at: string | null
          email: string | null
          frequency_score: number | null
          id: string | null
          last_activity_date: string | null
          last_bid_date: string | null
          last_purchase_date: string | null
          monetary_score: number | null
          monetary_value: number | null
          name: string | null
          phone: string | null
          preferences: Json | null
          purchase_count: number | null
          recency_score: number | null
          rfmv_score: number | null
          segment: string | null
          state: string | null
          tag_ids: string[] | null
          variety_score: number | null
          whatsapp: string | null
        }
        Relationships: []
      }
      customer_rfmv_view: {
        Row: {
          auction_count: number | null
          avg_ticket: number | null
          bid_count: number | null
          bid_value: number | null
          city: string | null
          created_at: string | null
          email: string | null
          frequency_score: number | null
          id: string | null
          last_activity_date: string | null
          last_bid_date: string | null
          last_purchase_date: string | null
          monetary_score: number | null
          monetary_value: number | null
          name: string | null
          phone: string | null
          purchase_count: number | null
          recency_score: number | null
          rfmv_score: number | null
          segment: string | null
          state: string | null
          variety_score: number | null
          whatsapp: string | null
        }
        Relationships: []
      }
      global_auction_house_rankings: {
        Row: {
          auctions: number | null
          average_price_eur: number | null
          country: string | null
          house_name: string | null
          latest_year: number | null
          lots: number | null
          sold_lots: number | null
          top_price_eur: number | null
          total_value_eur: number | null
        }
        Relationships: []
      }
      global_auction_market_overview: {
        Row: {
          auctions: number | null
          average_price_eur: number | null
          first_year: number | null
          latest_year: number | null
          lots: number | null
          median_price_eur: number | null
          sold_lots: number | null
          top_price_eur: number | null
          total_sold_value_eur: number | null
          unsold_or_withdrawn_lots: number | null
        }
        Relationships: []
      }
      global_auction_sire_rankings: {
        Row: {
          average_price_eur: number | null
          latest_year: number | null
          lots: number | null
          sire_name: string | null
          sold_lots: number | null
          top_price_eur: number | null
          total_value_eur: number | null
        }
        Relationships: []
      }
      studbook_breeder_rankings: {
        Row: {
          active_mare_count: number | null
          avg_quality: number | null
          connected_owner_count: number | null
          entity_id: string | null
          entity_kind: string | null
          female_count: number | null
          horse_count: number | null
          latest_birth_year: number | null
          name: string | null
          young_count: number | null
        }
        Relationships: []
      }
      studbook_dam_rankings: {
        Row: {
          active_mare_count: number | null
          avg_quality: number | null
          connected_owner_count: number | null
          entity_id: string | null
          entity_kind: string | null
          female_count: number | null
          horse_count: number | null
          latest_birth_year: number | null
          name: string | null
          young_count: number | null
        }
        Relationships: []
      }
      studbook_horses_enriched: {
        Row: {
          abcch_breeder_token: string | null
          abcch_detail_error: string | null
          abcch_detail_sync_status: string | null
          abcch_detail_synced_at: string | null
          abcch_owner_token: string | null
          abcch_token: string | null
          age_band: string | null
          age_years: number | null
          birth_date: string | null
          birth_year: number | null
          birthplace: string | null
          breed: string | null
          breeder_id: string | null
          breeder_name: string | null
          coat: string | null
          created_at: string | null
          dam_name: string | null
          data_quality_score: number | null
          dna: string | null
          id: string | null
          import_batch_id: string | null
          is_reproductive_mare: boolean | null
          last_synced_at: string | null
          microchip: string | null
          name: string | null
          normalized_name: string | null
          offspring_count: number | null
          original_registration: string | null
          owner_id: string | null
          owner_name: string | null
          registration: string | null
          sex: string | null
          sire_name: string | null
          source: string | null
          source_checksum: string | null
          source_payload: Json | null
          source_url: string | null
          status: string | null
          ueln: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'studbook_horses_breeder_id_fkey'
            columns: ['breeder_id']
            isOneToOne: false
            referencedRelation: 'studbook_people_orgs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'studbook_horses_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'studbook_people_orgs'
            referencedColumns: ['id']
          },
        ]
      }
      studbook_owner_rankings: {
        Row: {
          active_mare_count: number | null
          avg_quality: number | null
          connected_owner_count: number | null
          entity_id: string | null
          entity_kind: string | null
          female_count: number | null
          horse_count: number | null
          latest_birth_year: number | null
          name: string | null
          young_count: number | null
        }
        Relationships: []
      }
      studbook_sire_rankings: {
        Row: {
          active_mare_count: number | null
          avg_quality: number | null
          connected_owner_count: number | null
          entity_id: string | null
          entity_kind: string | null
          female_count: number | null
          horse_count: number | null
          latest_birth_year: number | null
          name: string | null
          young_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      bulk_add_tag_to_contacts: {
        Args: { p_contact_ids: string[]; p_tag_id: string }
        Returns: undefined
      }
      get_studbook_network_rankings: {
        Args: {
          p_breeder_names?: string[]
          p_dam_names?: string[]
          p_data_quality_min?: number
          p_include_unknown_age?: boolean
          p_limit?: number
          p_max_age?: number
          p_min_age?: number
          p_min_offspring?: number
          p_owner_names?: string[]
          p_rank_mode?: string
          p_recent_years?: number
          p_reproductive_only?: boolean
          p_search?: string
          p_sex?: string
          p_sire_names?: string[]
        }
        Returns: {
          active_mare_count: number
          avg_quality: number
          connected_owner_count: number
          crm_contact_count: number
          entity_id: string
          entity_kind: string
          female_count: number
          horse_count: number
          latest_birth_year: number
          name: string
          recent_horse_count: number
          total_entities: number
          young_count: number
        }[]
      }
      is_actionable_studbook_name: { Args: { value: string }; Returns: boolean }
      normalize_studbook_match_name: {
        Args: { value: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: auction_candidate_items
//   id: uuid (not null, default: uuid_generate_v4())
//   list_id: uuid (not null)
//   horse_id: uuid (not null)
//   reason: text (nullable)
//   potential_score: integer (nullable, default: 0)
//   notes: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: auction_candidate_lists
//   id: uuid (not null, default: uuid_generate_v4())
//   name: text (not null)
//   thesis: text (nullable)
//   status: text (nullable, default: 'draft'::text)
//   filters: jsonb (nullable, default: '{}'::jsonb)
//   notes: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: automation_settings
//   id: uuid (not null, default: gen_random_uuid())
//   rule_key: text (not null)
//   name: text (not null)
//   description: text (nullable)
//   is_active: boolean (nullable, default: true)
//   config: jsonb (nullable, default: '{}'::jsonb)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: bids
//   id: uuid (not null, default: uuid_generate_v4())
//   contact_id: uuid (nullable)
//   auction_id: text (nullable)
//   lot_number: text (nullable)
//   value: numeric (not null, default: 0)
//   date: date (nullable, default: CURRENT_DATE)
//   reason: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   smartleiloes_id: text (nullable)
//   smartleiloes_lot_id: text (nullable)
//   smartleiloes_event_id: text (nullable)
//   payload: jsonb (nullable, default: '{}'::jsonb)
// Table: campaign_recipients
//   id: uuid (not null, default: gen_random_uuid())
//   campaign_id: uuid (nullable)
//   contact_id: uuid (nullable)
//   channel: text (not null)
//   status: text (not null, default: 'queued'::text)
//   score: integer (nullable, default: 0)
//   segment: text (nullable)
//   email: text (nullable)
//   phone: text (nullable)
//   subject: text (nullable)
//   message: text (not null)
//   metadata: jsonb (nullable, default: '{}'::jsonb)
//   opted_out_at: timestamp with time zone (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: campaign_schedules
//   id: uuid (not null, default: gen_random_uuid())
//   campaign_id: uuid (nullable)
//   channel_type: text (not null)
//   scheduled_date: timestamp with time zone (not null, default: now())
//   template_id: uuid (nullable)
//   subject: text (nullable)
//   content: text (nullable)
//   status: text (not null, default: 'Pendente'::text)
//   processed_at: timestamp with time zone (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: campaign_sends
//   id: uuid (not null, default: gen_random_uuid())
//   campaign_id: uuid (nullable)
//   schedule_id: uuid (nullable)
//   recipient_id: uuid (nullable)
//   campaign_recipient_id: uuid (nullable)
//   channel: text (not null)
//   status: text (not null, default: 'pending'::text)
//   provider_id: text (nullable)
//   subject: text (nullable)
//   content: text (nullable)
//   metadata: jsonb (nullable, default: '{}'::jsonb)
//   error_message: text (nullable)
//   sent_at: timestamp with time zone (nullable)
//   delivered_at: timestamp with time zone (nullable)
//   opened_at: timestamp with time zone (nullable)
//   clicked_at: timestamp with time zone (nullable)
//   interacted_at: timestamp with time zone (nullable)
//   failed_at: timestamp with time zone (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: campaigns
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (not null)
//   description: text (nullable)
//   start_date: date (not null, default: CURRENT_DATE)
//   end_date: date (not null, default: CURRENT_DATE)
//   status: text (not null, default: 'Rascunho'::text)
//   audience_filters: jsonb (nullable, default: '{}'::jsonb)
//   channels: _text (nullable, default: '{}'::text[])
//   metadata: jsonb (nullable, default: '{}'::jsonb)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: companies
//   id: uuid (not null, default: uuid_generate_v4())
//   name: text (not null)
//   email: text (nullable)
//   phone: text (nullable)
//   website: text (nullable)
//   address: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: contact_interactions
//   id: uuid (not null, default: uuid_generate_v4())
//   contact_id: uuid (nullable)
//   type: text (not null)
//   description: text (nullable)
//   date: timestamp with time zone (nullable, default: now())
//   created_by: uuid (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   deal_id: uuid (nullable)
//   status: text (nullable, default: 'sent'::text)
//   metadata: jsonb (nullable, default: '{}'::jsonb)
// Table: contact_segmentation_view
//   id: uuid (nullable)
//   name: text (nullable)
//   email: text (nullable)
//   phone: text (nullable)
//   created_at: timestamp with time zone (nullable)
//   purchase_count: bigint (nullable)
//   total_purchase_value: numeric (nullable)
//   distinct_auctions_bid: bigint (nullable)
//   last_bid_date: date (nullable)
//   segment: text (nullable)
// Table: contact_tags
//   contact_id: uuid (not null)
//   tag_id: uuid (not null)
// Table: contacts
//   id: uuid (not null, default: uuid_generate_v4())
//   name: text (not null)
//   email: text (not null)
//   phone: text (not null)
//   whatsapp: text (nullable)
//   birth_date: date (nullable)
//   cpf: text (nullable)
//   address: text (nullable)
//   preferences: jsonb (nullable, default: '{}'::jsonb)
//   origin: text (nullable)
//   notes: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
//   smartleiloes_id: text (nullable)
//   document: text (nullable)
//   city: text (nullable)
//   state: text (nullable)
//   source_payload: jsonb (nullable, default: '{}'::jsonb)
// Table: customer_rfmv_extended_view
//   id: uuid (nullable)
//   name: text (nullable)
//   email: text (nullable)
//   phone: text (nullable)
//   whatsapp: text (nullable)
//   city: text (nullable)
//   state: text (nullable)
//   created_at: timestamp with time zone (nullable)
//   purchase_count: integer (nullable)
//   monetary_value: numeric (nullable)
//   avg_ticket: numeric (nullable)
//   last_purchase_date: date (nullable)
//   bid_count: integer (nullable)
//   auction_count: integer (nullable)
//   bid_value: numeric (nullable)
//   last_bid_date: date (nullable)
//   last_activity_date: date (nullable)
//   recency_score: integer (nullable)
//   frequency_score: integer (nullable)
//   monetary_score: integer (nullable)
//   variety_score: integer (nullable)
//   rfmv_score: integer (nullable)
//   segment: text (nullable)
//   preferences: jsonb (nullable)
//   tag_ids: _uuid (nullable)
// Table: customer_rfmv_view
//   id: uuid (nullable)
//   name: text (nullable)
//   email: text (nullable)
//   phone: text (nullable)
//   whatsapp: text (nullable)
//   city: text (nullable)
//   state: text (nullable)
//   created_at: timestamp with time zone (nullable)
//   purchase_count: integer (nullable)
//   monetary_value: numeric (nullable)
//   avg_ticket: numeric (nullable)
//   last_purchase_date: date (nullable)
//   bid_count: integer (nullable)
//   auction_count: integer (nullable)
//   bid_value: numeric (nullable)
//   last_bid_date: date (nullable)
//   last_activity_date: date (nullable)
//   recency_score: integer (nullable)
//   frequency_score: integer (nullable)
//   monetary_score: integer (nullable)
//   variety_score: integer (nullable)
//   rfmv_score: integer (nullable)
//   segment: text (nullable)
// Table: deal_tasks
//   id: uuid (not null, default: gen_random_uuid())
//   deal_id: uuid (not null)
//   description: text (not null)
//   is_completed: boolean (nullable, default: false)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: deals
//   id: uuid (not null, default: uuid_generate_v4())
//   contact_id: uuid (nullable)
//   title: text (not null)
//   stage: text (not null)
//   value: numeric (not null, default: 0)
//   probability: numeric (nullable, default: 0)
//   expected_close_date: timestamp with time zone (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
//   notes: text (nullable)
// Table: global_auction_house_rankings
//   house_name: text (nullable)
//   country: text (nullable)
//   auctions: integer (nullable)
//   lots: integer (nullable)
//   sold_lots: integer (nullable)
//   total_value_eur: numeric (nullable)
//   average_price_eur: numeric (nullable)
//   top_price_eur: numeric (nullable)
//   latest_year: integer (nullable)
// Table: global_auction_houses
//   id: uuid (not null, default: uuid_generate_v4())
//   source_id: uuid (nullable)
//   name: text (not null)
//   normalized_name: text (not null)
//   country: text (nullable)
//   website_url: text (nullable)
//   notes: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: global_auction_import_runs
//   id: uuid (not null, default: uuid_generate_v4())
//   source_id: uuid (nullable)
//   status: text (not null, default: 'running'::text)
//   started_at: timestamp with time zone (nullable, default: now())
//   finished_at: timestamp with time zone (nullable)
//   source_url: text (nullable)
//   rows_seen: integer (nullable, default: 0)
//   rows_imported: integer (nullable, default: 0)
//   rows_skipped: integer (nullable, default: 0)
//   error_message: text (nullable)
//   metadata: jsonb (nullable, default: '{}'::jsonb)
// Table: global_auction_lots
//   id: uuid (not null, default: uuid_generate_v4())
//   auction_id: uuid (not null)
//   source_id: uuid (nullable)
//   lot_number: text (nullable)
//   horse_name: text (not null)
//   normalized_horse_name: text (not null)
//   birth_year: integer (nullable)
//   age: integer (nullable)
//   sex: text (nullable)
//   color: text (nullable)
//   studbook: text (nullable)
//   sire_name: text (nullable)
//   dam_name: text (nullable)
//   dam_sire_name: text (nullable)
//   vendor_name: text (nullable)
//   breeder_name: text (nullable)
//   buyer_name: text (nullable)
//   buyer_country: text (nullable)
//   sold_status: text (not null, default: 'sold'::text)
//   hammer_price: numeric (nullable)
//   currency: text (not null, default: 'EUR'::text)
//   price_text: text (nullable)
//   discipline: text (not null, default: 'show_jumping'::text)
//   source_url: text (nullable)
//   source_payload: jsonb (nullable, default: '{}'::jsonb)
//   confidence_score: integer (nullable, default: 70)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: global_auction_market_overview
//   auctions: integer (nullable)
//   lots: integer (nullable)
//   sold_lots: integer (nullable)
//   unsold_or_withdrawn_lots: integer (nullable)
//   total_sold_value_eur: numeric (nullable)
//   average_price_eur: numeric (nullable)
//   median_price_eur: numeric (nullable)
//   top_price_eur: numeric (nullable)
//   first_year: integer (nullable)
//   latest_year: integer (nullable)
// Table: global_auction_sire_rankings
//   sire_name: text (nullable)
//   lots: integer (nullable)
//   sold_lots: integer (nullable)
//   total_value_eur: numeric (nullable)
//   average_price_eur: numeric (nullable)
//   top_price_eur: numeric (nullable)
//   latest_year: integer (nullable)
// Table: global_auction_source_snapshots
//   id: uuid (not null, default: uuid_generate_v4())
//   source_id: uuid (nullable)
//   import_run_id: uuid (nullable)
//   source_url: text (not null)
//   content_type: text (nullable)
//   checksum: text (not null)
//   captured_at: timestamp with time zone (nullable, default: now())
//   metadata: jsonb (nullable, default: '{}'::jsonb)
// Table: global_auction_sources
//   id: uuid (not null, default: uuid_generate_v4())
//   name: text (not null)
//   source_type: text (not null, default: 'auction_house'::text)
//   country: text (nullable)
//   website_url: text (nullable)
//   results_url: text (nullable)
//   discipline_scope: text (not null, default: 'show_jumping'::text)
//   scrape_strategy: text (not null, default: 'html_table'::text)
//   access_level: text (not null, default: 'public'::text)
//   status: text (not null, default: 'active'::text)
//   notes: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: global_auctions
//   id: uuid (not null, default: uuid_generate_v4())
//   house_id: uuid (nullable)
//   source_id: uuid (nullable)
//   name: text (not null)
//   normalized_name: text (not null)
//   auction_year: integer (nullable)
//   auction_date: date (nullable)
//   location: text (nullable)
//   country: text (nullable)
//   discipline: text (not null, default: 'show_jumping'::text)
//   category: text (nullable)
//   source_url: text (nullable)
//   source_payload: jsonb (nullable, default: '{}'::jsonb)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: message_events
//   id: uuid (not null, default: gen_random_uuid())
//   outbound_message_id: uuid (nullable)
//   campaign_id: uuid (nullable)
//   contact_id: uuid (nullable)
//   provider: text (not null)
//   event_type: text (not null)
//   payload: jsonb (nullable, default: '{}'::jsonb)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: message_templates
//   id: uuid (not null, default: gen_random_uuid())
//   title: text (not null)
//   category: text (not null)
//   type: text (not null)
//   subject: text (nullable)
//   body: text (not null)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
//   variables: _text (nullable, default: '{}'::text[])
// Table: outbound_messages
//   id: uuid (not null, default: gen_random_uuid())
//   campaign_id: uuid (nullable)
//   campaign_recipient_id: uuid (nullable)
//   campaign_send_id: uuid (nullable)
//   contact_id: uuid (nullable)
//   provider: text (not null)
//   channel: text (not null)
//   to_address: text (not null)
//   subject: text (nullable)
//   body: text (not null)
//   status: text (not null, default: 'queued'::text)
//   provider_message_id: text (nullable)
//   request_payload: jsonb (nullable, default: '{}'::jsonb)
//   response_payload: jsonb (nullable, default: '{}'::jsonb)
//   error_message: text (nullable)
//   sent_at: timestamp with time zone (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: purchases
//   id: uuid (not null, default: uuid_generate_v4())
//   contact_id: uuid (nullable)
//   auction_id: text (nullable)
//   lot_number: text (nullable)
//   value: numeric (not null, default: 0)
//   date: date (nullable, default: CURRENT_DATE)
//   created_at: timestamp with time zone (nullable, default: now())
//   description: text (nullable)
//   smartleiloes_id: text (nullable)
//   smartleiloes_event_id: text (nullable)
//   smartleiloes_lot_id: text (nullable)
//   payload: jsonb (nullable, default: '{}'::jsonb)
// Table: smartleiloes_auctions
//   id: uuid (not null, default: uuid_generate_v4())
//   smartleiloes_id: text (not null)
//   title: text (not null)
//   status: text (nullable)
//   value: numeric (nullable, default: 0)
//   event_date: timestamp with time zone (nullable)
//   event_type: text (nullable)
//   source_url: text (nullable)
//   payload: jsonb (nullable, default: '{}'::jsonb)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: smartleiloes_lots
//   id: uuid (not null, default: uuid_generate_v4())
//   smartleiloes_id: text (not null)
//   auction_id: uuid (nullable)
//   auction_smartleiloes_id: text (nullable)
//   lot_number: text (nullable)
//   title: text (not null)
//   category: text (nullable)
//   commercial_status: text (nullable)
//   value: numeric (nullable, default: 0)
//   payload: jsonb (nullable, default: '{}'::jsonb)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: smartleiloes_raw_records
//   id: uuid (not null, default: uuid_generate_v4())
//   record_type: text (not null)
//   external_id: text (not null)
//   title: text (nullable)
//   amount: numeric (nullable, default: 0)
//   record_date: timestamp with time zone (nullable)
//   related_event_id: text (nullable)
//   related_client_id: text (nullable)
//   payload: jsonb (not null, default: '{}'::jsonb)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: smartleiloes_sync_runs
//   id: uuid (not null, default: uuid_generate_v4())
//   status: text (not null, default: 'running'::text)
//   started_at: timestamp with time zone (nullable, default: now())
//   finished_at: timestamp with time zone (nullable)
//   summary: jsonb (nullable, default: '{}'::jsonb)
//   error_message: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: studbook_breeder_rankings
//   entity_id: text (nullable)
//   entity_kind: text (nullable)
//   name: text (nullable)
//   horse_count: integer (nullable)
//   female_count: integer (nullable)
//   young_count: integer (nullable)
//   active_mare_count: integer (nullable)
//   connected_owner_count: integer (nullable)
//   avg_quality: numeric (nullable)
//   latest_birth_year: integer (nullable)
// Table: studbook_dam_rankings
//   entity_id: text (nullable)
//   entity_kind: text (nullable)
//   name: text (nullable)
//   horse_count: integer (nullable)
//   female_count: integer (nullable)
//   young_count: integer (nullable)
//   active_mare_count: integer (nullable)
//   connected_owner_count: integer (nullable)
//   avg_quality: numeric (nullable)
//   latest_birth_year: integer (nullable)
// Table: studbook_horses
//   id: uuid (not null, default: uuid_generate_v4())
//   name: text (not null)
//   normalized_name: text (not null)
//   registration: text (nullable)
//   microchip: text (nullable)
//   breed: text (nullable)
//   sex: text (nullable)
//   birth_date: date (nullable)
//   birth_year: integer (nullable)
//   coat: text (nullable)
//   status: text (nullable)
//   dna: text (nullable)
//   breeder_id: uuid (nullable)
//   owner_id: uuid (nullable)
//   birthplace: text (nullable)
//   source_url: text (nullable)
//   source: text (nullable, default: 'ABCCH'::text)
//   source_payload: jsonb (nullable, default: '{}'::jsonb)
//   data_quality_score: integer (nullable, default: 0)
//   last_synced_at: timestamp with time zone (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
//   abcch_token: text (nullable)
//   original_registration: text (nullable)
//   ueln: text (nullable)
//   sire_name: text (nullable)
//   dam_name: text (nullable)
//   abcch_owner_token: text (nullable)
//   abcch_breeder_token: text (nullable)
//   import_batch_id: uuid (nullable)
//   source_checksum: text (nullable)
//   abcch_detail_synced_at: timestamp with time zone (nullable)
//   abcch_detail_sync_status: text (nullable)
//   abcch_detail_error: text (nullable)
// Table: studbook_horses_enriched
//   id: uuid (nullable)
//   name: text (nullable)
//   normalized_name: text (nullable)
//   registration: text (nullable)
//   microchip: text (nullable)
//   breed: text (nullable)
//   sex: text (nullable)
//   birth_date: date (nullable)
//   birth_year: integer (nullable)
//   coat: text (nullable)
//   status: text (nullable)
//   dna: text (nullable)
//   breeder_id: uuid (nullable)
//   owner_id: uuid (nullable)
//   birthplace: text (nullable)
//   source_url: text (nullable)
//   source: text (nullable)
//   source_payload: jsonb (nullable)
//   data_quality_score: integer (nullable)
//   last_synced_at: timestamp with time zone (nullable)
//   created_at: timestamp with time zone (nullable)
//   updated_at: timestamp with time zone (nullable)
//   abcch_token: text (nullable)
//   original_registration: text (nullable)
//   ueln: text (nullable)
//   sire_name: text (nullable)
//   dam_name: text (nullable)
//   abcch_owner_token: text (nullable)
//   abcch_breeder_token: text (nullable)
//   import_batch_id: uuid (nullable)
//   source_checksum: text (nullable)
//   abcch_detail_synced_at: timestamp with time zone (nullable)
//   abcch_detail_sync_status: text (nullable)
//   abcch_detail_error: text (nullable)
//   breeder_name: text (nullable)
//   owner_name: text (nullable)
//   age_years: integer (nullable)
//   age_band: text (nullable)
//   is_reproductive_mare: boolean (nullable)
//   offspring_count: integer (nullable)
// Table: studbook_import_runs
//   id: uuid (not null, default: uuid_generate_v4())
//   source: text (not null, default: 'ABCCH'::text)
//   status: text (not null, default: 'running'::text)
//   started_at: timestamp with time zone (nullable, default: now())
//   finished_at: timestamp with time zone (nullable)
//   search_terms: jsonb (nullable, default: '[]'::jsonb)
//   total_source_rows: integer (nullable, default: 0)
//   unique_tokens: integer (nullable, default: 0)
//   inserted_or_updated_horses: integer (nullable, default: 0)
//   inserted_or_updated_people: integer (nullable, default: 0)
//   errors: jsonb (nullable, default: '[]'::jsonb)
//   notes: text (nullable)
// Table: studbook_offspring
//   id: uuid (not null, default: uuid_generate_v4())
//   parent_id: uuid (not null)
//   child_id: uuid (nullable)
//   child_name: text (not null)
//   child_registration: text (nullable)
//   child_birth_date: date (nullable)
//   child_sex: text (nullable)
//   source: text (nullable, default: 'ABCCH'::text)
//   source_payload: jsonb (nullable, default: '{}'::jsonb)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: studbook_owner_rankings
//   entity_id: text (nullable)
//   entity_kind: text (nullable)
//   name: text (nullable)
//   horse_count: integer (nullable)
//   female_count: integer (nullable)
//   young_count: integer (nullable)
//   active_mare_count: integer (nullable)
//   connected_owner_count: integer (nullable)
//   avg_quality: numeric (nullable)
//   latest_birth_year: integer (nullable)
// Table: studbook_pedigree_links
//   id: uuid (not null, default: uuid_generate_v4())
//   horse_id: uuid (not null)
//   relation_type: text (not null)
//   related_horse_id: uuid (nullable)
//   related_name: text (nullable)
//   generation: integer (nullable, default: 1)
//   source: text (nullable, default: 'ABCCH'::text)
//   source_payload: jsonb (nullable, default: '{}'::jsonb)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: studbook_people_orgs
//   id: uuid (not null, default: uuid_generate_v4())
//   name: text (not null)
//   normalized_name: text (not null)
//   role: text (not null, default: 'unknown'::text)
//   city: text (nullable)
//   state: text (nullable)
//   source: text (nullable, default: 'ABCCH'::text)
//   source_payload: jsonb (nullable, default: '{}'::jsonb)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: studbook_sire_rankings
//   entity_id: text (nullable)
//   entity_kind: text (nullable)
//   name: text (nullable)
//   horse_count: integer (nullable)
//   female_count: integer (nullable)
//   young_count: integer (nullable)
//   active_mare_count: integer (nullable)
//   connected_owner_count: integer (nullable)
//   avg_quality: numeric (nullable)
//   latest_birth_year: integer (nullable)
// Table: studio_goals
//   id: uuid (not null, default: gen_random_uuid())
//   title: text (not null)
//   category: text (not null)
//   subject: text (nullable)
//   description: text (nullable)
//   base_text: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: tags
//   id: uuid (not null, default: uuid_generate_v4())
//   name: text (not null)
//   color: text (nullable, default: 'bg-primary text-primary-foreground'::text)
// Table: tasks
//   id: uuid (not null, default: gen_random_uuid())
//   title: text (not null)
//   description: text (nullable)
//   type: text (nullable)
//   contact_id: uuid (nullable)
//   deal_id: uuid (nullable)
//   due_date: timestamp with time zone (not null)
//   is_completed: boolean (nullable, default: false)
//   has_reminder: boolean (nullable, default: false)
//   created_at: timestamp with time zone (nullable, default: now())

// --- CONSTRAINTS ---
// Table: auction_candidate_items
//   FOREIGN KEY auction_candidate_items_horse_id_fkey: FOREIGN KEY (horse_id) REFERENCES studbook_horses(id) ON DELETE CASCADE
//   FOREIGN KEY auction_candidate_items_list_id_fkey: FOREIGN KEY (list_id) REFERENCES auction_candidate_lists(id) ON DELETE CASCADE
//   UNIQUE auction_candidate_items_list_id_horse_id_key: UNIQUE (list_id, horse_id)
//   PRIMARY KEY auction_candidate_items_pkey: PRIMARY KEY (id)
// Table: auction_candidate_lists
//   PRIMARY KEY auction_candidate_lists_pkey: PRIMARY KEY (id)
// Table: automation_settings
//   PRIMARY KEY automation_settings_pkey: PRIMARY KEY (id)
//   UNIQUE automation_settings_rule_key_key: UNIQUE (rule_key)
// Table: bids
//   FOREIGN KEY bids_contact_id_fkey: FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
//   PRIMARY KEY bids_pkey: PRIMARY KEY (id)
// Table: campaign_recipients
//   UNIQUE campaign_recipients_campaign_id_contact_id_channel_key: UNIQUE (campaign_id, contact_id, channel)
//   FOREIGN KEY campaign_recipients_campaign_id_fkey: FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
//   CHECK campaign_recipients_channel_check: CHECK ((channel = ANY (ARRAY['email'::text, 'whatsapp'::text])))
//   FOREIGN KEY campaign_recipients_contact_id_fkey: FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
//   PRIMARY KEY campaign_recipients_pkey: PRIMARY KEY (id)
// Table: campaign_schedules
//   FOREIGN KEY campaign_schedules_campaign_id_fkey: FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
//   CHECK campaign_schedules_channel_type_check: CHECK ((channel_type = ANY (ARRAY['email'::text, 'whatsapp'::text])))
//   PRIMARY KEY campaign_schedules_pkey: PRIMARY KEY (id)
//   FOREIGN KEY campaign_schedules_template_id_fkey: FOREIGN KEY (template_id) REFERENCES message_templates(id) ON DELETE SET NULL
// Table: campaign_sends
//   FOREIGN KEY campaign_sends_campaign_id_fkey: FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
//   FOREIGN KEY campaign_sends_campaign_recipient_id_fkey: FOREIGN KEY (campaign_recipient_id) REFERENCES campaign_recipients(id) ON DELETE SET NULL
//   CHECK campaign_sends_channel_check: CHECK ((channel = ANY (ARRAY['email'::text, 'whatsapp'::text])))
//   PRIMARY KEY campaign_sends_pkey: PRIMARY KEY (id)
//   FOREIGN KEY campaign_sends_recipient_id_fkey: FOREIGN KEY (recipient_id) REFERENCES contacts(id) ON DELETE SET NULL
//   FOREIGN KEY campaign_sends_schedule_id_fkey: FOREIGN KEY (schedule_id) REFERENCES campaign_schedules(id) ON DELETE SET NULL
// Table: campaigns
//   PRIMARY KEY campaigns_pkey: PRIMARY KEY (id)
// Table: companies
//   PRIMARY KEY companies_pkey: PRIMARY KEY (id)
// Table: contact_interactions
//   FOREIGN KEY contact_interactions_contact_id_fkey: FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
//   FOREIGN KEY contact_interactions_deal_id_fkey: FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL
//   PRIMARY KEY contact_interactions_pkey: PRIMARY KEY (id)
// Table: contact_tags
//   FOREIGN KEY contact_tags_contact_id_fkey: FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
//   PRIMARY KEY contact_tags_pkey: PRIMARY KEY (contact_id, tag_id)
//   FOREIGN KEY contact_tags_tag_id_fkey: FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
// Table: contacts
//   PRIMARY KEY contacts_pkey: PRIMARY KEY (id)
// Table: deal_tasks
//   FOREIGN KEY deal_tasks_deal_id_fkey: FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
//   PRIMARY KEY deal_tasks_pkey: PRIMARY KEY (id)
// Table: deals
//   FOREIGN KEY deals_contact_id_fkey: FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
//   PRIMARY KEY deals_pkey: PRIMARY KEY (id)
// Table: global_auction_houses
//   UNIQUE global_auction_houses_normalized_name_key: UNIQUE (normalized_name)
//   PRIMARY KEY global_auction_houses_pkey: PRIMARY KEY (id)
//   FOREIGN KEY global_auction_houses_source_id_fkey: FOREIGN KEY (source_id) REFERENCES global_auction_sources(id) ON DELETE SET NULL
// Table: global_auction_import_runs
//   PRIMARY KEY global_auction_import_runs_pkey: PRIMARY KEY (id)
//   FOREIGN KEY global_auction_import_runs_source_id_fkey: FOREIGN KEY (source_id) REFERENCES global_auction_sources(id) ON DELETE SET NULL
// Table: global_auction_lots
//   FOREIGN KEY global_auction_lots_auction_id_fkey: FOREIGN KEY (auction_id) REFERENCES global_auctions(id) ON DELETE CASCADE
//   UNIQUE global_auction_lots_auction_id_lot_number_normalized_horse__key: UNIQUE (auction_id, lot_number, normalized_horse_name)
//   PRIMARY KEY global_auction_lots_pkey: PRIMARY KEY (id)
//   FOREIGN KEY global_auction_lots_source_id_fkey: FOREIGN KEY (source_id) REFERENCES global_auction_sources(id) ON DELETE SET NULL
// Table: global_auction_source_snapshots
//   FOREIGN KEY global_auction_source_snapshots_import_run_id_fkey: FOREIGN KEY (import_run_id) REFERENCES global_auction_import_runs(id) ON DELETE SET NULL
//   PRIMARY KEY global_auction_source_snapshots_pkey: PRIMARY KEY (id)
//   FOREIGN KEY global_auction_source_snapshots_source_id_fkey: FOREIGN KEY (source_id) REFERENCES global_auction_sources(id) ON DELETE SET NULL
//   UNIQUE global_auction_source_snapshots_source_url_checksum_key: UNIQUE (source_url, checksum)
// Table: global_auction_sources
//   UNIQUE global_auction_sources_name_key: UNIQUE (name)
//   PRIMARY KEY global_auction_sources_pkey: PRIMARY KEY (id)
// Table: global_auctions
//   FOREIGN KEY global_auctions_house_id_fkey: FOREIGN KEY (house_id) REFERENCES global_auction_houses(id) ON DELETE SET NULL
//   PRIMARY KEY global_auctions_pkey: PRIMARY KEY (id)
//   FOREIGN KEY global_auctions_source_id_fkey: FOREIGN KEY (source_id) REFERENCES global_auction_sources(id) ON DELETE SET NULL
//   UNIQUE global_auctions_source_id_normalized_name_auction_year_key: UNIQUE (source_id, normalized_name, auction_year)
// Table: message_events
//   FOREIGN KEY message_events_campaign_id_fkey: FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
//   FOREIGN KEY message_events_contact_id_fkey: FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
//   FOREIGN KEY message_events_outbound_message_id_fkey: FOREIGN KEY (outbound_message_id) REFERENCES outbound_messages(id) ON DELETE CASCADE
//   PRIMARY KEY message_events_pkey: PRIMARY KEY (id)
// Table: message_templates
//   PRIMARY KEY message_templates_pkey: PRIMARY KEY (id)
//   CHECK message_templates_type_check: CHECK ((type = ANY (ARRAY['WhatsApp'::text, 'E-mail'::text])))
// Table: outbound_messages
//   FOREIGN KEY outbound_messages_campaign_id_fkey: FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
//   FOREIGN KEY outbound_messages_campaign_recipient_id_fkey: FOREIGN KEY (campaign_recipient_id) REFERENCES campaign_recipients(id) ON DELETE SET NULL
//   FOREIGN KEY outbound_messages_campaign_send_id_fkey: FOREIGN KEY (campaign_send_id) REFERENCES campaign_sends(id) ON DELETE SET NULL
//   CHECK outbound_messages_channel_check: CHECK ((channel = ANY (ARRAY['email'::text, 'whatsapp'::text])))
//   FOREIGN KEY outbound_messages_contact_id_fkey: FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
//   PRIMARY KEY outbound_messages_pkey: PRIMARY KEY (id)
//   CHECK outbound_messages_provider_check: CHECK ((provider = ANY (ARRAY['resend'::text, 'botconversa'::text])))
// Table: purchases
//   FOREIGN KEY purchases_contact_id_fkey: FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
//   PRIMARY KEY purchases_pkey: PRIMARY KEY (id)
// Table: smartleiloes_auctions
//   PRIMARY KEY smartleiloes_auctions_pkey: PRIMARY KEY (id)
//   UNIQUE smartleiloes_auctions_smartleiloes_id_key: UNIQUE (smartleiloes_id)
// Table: smartleiloes_lots
//   FOREIGN KEY smartleiloes_lots_auction_id_fkey: FOREIGN KEY (auction_id) REFERENCES smartleiloes_auctions(id) ON DELETE SET NULL
//   PRIMARY KEY smartleiloes_lots_pkey: PRIMARY KEY (id)
//   UNIQUE smartleiloes_lots_smartleiloes_id_key: UNIQUE (smartleiloes_id)
// Table: smartleiloes_raw_records
//   PRIMARY KEY smartleiloes_raw_records_pkey: PRIMARY KEY (id)
//   UNIQUE smartleiloes_raw_records_record_type_external_id_key: UNIQUE (record_type, external_id)
// Table: smartleiloes_sync_runs
//   PRIMARY KEY smartleiloes_sync_runs_pkey: PRIMARY KEY (id)
// Table: studbook_horses
//   FOREIGN KEY studbook_horses_breeder_id_fkey: FOREIGN KEY (breeder_id) REFERENCES studbook_people_orgs(id) ON DELETE SET NULL
//   FOREIGN KEY studbook_horses_owner_id_fkey: FOREIGN KEY (owner_id) REFERENCES studbook_people_orgs(id) ON DELETE SET NULL
//   PRIMARY KEY studbook_horses_pkey: PRIMARY KEY (id)
// Table: studbook_import_runs
//   PRIMARY KEY studbook_import_runs_pkey: PRIMARY KEY (id)
// Table: studbook_offspring
//   FOREIGN KEY studbook_offspring_child_id_fkey: FOREIGN KEY (child_id) REFERENCES studbook_horses(id) ON DELETE SET NULL
//   UNIQUE studbook_offspring_parent_id_child_registration_child_name_key: UNIQUE (parent_id, child_registration, child_name)
//   FOREIGN KEY studbook_offspring_parent_id_fkey: FOREIGN KEY (parent_id) REFERENCES studbook_horses(id) ON DELETE CASCADE
//   PRIMARY KEY studbook_offspring_pkey: PRIMARY KEY (id)
// Table: studbook_pedigree_links
//   FOREIGN KEY studbook_pedigree_links_horse_id_fkey: FOREIGN KEY (horse_id) REFERENCES studbook_horses(id) ON DELETE CASCADE
//   UNIQUE studbook_pedigree_links_horse_id_relation_type_generation_r_key: UNIQUE (horse_id, relation_type, generation, related_name)
//   PRIMARY KEY studbook_pedigree_links_pkey: PRIMARY KEY (id)
//   FOREIGN KEY studbook_pedigree_links_related_horse_id_fkey: FOREIGN KEY (related_horse_id) REFERENCES studbook_horses(id) ON DELETE SET NULL
// Table: studbook_people_orgs
//   UNIQUE studbook_people_orgs_normalized_name_role_key: UNIQUE (normalized_name, role)
//   PRIMARY KEY studbook_people_orgs_pkey: PRIMARY KEY (id)
// Table: studio_goals
//   PRIMARY KEY studio_goals_pkey: PRIMARY KEY (id)
// Table: tags
//   UNIQUE tags_name_key: UNIQUE (name)
//   PRIMARY KEY tags_pkey: PRIMARY KEY (id)
// Table: tasks
//   FOREIGN KEY tasks_contact_id_fkey: FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
//   FOREIGN KEY tasks_deal_id_fkey: FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL
//   PRIMARY KEY tasks_pkey: PRIMARY KEY (id)
//   CHECK tasks_type_check: CHECK ((type = ANY (ARRAY['Ligação'::text, 'E-mail'::text, 'WhatsApp'::text, 'Outro'::text])))

// --- ROW LEVEL SECURITY POLICIES ---
// Table: auction_candidate_items
//   Policy "Allow anon test access auction_candidate_items" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow authenticated full access auction_candidate_items" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: auction_candidate_lists
//   Policy "Allow anon test access auction_candidate_lists" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow authenticated full access auction_candidate_lists" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: automation_settings
//   Policy "Enable read access for authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable update access for authenticated users" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: bids
//   Policy "Allow authenticated full access bids" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: campaign_recipients
//   Policy "Allow authenticated full access campaign_recipients" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: campaign_schedules
//   Policy "Allow authenticated full access campaign_schedules" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: campaign_sends
//   Policy "Allow authenticated full access campaign_sends" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: campaigns
//   Policy "Allow authenticated full access campaigns" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: companies
//   Policy "Allow authenticated full access companies" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: contact_interactions
//   Policy "Allow anon test access contact_interactions" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow authenticated full access interactions" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: contact_tags
//   Policy "Allow authenticated full access contact_tags" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: contacts
//   Policy "Allow authenticated full access contacts" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: deal_tasks
//   Policy "Allow authenticated full access deal_tasks" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: deals
//   Policy "Allow authenticated full access deals" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: global_auction_houses
//   Policy "Allow anon read global_auction_houses" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "Allow authenticated full access global_auction_houses" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: global_auction_import_runs
//   Policy "Allow authenticated full access global_auction_import_runs" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: global_auction_lots
//   Policy "Allow anon read global_auction_lots" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "Allow authenticated full access global_auction_lots" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: global_auction_source_snapshots
//   Policy "Allow authenticated full access global_auction_source_snapshots" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: global_auction_sources
//   Policy "Allow anon read global_auction_sources" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "Allow authenticated full access global_auction_sources" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: global_auctions
//   Policy "Allow anon read global_auctions" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "Allow authenticated full access global_auctions" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: message_events
//   Policy "Allow authenticated full access message_events" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: message_templates
//   Policy "Enable delete access for authenticated users" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable insert access for authenticated users" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Enable read access for authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable update access for authenticated users" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: outbound_messages
//   Policy "Allow authenticated full access outbound_messages" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: purchases
//   Policy "Allow authenticated full access purchases" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: smartleiloes_auctions
//   Policy "Allow authenticated full access smartleiloes_auctions" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: smartleiloes_lots
//   Policy "Allow authenticated full access smartleiloes_lots" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: smartleiloes_raw_records
//   Policy "Allow anon test access smartleiloes_raw_records" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow authenticated read smartleiloes_raw_records" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: smartleiloes_sync_runs
//   Policy "Allow anon test access smartleiloes_sync_runs" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow authenticated read smartleiloes_sync_runs" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: studbook_horses
//   Policy "Allow anon read studbook_horses" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "Allow authenticated full access studbook_horses" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: studbook_import_runs
//   Policy "Allow authenticated full access studbook_import_runs" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: studbook_offspring
//   Policy "Allow anon read studbook_offspring" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "Allow authenticated full access studbook_offspring" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: studbook_pedigree_links
//   Policy "Allow anon read studbook_pedigree_links" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "Allow authenticated full access studbook_pedigree_links" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: studbook_people_orgs
//   Policy "Allow anon read studbook_people_orgs" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "Allow authenticated full access studbook_people_orgs" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: studio_goals
//   Policy "Enable delete access for authenticated users" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable insert access for authenticated users" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Enable read access for authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable update access for authenticated users" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: tags
//   Policy "Allow authenticated full access tags" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: tasks
//   Policy "Enable all access for authenticated users" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)

// --- DATABASE FUNCTIONS ---
// FUNCTION bulk_add_tag_to_contacts(uuid[], uuid)
//   CREATE OR REPLACE FUNCTION public.bulk_add_tag_to_contacts(p_contact_ids uuid[], p_tag_id uuid)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     INSERT INTO public.contact_tags (contact_id, tag_id)
//     SELECT unnest(p_contact_ids), p_tag_id
//     ON CONFLICT (contact_id, tag_id) DO NOTHING;
//   END;
//   $function$
//
// FUNCTION create_default_deal_tasks()
//   CREATE OR REPLACE FUNCTION public.create_default_deal_tasks()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//       INSERT INTO deal_tasks (deal_id, description) VALUES
//       (NEW.id, 'Enviar catálogo'),
//       (NEW.id, 'Agendar ligação'),
//       (NEW.id, 'Enviar vídeo do cavalo'),
//       (NEW.id, 'Follow-up');
//       RETURN NEW;
//   END;
//   $function$
//
// FUNCTION get_studbook_network_rankings(text, text, integer, integer, boolean, boolean, text[], text[], text[], text[], integer, integer, integer, text, integer)
//   CREATE OR REPLACE FUNCTION public.get_studbook_network_rankings(p_search text DEFAULT NULL::text, p_sex text DEFAULT 'all'::text, p_min_age integer DEFAULT NULL::integer, p_max_age integer DEFAULT NULL::integer, p_include_unknown_age boolean DEFAULT true, p_reproductive_only boolean DEFAULT false, p_breeder_names text[] DEFAULT NULL::text[], p_owner_names text[] DEFAULT NULL::text[], p_sire_names text[] DEFAULT NULL::text[], p_dam_names text[] DEFAULT NULL::text[], p_min_offspring integer DEFAULT NULL::integer, p_data_quality_min integer DEFAULT NULL::integer, p_recent_years integer DEFAULT NULL::integer, p_rank_mode text DEFAULT 'volume'::text, p_limit integer DEFAULT 6)
//    RETURNS TABLE(entity_id text, entity_kind text, name text, horse_count integer, female_count integer, young_count integer, active_mare_count integer, connected_owner_count integer, avg_quality numeric, latest_birth_year integer, recent_horse_count integer, crm_contact_count integer, total_entities integer)
//    LANGUAGE sql
//    STABLE
//   AS $function$
//   WITH filtered AS (
//       SELECT *
//       FROM studbook_horses_enriched h
//       WHERE (
//           NULLIF(TRIM(COALESCE(p_search, '')), '') IS NULL
//           OR h.name ILIKE '%' || p_search || '%'
//           OR h.registration ILIKE '%' || p_search || '%'
//           OR h.original_registration ILIKE '%' || p_search || '%'
//           OR h.ueln ILIKE '%' || p_search || '%'
//           OR h.microchip ILIKE '%' || p_search || '%'
//           OR h.breeder_name ILIKE '%' || p_search || '%'
//           OR h.owner_name ILIKE '%' || p_search || '%'
//           OR h.sire_name ILIKE '%' || p_search || '%'
//           OR h.dam_name ILIKE '%' || p_search || '%'
//       )
//       AND (
//           COALESCE(p_sex, 'all') = 'all'
//           OR (
//               p_sex = 'female'
//               AND (
//                   h.sex = 'F'
//                   OR LOWER(COALESCE(h.sex, '')) LIKE '%femea%'
//                   OR LOWER(COALESCE(h.sex, '')) LIKE '%fêmea%'
//                   OR LOWER(COALESCE(h.sex, '')) LIKE '%egua%'
//                   OR LOWER(COALESCE(h.sex, '')) LIKE '%égua%'
//               )
//           )
//           OR (
//               p_sex = 'male'
//               AND (
//                   h.sex = 'M'
//                   OR LOWER(COALESCE(h.sex, '')) LIKE '%macho%'
//                   OR LOWER(COALESCE(h.sex, '')) LIKE '%garanhao%'
//                   OR LOWER(COALESCE(h.sex, '')) LIKE '%garanhão%'
//               )
//           )
//           OR (
//               p_sex = 'gelding'
//               AND LOWER(COALESCE(h.sex, '')) LIKE '%castrad%'
//           )
//       )
//       AND (
//           COALESCE(p_include_unknown_age, TRUE)
//           OR h.age_years IS NOT NULL
//       )
//       AND (
//           COALESCE(p_include_unknown_age, TRUE)
//           OR p_min_age IS NULL
//           OR h.age_years >= p_min_age
//       )
//       AND (
//           COALESCE(p_include_unknown_age, TRUE)
//           OR p_max_age IS NULL
//           OR h.age_years <= p_max_age
//       )
//       AND (
//           COALESCE(p_reproductive_only, FALSE) = FALSE
//           OR h.is_reproductive_mare = TRUE
//       )
//       AND (
//           p_breeder_names IS NULL
//           OR CARDINALITY(p_breeder_names) = 0
//           OR h.breeder_name = ANY(p_breeder_names)
//       )
//       AND (
//           p_owner_names IS NULL
//           OR CARDINALITY(p_owner_names) = 0
//           OR h.owner_name = ANY(p_owner_names)
//       )
//       AND (
//           p_sire_names IS NULL
//           OR CARDINALITY(p_sire_names) = 0
//           OR h.sire_name = ANY(p_sire_names)
//       )
//       AND (
//           p_dam_names IS NULL
//           OR CARDINALITY(p_dam_names) = 0
//           OR h.dam_name = ANY(p_dam_names)
//       )
//       AND (
//           p_min_offspring IS NULL
//           OR p_min_offspring <= 0
//           OR h.offspring_count >= p_min_offspring
//       )
//       AND (
//           p_data_quality_min IS NULL
//           OR p_data_quality_min <= 0
//           OR h.data_quality_score >= p_data_quality_min
//       )
//       AND (
//           p_recent_years IS NULL
//           OR p_recent_years <= 0
//           OR h.birth_year >= EXTRACT(YEAR FROM CURRENT_DATE)::integer - p_recent_years + 1
//       )
//   ),
//   entities AS (
//       SELECT
//           breeder_id::text AS entity_id,
//           'breeder'::text AS entity_kind,
//           breeder_name AS name,
//           COUNT(*)::integer AS horse_count,
//           COUNT(*) FILTER (WHERE LOWER(COALESCE(sex, '')) LIKE '%f%')::integer AS female_count,
//           COUNT(*) FILTER (WHERE age_years IS NOT NULL AND age_years <= 6)::integer AS young_count,
//           COUNT(*) FILTER (WHERE is_reproductive_mare = TRUE)::integer AS active_mare_count,
//           COUNT(DISTINCT owner_name) FILTER (WHERE owner_name IS NOT NULL)::integer AS connected_owner_count,
//           ROUND(AVG(COALESCE(data_quality_score, 0))::numeric, 1) AS avg_quality,
//           MAX(birth_year)::integer AS latest_birth_year,
//           COUNT(*) FILTER (
//               WHERE birth_year >= EXTRACT(YEAR FROM CURRENT_DATE)::integer - COALESCE(NULLIF(p_recent_years, 0), 3) + 1
//           )::integer AS recent_horse_count
//       FROM filtered
//       WHERE is_actionable_studbook_name(breeder_name)
//       GROUP BY breeder_id, breeder_name
//
//       UNION ALL
//
//       SELECT
//           owner_id::text AS entity_id,
//           'owner'::text AS entity_kind,
//           owner_name AS name,
//           COUNT(*)::integer AS horse_count,
//           COUNT(*) FILTER (WHERE LOWER(COALESCE(sex, '')) LIKE '%f%')::integer AS female_count,
//           COUNT(*) FILTER (WHERE age_years IS NOT NULL AND age_years <= 6)::integer AS young_count,
//           COUNT(*) FILTER (WHERE is_reproductive_mare = TRUE)::integer AS active_mare_count,
//           COUNT(DISTINCT breeder_name) FILTER (WHERE breeder_name IS NOT NULL)::integer AS connected_owner_count,
//           ROUND(AVG(COALESCE(data_quality_score, 0))::numeric, 1) AS avg_quality,
//           MAX(birth_year)::integer AS latest_birth_year,
//           COUNT(*) FILTER (
//               WHERE birth_year >= EXTRACT(YEAR FROM CURRENT_DATE)::integer - COALESCE(NULLIF(p_recent_years, 0), 3) + 1
//           )::integer AS recent_horse_count
//       FROM filtered
//       WHERE is_actionable_studbook_name(owner_name)
//       GROUP BY owner_id, owner_name
//
//       UNION ALL
//
//       SELECT
//           LOWER(TRIM(sire_name)) AS entity_id,
//           'sire'::text AS entity_kind,
//           MIN(TRIM(sire_name)) AS name,
//           COUNT(*)::integer AS horse_count,
//           COUNT(*) FILTER (WHERE LOWER(COALESCE(sex, '')) LIKE '%f%')::integer AS female_count,
//           COUNT(*) FILTER (WHERE age_years IS NOT NULL AND age_years <= 6)::integer AS young_count,
//           COUNT(*) FILTER (WHERE is_reproductive_mare = TRUE)::integer AS active_mare_count,
//           COUNT(DISTINCT owner_name) FILTER (WHERE owner_name IS NOT NULL)::integer AS connected_owner_count,
//           ROUND(AVG(COALESCE(data_quality_score, 0))::numeric, 1) AS avg_quality,
//           MAX(birth_year)::integer AS latest_birth_year,
//           COUNT(*) FILTER (
//               WHERE birth_year >= EXTRACT(YEAR FROM CURRENT_DATE)::integer - COALESCE(NULLIF(p_recent_years, 0), 3) + 1
//           )::integer AS recent_horse_count
//       FROM filtered
//       WHERE is_actionable_studbook_name(sire_name)
//       GROUP BY LOWER(TRIM(sire_name))
//
//       UNION ALL
//
//       SELECT
//           LOWER(TRIM(dam_name)) AS entity_id,
//           'dam'::text AS entity_kind,
//           MIN(TRIM(dam_name)) AS name,
//           COUNT(*)::integer AS horse_count,
//           COUNT(*) FILTER (WHERE LOWER(COALESCE(sex, '')) LIKE '%f%')::integer AS female_count,
//           COUNT(*) FILTER (WHERE age_years IS NOT NULL AND age_years <= 6)::integer AS young_count,
//           COUNT(*) FILTER (WHERE is_reproductive_mare = TRUE)::integer AS active_mare_count,
//           COUNT(DISTINCT owner_name) FILTER (WHERE owner_name IS NOT NULL)::integer AS connected_owner_count,
//           ROUND(AVG(COALESCE(data_quality_score, 0))::numeric, 1) AS avg_quality,
//           MAX(birth_year)::integer AS latest_birth_year,
//           COUNT(*) FILTER (
//               WHERE birth_year >= EXTRACT(YEAR FROM CURRENT_DATE)::integer - COALESCE(NULLIF(p_recent_years, 0), 3) + 1
//           )::integer AS recent_horse_count
//       FROM filtered
//       WHERE is_actionable_studbook_name(dam_name)
//       GROUP BY LOWER(TRIM(dam_name))
//   ),
//   with_crm AS (
//       SELECT
//           e.*,
//           COALESCE(c.crm_contact_count, 0)::integer AS crm_contact_count,
//           COUNT(*) OVER (PARTITION BY e.entity_kind)::integer AS total_entities,
//           ROW_NUMBER() OVER (
//               PARTITION BY e.entity_kind
//               ORDER BY
//                   CASE WHEN COALESCE(p_rank_mode, 'volume') = 'recent' THEN e.recent_horse_count ELSE e.horse_count END DESC,
//                   e.latest_birth_year DESC NULLS LAST,
//                   e.horse_count DESC,
//                   e.name ASC
//           ) AS rank_position
//       FROM entities e
//       LEFT JOIN LATERAL (
//           SELECT COUNT(*)::integer AS crm_contact_count
//           FROM contacts c
//           WHERE normalize_studbook_match_name(c.name) = normalize_studbook_match_name(e.name)
//       ) c ON TRUE
//   )
//   SELECT
//       entity_id,
//       entity_kind,
//       name,
//       horse_count,
//       female_count,
//       young_count,
//       active_mare_count,
//       connected_owner_count,
//       avg_quality,
//       latest_birth_year,
//       recent_horse_count,
//       crm_contact_count,
//       total_entities
//   FROM with_crm
//   WHERE rank_position <= LEAST(GREATEST(COALESCE(p_limit, 6), 1), 20)
//   ORDER BY entity_kind, rank_position;
//   $function$
//
// FUNCTION is_actionable_studbook_name(text)
//   CREATE OR REPLACE FUNCTION public.is_actionable_studbook_name(value text)
//    RETURNS boolean
//    LANGUAGE sql
//    IMMUTABLE
//   AS $function$
//       SELECT NULLIF(TRIM(value), '') IS NOT NULL
//           AND UPPER(TRIM(value)) NOT IN (
//               'NAO CADASTRADA',
//               'NÃO CADASTRADA',
//               'NAO CADASTRADO',
//               'NÃO CADASTRADO',
//               'NAO INFORMADA',
//               'NÃO INFORMADA',
//               'NAO INFORMADO',
//               'NÃO INFORMADO',
//               'PENDENTE',
//               'PENDENTE - ABCCH',
//               'SEM REGISTRO',
//               'DESCONHECIDO',
//               'DESCONHECIDA'
//           );
//   $function$
//
// FUNCTION normalize_studbook_match_name(text)
//   CREATE OR REPLACE FUNCTION public.normalize_studbook_match_name(value text)
//    RETURNS text
//    LANGUAGE sql
//    IMMUTABLE
//   AS $function$
//       SELECT REGEXP_REPLACE(LOWER(TRIM(COALESCE(value, ''))), '[^a-z0-9]+', ' ', 'g');
//   $function$
//
// FUNCTION update_updated_at_column()
//   CREATE OR REPLACE FUNCTION public.update_updated_at_column()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//       NEW.updated_at = NOW();
//       RETURN NEW;
//   END;
//   $function$
//

// --- TRIGGERS ---
// Table: deals
//   trigger_create_default_deal_tasks: CREATE TRIGGER trigger_create_default_deal_tasks AFTER INSERT ON public.deals FOR EACH ROW EXECUTE FUNCTION create_default_deal_tasks()
//   update_deals_updated_at: CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()

// --- INDEXES ---
// Table: auction_candidate_items
//   CREATE UNIQUE INDEX auction_candidate_items_list_id_horse_id_key ON public.auction_candidate_items USING btree (list_id, horse_id)
// Table: automation_settings
//   CREATE UNIQUE INDEX automation_settings_rule_key_key ON public.automation_settings USING btree (rule_key)
// Table: bids
//   CREATE INDEX idx_bids_contact_id ON public.bids USING btree (contact_id)
//   CREATE UNIQUE INDEX idx_bids_smartleiloes_id ON public.bids USING btree (smartleiloes_id)
// Table: campaign_recipients
//   CREATE UNIQUE INDEX campaign_recipients_campaign_id_contact_id_channel_key ON public.campaign_recipients USING btree (campaign_id, contact_id, channel)
//   CREATE INDEX idx_campaign_recipients_campaign ON public.campaign_recipients USING btree (campaign_id)
//   CREATE INDEX idx_campaign_recipients_status ON public.campaign_recipients USING btree (status)
// Table: campaign_sends
//   CREATE INDEX idx_campaign_sends_campaign ON public.campaign_sends USING btree (campaign_id)
//   CREATE INDEX idx_campaign_sends_status ON public.campaign_sends USING btree (status)
// Table: contact_tags
//   CREATE INDEX idx_contact_tags_contact_id ON public.contact_tags USING btree (contact_id)
//   CREATE INDEX idx_contact_tags_tag_id ON public.contact_tags USING btree (tag_id)
// Table: contacts
//   CREATE INDEX idx_contacts_created_at ON public.contacts USING btree (created_at DESC)
//   CREATE INDEX idx_contacts_document ON public.contacts USING btree (document)
//   CREATE UNIQUE INDEX idx_contacts_smartleiloes_id ON public.contacts USING btree (smartleiloes_id)
// Table: global_auction_houses
//   CREATE UNIQUE INDEX global_auction_houses_normalized_name_key ON public.global_auction_houses USING btree (normalized_name)
// Table: global_auction_lots
//   CREATE UNIQUE INDEX global_auction_lots_auction_id_lot_number_normalized_horse__key ON public.global_auction_lots USING btree (auction_id, lot_number, normalized_horse_name)
//   CREATE INDEX idx_global_auction_lots_horse_name ON public.global_auction_lots USING gin (to_tsvector('simple'::regconfig, horse_name))
//   CREATE INDEX idx_global_auction_lots_price ON public.global_auction_lots USING btree (hammer_price)
//   CREATE INDEX idx_global_auction_lots_sire ON public.global_auction_lots USING btree (sire_name)
// Table: global_auction_source_snapshots
//   CREATE UNIQUE INDEX global_auction_source_snapshots_source_url_checksum_key ON public.global_auction_source_snapshots USING btree (source_url, checksum)
// Table: global_auction_sources
//   CREATE UNIQUE INDEX global_auction_sources_name_key ON public.global_auction_sources USING btree (name)
// Table: global_auctions
//   CREATE UNIQUE INDEX global_auctions_source_id_normalized_name_auction_year_key ON public.global_auctions USING btree (source_id, normalized_name, auction_year)
//   CREATE INDEX idx_global_auctions_year ON public.global_auctions USING btree (auction_year)
// Table: message_events
//   CREATE INDEX idx_message_events_campaign ON public.message_events USING btree (campaign_id)
// Table: outbound_messages
//   CREATE INDEX idx_outbound_messages_campaign ON public.outbound_messages USING btree (campaign_id)
//   CREATE INDEX idx_outbound_messages_provider_id ON public.outbound_messages USING btree (provider_message_id)
// Table: purchases
//   CREATE INDEX idx_purchases_contact_id ON public.purchases USING btree (contact_id)
//   CREATE UNIQUE INDEX idx_purchases_smartleiloes_id ON public.purchases USING btree (smartleiloes_id)
// Table: smartleiloes_auctions
//   CREATE UNIQUE INDEX smartleiloes_auctions_smartleiloes_id_key ON public.smartleiloes_auctions USING btree (smartleiloes_id)
// Table: smartleiloes_lots
//   CREATE INDEX idx_smartleiloes_lots_value ON public.smartleiloes_lots USING btree (value)
//   CREATE UNIQUE INDEX smartleiloes_lots_smartleiloes_id_key ON public.smartleiloes_lots USING btree (smartleiloes_id)
// Table: smartleiloes_raw_records
//   CREATE UNIQUE INDEX smartleiloes_raw_records_record_type_external_id_key ON public.smartleiloes_raw_records USING btree (record_type, external_id)
// Table: studbook_horses
//   CREATE INDEX idx_studbook_horses_birth_year ON public.studbook_horses USING btree (birth_year)
//   CREATE INDEX idx_studbook_horses_breeder ON public.studbook_horses USING btree (breeder_id)
//   CREATE INDEX idx_studbook_horses_dam_name ON public.studbook_horses USING gin (to_tsvector('simple'::regconfig, COALESCE(dam_name, ''::text)))
//   CREATE INDEX idx_studbook_horses_dam_name_btree ON public.studbook_horses USING btree (dam_name)
//   CREATE INDEX idx_studbook_horses_detail_status ON public.studbook_horses USING btree (abcch_detail_sync_status)
//   CREATE INDEX idx_studbook_horses_detail_synced ON public.studbook_horses USING btree (abcch_detail_synced_at)
//   CREATE INDEX idx_studbook_horses_name ON public.studbook_horses USING gin (to_tsvector('simple'::regconfig, name))
//   CREATE INDEX idx_studbook_horses_owner ON public.studbook_horses USING btree (owner_id)
//   CREATE INDEX idx_studbook_horses_registration ON public.studbook_horses USING btree (registration)
//   CREATE INDEX idx_studbook_horses_sex ON public.studbook_horses USING btree (sex)
//   CREATE INDEX idx_studbook_horses_sire_name ON public.studbook_horses USING gin (to_tsvector('simple'::regconfig, COALESCE(sire_name, ''::text)))
//   CREATE INDEX idx_studbook_horses_sire_name_btree ON public.studbook_horses USING btree (sire_name)
//   CREATE INDEX idx_studbook_horses_updated_at ON public.studbook_horses USING btree (updated_at DESC)
//   CREATE UNIQUE INDEX studbook_horses_abcch_token_key ON public.studbook_horses USING btree (abcch_token)
// Table: studbook_offspring
//   CREATE INDEX idx_studbook_offspring_parent ON public.studbook_offspring USING btree (parent_id)
//   CREATE UNIQUE INDEX studbook_offspring_parent_id_child_registration_child_name_key ON public.studbook_offspring USING btree (parent_id, child_registration, child_name)
// Table: studbook_pedigree_links
//   CREATE UNIQUE INDEX studbook_pedigree_links_horse_id_relation_type_generation_r_key ON public.studbook_pedigree_links USING btree (horse_id, relation_type, generation, related_name)
// Table: studbook_people_orgs
//   CREATE UNIQUE INDEX studbook_people_orgs_normalized_name_role_key ON public.studbook_people_orgs USING btree (normalized_name, role)
// Table: tags
//   CREATE UNIQUE INDEX tags_name_key ON public.tags USING btree (name)
