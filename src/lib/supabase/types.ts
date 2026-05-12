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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
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
            foreignKeyName: "bids_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact_segmentation_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "customer_rfmv_view"
            referencedColumns: ["id"]
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
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact_segmentation_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "customer_rfmv_view"
            referencedColumns: ["id"]
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
            foreignKeyName: "campaign_schedules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_schedules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
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
            foreignKeyName: "campaign_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_sends_campaign_recipient_id_fkey"
            columns: ["campaign_recipient_id"]
            isOneToOne: false
            referencedRelation: "campaign_recipients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_sends_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "contact_segmentation_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_sends_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_sends_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "customer_rfmv_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_sends_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "campaign_schedules"
            referencedColumns: ["id"]
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
            foreignKeyName: "contact_interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact_segmentation_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "customer_rfmv_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_interactions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
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
            foreignKeyName: "contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact_segmentation_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "customer_rfmv_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
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
            foreignKeyName: "deal_tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
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
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact_segmentation_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "customer_rfmv_view"
            referencedColumns: ["id"]
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
            foreignKeyName: "message_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact_segmentation_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "customer_rfmv_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_events_outbound_message_id_fkey"
            columns: ["outbound_message_id"]
            isOneToOne: false
            referencedRelation: "outbound_messages"
            referencedColumns: ["id"]
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
            foreignKeyName: "outbound_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_messages_campaign_recipient_id_fkey"
            columns: ["campaign_recipient_id"]
            isOneToOne: false
            referencedRelation: "campaign_recipients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_messages_campaign_send_id_fkey"
            columns: ["campaign_send_id"]
            isOneToOne: false
            referencedRelation: "campaign_sends"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact_segmentation_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "customer_rfmv_view"
            referencedColumns: ["id"]
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
            foreignKeyName: "purchases_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact_segmentation_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "customer_rfmv_view"
            referencedColumns: ["id"]
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
            foreignKeyName: "smartleiloes_lots_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "smartleiloes_auctions"
            referencedColumns: ["id"]
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
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contact_segmentation_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "customer_rfmv_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
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
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
// Table: tags
//   UNIQUE tags_name_key: UNIQUE (name)
//   PRIMARY KEY tags_pkey: PRIMARY KEY (id)
// Table: tasks
//   FOREIGN KEY tasks_contact_id_fkey: FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
//   FOREIGN KEY tasks_deal_id_fkey: FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE SET NULL
//   PRIMARY KEY tasks_pkey: PRIMARY KEY (id)
//   CHECK tasks_type_check: CHECK ((type = ANY (ARRAY['Ligação'::text, 'E-mail'::text, 'WhatsApp'::text, 'Outro'::text])))

// --- ROW LEVEL SECURITY POLICIES ---
// Table: automation_settings
//   Policy "Enable read access for authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable update access for authenticated users" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: bids
//   Policy "Allow anon test access bids" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow authenticated full access bids" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: campaign_recipients
//   Policy "Allow anon test access campaign_recipients" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow authenticated full access campaign_recipients" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: campaign_schedules
//   Policy "Allow anon test access campaign_schedules" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow authenticated full access campaign_schedules" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: campaign_sends
//   Policy "Allow anon test access campaign_sends" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow authenticated full access campaign_sends" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: campaigns
//   Policy "Allow anon test access campaigns" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow authenticated full access campaigns" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: companies
//   Policy "Allow anon test access companies" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
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
//   Policy "Allow anon test access contact_tags" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow authenticated full access contact_tags" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: contacts
//   Policy "Allow anon test access contacts" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow authenticated full access contacts" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: deal_tasks
//   Policy "Allow anon test access deal_tasks" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow authenticated full access deal_tasks" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: deals
//   Policy "Allow anon test access deals" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow authenticated full access deals" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: message_events
//   Policy "Allow anon test access message_events" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow authenticated full access message_events" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: message_templates
//   Policy "Allow anon test access message_templates" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Enable delete access for authenticated users" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable insert access for authenticated users" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "Enable read access for authenticated users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "Enable update access for authenticated users" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: outbound_messages
//   Policy "Allow anon test access outbound_messages" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow authenticated full access outbound_messages" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: purchases
//   Policy "Allow anon test access purchases" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow authenticated full access purchases" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: smartleiloes_auctions
//   Policy "Allow anon test access smartleiloes_auctions" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow authenticated full access smartleiloes_auctions" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: smartleiloes_lots
//   Policy "Allow anon test access smartleiloes_lots" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
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
// Table: tags
//   Policy "Allow anon test access tags" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Allow authenticated full access tags" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: tasks
//   Policy "Allow anon test access tasks" (ALL, PERMISSIVE) roles={anon}
//     USING: true
//     WITH CHECK: true
//   Policy "Enable all access for authenticated users" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)

// --- DATABASE FUNCTIONS ---
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
// Table: automation_settings
//   CREATE UNIQUE INDEX automation_settings_rule_key_key ON public.automation_settings USING btree (rule_key)
// Table: bids
//   CREATE UNIQUE INDEX idx_bids_smartleiloes_id ON public.bids USING btree (smartleiloes_id)
// Table: campaign_recipients
//   CREATE UNIQUE INDEX campaign_recipients_campaign_id_contact_id_channel_key ON public.campaign_recipients USING btree (campaign_id, contact_id, channel)
//   CREATE INDEX idx_campaign_recipients_campaign ON public.campaign_recipients USING btree (campaign_id)
//   CREATE INDEX idx_campaign_recipients_status ON public.campaign_recipients USING btree (status)
// Table: campaign_sends
//   CREATE INDEX idx_campaign_sends_campaign ON public.campaign_sends USING btree (campaign_id)
//   CREATE INDEX idx_campaign_sends_status ON public.campaign_sends USING btree (status)
// Table: contacts
//   CREATE INDEX idx_contacts_document ON public.contacts USING btree (document)
//   CREATE UNIQUE INDEX idx_contacts_smartleiloes_id ON public.contacts USING btree (smartleiloes_id)
// Table: message_events
//   CREATE INDEX idx_message_events_campaign ON public.message_events USING btree (campaign_id)
// Table: outbound_messages
//   CREATE INDEX idx_outbound_messages_campaign ON public.outbound_messages USING btree (campaign_id)
//   CREATE INDEX idx_outbound_messages_provider_id ON public.outbound_messages USING btree (provider_message_id)
// Table: purchases
//   CREATE UNIQUE INDEX idx_purchases_smartleiloes_id ON public.purchases USING btree (smartleiloes_id)
// Table: smartleiloes_auctions
//   CREATE UNIQUE INDEX smartleiloes_auctions_smartleiloes_id_key ON public.smartleiloes_auctions USING btree (smartleiloes_id)
// Table: smartleiloes_lots
//   CREATE UNIQUE INDEX smartleiloes_lots_smartleiloes_id_key ON public.smartleiloes_lots USING btree (smartleiloes_id)
// Table: smartleiloes_raw_records
//   CREATE UNIQUE INDEX smartleiloes_raw_records_record_type_external_id_key ON public.smartleiloes_raw_records USING btree (record_type, external_id)
// Table: tags
//   CREATE UNIQUE INDEX tags_name_key ON public.tags USING btree (name)

