import type { JsonValue } from "./api";

export type ID = number | string;

export interface Permission {
  id?: number;
  key: string;
  description?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string | null;
  is_system?: boolean;
  permissions?: Permission[];
}

export interface Tenant {
  id: number;
  name: string;
  industry?: string | null;
  status?: string;
  settings?: Record<string, JsonValue>;
  pivot?: { role_id?: number; status?: string; joined_at?: string };
}

export interface User {
  id: number;
  name: string;
  email: string;
  is_platform_admin?: boolean;
  tenants?: Tenant[];
  permissions?: string[];
  role?: Role;
}

export interface OwnerReference {
  id: number;
  name: string;
}

export interface OrganizationReference {
  id: number;
  name: string;
}

export interface Contact {
  id: number;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  owner_id?: number | null;
  owner?: OwnerReference | null;
  status?: string | null;
  custom_fields?: Record<string, JsonValue>;
  organizations?: OrganizationReference[];
  created_at?: string;
  updated_at?: string;
}

export interface Organization {
  id: number;
  name: string;
  legal_name?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  owner_id?: number | null;
  owner?: OwnerReference | null;
  custom_fields?: Record<string, JsonValue>;
  contacts?: Contact[];
  created_at?: string;
  updated_at?: string;
}

export interface Lead {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  owner_id?: number | null;
  owner?: OwnerReference | null;
  contact_id?: number | null;
  contact?: Contact | null;
  organization_id?: number | null;
  organization?: Organization | null;
  status?: string | null;
  score?: number | null;
  custom_fields?: Record<string, JsonValue>;
  converted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PipelineStage {
  id: number;
  pipeline_id: number;
  name: string;
  position: number;
  probability?: number;
  color?: string | null;
  is_won?: boolean;
  is_lost?: boolean;
}

export interface Pipeline {
  id: number;
  name: string;
  description?: string | null;
  is_default?: boolean;
  active?: boolean;
  stages: PipelineStage[];
}

export interface Deal {
  id: number;
  pipeline_id: number;
  stage_id: number;
  pipeline?: Pick<Pipeline, "id" | "name">;
  stage?: PipelineStage;
  owner_id?: number | null;
  owner?: OwnerReference | null;
  contact_id?: number | null;
  contact?: Contact | null;
  organization_id?: number | null;
  organization?: Organization | null;
  name: string;
  value: number;
  currency: string;
  status?: string | null;
  expected_close_date?: string | null;
  custom_fields?: Record<string, JsonValue>;
  created_at?: string;
  updated_at?: string;
}

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "normal" | "high" | "urgent";

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  assigned_to?: number | null;
  assignee?: OwnerReference | null;
  creator?: OwnerReference | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_at?: string | null;
  related_type?: string | null;
  related_id?: string | null;
  custom_fields?: Record<string, JsonValue>;
  created_at?: string;
  updated_at?: string;
}

export type ActivityType =
  | "call"
  | "meeting"
  | "email"
  | "whatsapp"
  | "note"
  | "task"
  | "quote"
  | "deal"
  | "ticket"
  | "status_change"
  | "automation"
  | "system";

export interface Activity {
  id: number;
  user_id?: number | null;
  user?: OwnerReference | null;
  type: ActivityType;
  subject?: string | null;
  body?: string | null;
  activityable_type?: string | null;
  activityable_id?: string | null;
  occurred_at?: string | null;
  metadata?: Record<string, JsonValue>;
  created_at?: string;
}

export type CustomFieldType =
  | "text"
  | "textarea"
  | "number"
  | "decimal"
  | "currency"
  | "email"
  | "phone"
  | "url"
  | "date"
  | "datetime"
  | "boolean"
  | "select"
  | "multi_select"
  | "user"
  | "relation"
  | "file";

export interface FieldDefinition {
  id: number;
  entity_type?: string | null;
  entity_definition_id?: number | null;
  name: string;
  label: string;
  type: CustomFieldType;
  required?: boolean;
  options?: string[] | null;
  validation_rules?: { min?: number; max?: number; regex?: string } | null;
  default_value?: JsonValue;
  position?: number;
  active?: boolean;
}

export interface EntityDefinition {
  id: number;
  name: string;
  label: string;
  settings?: Record<string, JsonValue>;
  active?: boolean;
  fields?: FieldDefinition[];
}

export interface EntityRecord {
  id: number;
  entity_definition_id: number;
  data: Record<string, JsonValue>;
  created_by?: number;
  updated_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Relation {
  id: number;
  relation_type: string;
  from_type: string;
  from_id: string;
  to_type: string;
  to_id: string;
  metadata?: Record<string, JsonValue>;
  created_at?: string;
}

export interface RelationOptionGroup {
  key: string;
  type: string;
  label: string;
  records: Array<{
    id: string;
    label: string;
    subtitle?: string | null;
  }>;
}

export interface Automation {
  id: number;
  name: string;
  event_type: string;
  config: Record<string, JsonValue>;
  version?: number;
  active?: boolean;
  runs_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Integration {
  id: number;
  provider: string;
  name: string;
  settings?: Record<string, JsonValue>;
  status?: "pending" | "active" | "disabled";
  last_synced_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface IntegrationProviderField {
  key: string;
  target: "credentials" | "settings";
  label: string;
  type: "text" | "password" | "url";
  required: boolean;
  placeholder?: string;
}

export interface IntegrationProviderDefinition {
  key: string;
  label: string;
  description: string;
  fields: IntegrationProviderField[];
}

export interface IntegrationHealth {
  ok: boolean;
  status: number | null;
  message: string;
  checked_at: string;
}

export interface WebhookEndpoint {
  id: number;
  name: string;
  url: string;
  events?: string[];
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WebhookEndpointCreateResponse {
  endpoint: WebhookEndpoint;
  signing_secret?: string;
  ingress_url?: string;
}

export interface UserMembership {
  id: number;
  user: User;
  role?: Role;
  role_id?: number;
  status?: string;
}

export interface TenantInvitation {
  id: number;
  email: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  role?: Pick<Role, "id" | "name">;
  inviter?: Pick<User, "id" | "name">;
  created_at?: string;
}

export interface InvitationDetails {
  email: string;
  tenant: Pick<Tenant, "id" | "name">;
  role: Pick<Role, "id" | "name">;
  expires_at: string;
  existing_user: boolean;
}

export interface AuditLog {
  id: number;
  action: string;
  auditable_type?: string;
  auditable_id?: string;
  user?: User;
  old_values?: Record<string, JsonValue>;
  new_values?: Record<string, JsonValue>;
  created_at?: string;
}

export type BatchStatus = "queued" | "processing" | "completed" | "failed";

export interface ImportBatch {
  id: number;
  entity_type: string;
  original_filename?: string;
  status: BatchStatus;
  /** Filled in when the job ends; `errors` holds at most 100 rows. */
  summary?: {
    processed: number;
    failed: number;
    errors: Array<{ row: number; message: string }>;
  } | null;
  error?: string | null;
  created_at?: string;
}

export interface ExportBatch {
  id: number;
  entity_type: string;
  status: BatchStatus;
  row_count?: number | null;
  error?: string | null;
  /** Only present for completed exports stored on S3-compatible storage. */
  download_url?: string;
  created_at?: string;
}

export interface FileRecord {
  id: number;
  filename: string;
  mime_type?: string;
  size?: number;
  path?: string;
  related_type?: string | null;
  related_id?: string | null;
  created_at?: string;
}
