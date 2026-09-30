type Table<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type OrganizationRole = "owner" | "manager" | "sales";

export type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  timezone: "Africa/Cairo" | "Asia/Riyadh";
  currency: "EGP" | "SAR";
  weekend_days: number[];
  working_hours: {start: string; end: string};
  language: "ar" | "en";
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MembershipRow = {
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  is_active: boolean;
  created_at: string;
};

export type LeadRow = {
  id: string;
  organization_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  source: string | null;
  property_interest: string | null;
  budget_min: number | null;
  budget_max: number | null;
  status: "new" | "contacted" | "qualified" | "won" | "lost";
  stage_id: string;
  assigned_to: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type TaskRow = {
  id: string;
  organization_id: string;
  lead_id: string;
  title: string;
  title_ar: string;
  assigned_to: string;
  created_by: string;
  due_at: string;
  is_mandatory: boolean;
  completed_at: string | null;
  escalated_at: string | null;
  escalated_to: string | null;
  created_at: string;
  updated_at: string;
};

export type NotificationRow = {
  id: string;
  organization_id: string;
  recipient_id: string;
  task_id: string;
  kind: "task_due" | "task_escalated";
  title: string;
  title_ar: string;
  read_at: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      organizations: Table<OrganizationRow>;
      memberships: Table<MembershipRow>;
      leads: Table<LeadRow>;
      tasks: Table<TaskRow>;
      notifications: Table<NotificationRow>;
    };
    Views: Record<string, never>;
    Functions: {
      create_organization: {
        Args: {
          organization_name: string;
          organization_timezone?: string;
          organization_currency?: string;
          organization_weekend_days?: number[];
          organization_working_hours?: {start: string; end: string};
          organization_language?: string;
        };
        Returns: string;
      };
      create_lead: {
        Args: {
          target_organization_id: string;
          lead_full_name: string;
          lead_phone: string;
          lead_email?: string | null;
          lead_source?: string | null;
          lead_property_interest?: string | null;
          requested_assignee_id?: string | null;
        };
        Returns: {
          id: string;
          duplicate: boolean;
          assigned_to: string;
        };
      };
      import_leads: {
        Args: {target_organization_id: string; rows_payload: Json};
        Returns: {
          created: number;
          duplicates: number;
          failed: number;
          errors: Array<{row: number; reason: string}>;
        };
      };
      save_workflow_settings: {
        Args: {
          target_organization_id: string;
          organization_name: string;
          organization_timezone: string;
          organization_currency: string;
          organization_language: string;
          organization_weekend_days: number[];
          organization_working_hours: {start: string; end: string};
          follow_up_minutes: number;
          escalation_minutes: number;
          auto_assign_enabled: boolean;
          active_sales_ids: string[];
        };
        Returns: undefined;
      };
      rotate_organization_webhook_secret: {
        Args: {target_organization_id: string};
        Returns: string;
      };
      ingest_webhook_lead: {
        Args: {
          target_organization_id: string;
          supplied_secret: string;
          lead_full_name: string;
          lead_phone: string;
          lead_email?: string | null;
          lead_source?: string | null;
          lead_property_interest?: string | null;
        };
        Returns: {
          id: string;
          duplicate: boolean;
          assigned_to: string;
        };
      };
      get_org_role: {
        Args: {target_organization_id: string};
        Returns: OrganizationRole | null;
      };
    };
    Enums: {
      organization_role: OrganizationRole;
    };
    CompositeTypes: Record<string, never>;
  };
};

type Json = string | number | boolean | null | Json[] | {[key: string]: Json | undefined};