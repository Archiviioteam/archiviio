export type ProjectStatus = "active" | "on_hold" | "completed" | "archived";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskUrgency = "low" | "medium" | "high" | "critical";
export type ContactType =
  | "impresa"
  | "elettricista"
  | "altro"
  | "tecnico"
  | "idraulico"
  | "collaboratore"
  | "geometra"
  | "architetto"
  | "ingegnere";
export type MemberRole = "owner" | "member";

export interface Workspace {
  id: string;
  name: string;
  code: string | null;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  invited_by: string;
  token: string;
  status: "pending" | "accepted" | "revoked";
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  workspace_id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: MemberRole;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  code: string;
  location: string | null;
  status: ProjectStatus;
  created_at: string;
}

export interface Contact {
  id: string;
  workspace_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  type: ContactType | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type SupplierCompanyType =
  | "lighting"
  | "gres"
  | "wood"
  | "bathroom"
  | "flooring"
  | "furniture"
  | "kitchens"
  | "outdoor"
  | "curtains"
  | "upholstery"
  | "trimmings"
  | "metals"
  | "wallpaper"
  | "laminates"
  | "finishes"
  | "leather_eco"
  | "supplies"
  | "marble"
  | "carpets"
  | "handles"
  | "other";

export interface Supplier {
  id: string;
  workspace_id: string;
  company: string;
  company_types: SupplierCompanyType[];
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  in_material_library: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  workspace_id: string;
  project_id: string | null;
  name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  tags: string[];
  created_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_url: string;
  created_at: string;
}

export interface Task {
  id: string;
  workspace_id: string;
  project_id: string | null;
  title: string;
  status: TaskStatus;
  due_date: string | null;
  urgency: TaskUrgency | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface NomenclatureRule {
  id: string;
  workspace_id: string;
  project_id: string;
  pattern: string;
  description: string | null;
  created_at: string;
}

export interface WorkspaceNomenclatureRule {
  id: string;
  workspace_id: string;
  title: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceNote {
  id: string;
  workspace_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectNomenclature {
  id: string;
  workspace_id: string;
  project_id: string;
  content: string;
  updated_at: string;
}

export type EmailDirection = "inbound" | "outbound";
export type EmailMatchStatus = "auto" | "manual" | "unmatched";

export interface MailboxConnection {
  id: string;
  user_id: string;
  workspace_id: string;
  email: string;
  imap_host: string;
  imap_port: number;
  imap_secure: boolean;
  imap_username: string;
  password_encrypted: string;
  sent_folder: string;
  sync_enabled: boolean;
  last_sync_at: string | null;
  last_sync_error: string | null;
  last_uid_inbox: number;
  last_uid_sent: number;
  created_at: string;
  updated_at: string;
}

export interface ArchivedEmail {
  id: string;
  workspace_id: string;
  project_id: string | null;
  mailbox_connection_id: string;
  mailbox_user_id: string;
  direction: EmailDirection;
  message_id: string | null;
  imap_uid: number;
  imap_folder: string;
  subject: string;
  from_address: string;
  from_name: string | null;
  to_addresses: string[];
  cc_addresses: string[];
  sent_at: string;
  snippet: string;
  body_text: string | null;
  match_status: EmailMatchStatus;
  match_confidence: number;
  matched_rule: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectEmailKeyword {
  id: string;
  workspace_id: string;
  project_id: string;
  keyword: string;
  created_at: string;
}

export type ActivityAction =
  | "project.created"
  | "project.updated"
  | "project.deleted"
  | "document.uploaded"
  | "document.deleted"
  | "document.tags_updated"
  | "nomenclature.updated"
  | "contact.created"
  | "contact.updated"
  | "contact.deleted"
  | "contact.linked"
  | "contact.unlinked"
  | "supplier.created"
  | "supplier.updated"
  | "supplier.deleted"
  | "supplier.linked"
  | "supplier.unlinked"
  | "task.created"
  | "task.updated"
  | "task.status_changed"
  | "task.deleted"
  | "workspace.created";

export type ActivityEntityType =
  | "project"
  | "document"
  | "nomenclature"
  | "contact"
  | "supplier"
  | "task"
  | "workspace";

export interface ActivityEvent {
  id: string;
  workspace_id: string;
  actor_id: string | null;
  action: ActivityAction;
  entity_type: ActivityEntityType;
  entity_id: string | null;
  project_id: string | null;
  title: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
