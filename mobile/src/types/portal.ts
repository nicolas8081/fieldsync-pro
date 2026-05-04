export type UserRole = 'customer' | 'admin' | 'technician';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  /** Set after backend resolves customer by email or after first ticket (UUID). */
  customerId?: string;
  /** Technician credentials for HTTP Basic against `/technician/*` (stored for demo like the rest of auth). */
  accountPassword?: string;
}

export interface Technician {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  available: boolean;
}

export type TicketStatus =
  | 'new'
  | 'triaged'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'cancelled';

export interface AdminReply {
  id: string;
  body: string;
  at: string;
}

export interface Ticket {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  appliance: string;
  problemDescription: string;
  status: TicketStatus;
  createdAt: string;
  assignedTechnicianId: string | null;
  adminReplies: AdminReply[];
  linkedJobId: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'admin';
  text: string;
  at: string;
}

/** Shared customer ↔ admin support thread (persisted). */
export interface SupportThreadMessage {
  id: string;
  author: 'customer' | 'admin';
  text: string;
  at: string;
}
