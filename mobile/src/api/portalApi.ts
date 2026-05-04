import { getAdminApiKey, getApiBase } from '../config/api';
import type { Job } from '../types/job';
import type { Technician, Ticket, TicketStatus } from '../types/portal';
import type { SupportThreadMessage } from '../types/portal';

const JSON_HDR = { 'Content-Type': 'application/json' };

export type PortalLoginResult = {
  role: 'customer' | 'technician' | 'admin';
  email: string;
  display_name: string;
  customer_id?: string | null;
  technician_id?: string | null;
  admin_user_id?: string | null;
};

export async function authPortalLogin(email: string, password: string): Promise<PortalLoginResult> {
  const em = email.trim();
  const pw = password.trim();
  const res = await fetch(`${getApiBase()}/auth/login`, {
    method: 'POST',
    headers: JSON_HDR,
    body: JSON.stringify({ email: em, password: pw }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `login ${res.status}`);
  }
  return res.json() as Promise<PortalLoginResult>;
}

export async function authSignupCustomer(input: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}): Promise<{ id: string; email: string; full_name: string; phone?: string | null }> {
  const res = await fetch(`${getApiBase()}/auth/signup/customer`, {
    method: 'POST',
    headers: JSON_HDR,
    body: JSON.stringify({
      email: input.email.trim(),
      password: input.password,
      full_name: input.full_name.trim(),
      phone: input.phone?.trim() || undefined,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `signup ${res.status}`);
  }
  return res.json();
}

function authHeaderBasic(email: string, password: string): string {
  const pair = `${email}:${password}`;
  const g = globalThis as unknown as { btoa?: (s: string) => string };
  if (typeof g.btoa !== 'function') {
    throw new Error('Basic auth requires btoa (use a modern JS runtime or polyfill).');
  }
  return `Basic ${g.btoa(pair)}`;
}

function adminHeaders(): HeadersInit {
  const h: Record<string, string> = { ...JSON_HDR };
  const key = getAdminApiKey();
  if (key) h['X-Admin-Key'] = key;
  return h;
}

function techHeaders(email: string, password: string): HeadersInit {
  return {
    ...JSON_HDR,
    Authorization: authHeaderBasic(email, password),
  };
}

/** Backend ticket.status → portal TicketStatus */
export function backendStatusToPortal(s: string): TicketStatus {
  switch (s) {
    case 'open':
      return 'new';
    case 'assigned':
    case 'scheduled':
      return 'assigned';
    case 'in_progress':
    case 'on_site':
      return 'in_progress';
    case 'completed':
      return 'resolved';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'new';
  }
}

/** Portal Job.status → backend PATCH status */
export function jobStatusToBackend(s: Job['status']): string {
  switch (s) {
    case 'scheduled':
      return 'scheduled';
    case 'in_progress':
      return 'in_progress';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'scheduled';
  }
}

function backendStatusToJobStatus(s: string): Job['status'] {
  switch (s) {
    case 'open':
    case 'assigned':
    case 'scheduled':
      return 'scheduled';
    case 'in_progress':
    case 'on_site':
      return 'in_progress';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'scheduled';
  }
}

export type BackendCustomer = {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
};

export type BackendTicket = {
  id: string;
  customer_id: string;
  title: string;
  description?: string | null;
  status: string;
  priority?: string | null;
  technician_id?: string | null;
  scheduled_at?: string | null;
  site_address?: string | null;
  created_at: string;
  updated_at: string;
  /** Supabase embed shape from joined selects */
  customers?: BackendCustomer | BackendCustomer[] | null;
  /** FastAPI `TicketWithCustomer` shape */
  customer?: BackendCustomer | null;
  technicians?: { id: string; full_name: string; email: string; phone?: string | null; active?: boolean } | null;
  technician?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string | null;
    active?: boolean;
  } | null;
  latest_admin_reply?: string | null;
  latest_admin_reply_at?: string | null;
};

function normalizeCustomerEmb(row: {
  customers?: unknown;
  customer?: unknown;
}): BackendCustomer | null {
  const raw = row.customers ?? row.customer;
  if (Array.isArray(raw)) return (raw[0] as BackendCustomer) ?? null;
  if (raw && typeof raw === 'object') return raw as BackendCustomer;
  return null;
}

export function mapBackendTicketToPortal(t: BackendTicket, messagesForReplies?: { body: string; created_at: string }[]): Ticket {
  const c = normalizeCustomerEmb(t);
  const appliance = t.title?.includes('—') ? t.title.split('—')[0]?.trim() || t.title : t.title;
  const adminReplies =
    messagesForReplies?.map((m, i) => ({
      id: `adm-${i}-${m.created_at}`,
      body: m.body,
      at: m.created_at,
    })) ??
    (t.latest_admin_reply
      ? [
          {
            id: 'latest-admin',
            body: t.latest_admin_reply,
            at: t.latest_admin_reply_at ?? t.created_at,
          },
        ]
      : []);

  return {
    id: t.id,
    customerName: c?.full_name ?? '—',
    customerEmail: c?.email ?? '—',
    customerPhone: c?.phone ?? '—',
    customerAddress: t.site_address ?? '—',
    appliance,
    problemDescription: t.description ?? '',
    status: backendStatusToPortal(t.status),
    createdAt: t.created_at,
    assignedTechnicianId: t.technician_id ?? null,
    adminReplies,
    linkedJobId: t.id,
  };
}

export async function fetchCustomerAccountByEmail(email: string): Promise<BackendCustomer | null> {
  const q = encodeURIComponent(email.trim().toLowerCase());
  const res = await fetch(`${getApiBase()}/customer/account?email=${q}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`account ${res.status}`);
  return res.json();
}

export async function fetchCustomerTickets(customerId: string): Promise<Ticket[]> {
  const q = encodeURIComponent(customerId);
  const res = await fetch(`${getApiBase()}/customer/tickets?customer_id=${q}`);
  if (!res.ok) throw new Error(`customer tickets ${res.status}`);
  const rows: BackendTicket[] = await res.json();
  return rows.map((t) => mapBackendTicketToPortal(t));
}

export async function createTicketApi(input: {
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  title: string;
  description?: string;
  priority?: string;
  site_address?: string;
}): Promise<BackendTicket> {
  const url = `${getApiBase()}/customer/createTickets`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: JSON_HDR,
      body: JSON.stringify(input),
    });
  } catch (e) {
    const hint =
      getApiBase().includes('localhost') || getApiBase().includes('127.0.0.1')
        ? ' On a real phone, localhost is the phone itself — set EXPO_PUBLIC_API_URL to your Mac\'s Wi‑Fi IP (e.g. http://192.168.1.42:8000).'
        : '';
    const orig = e instanceof Error ? e.message : String(e);
    throw new Error(`Cannot reach API at ${url}.${hint} (${orig})`);
  }
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `create ticket HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchAdminTickets(scope: 'active' | 'past' | 'all'): Promise<Ticket[]> {
  const res = await fetch(`${getApiBase()}/admin/tickets?scope=${scope}`, { headers: adminHeaders() });
  if (!res.ok) throw new Error(`admin tickets ${res.status}`);
  const rows: BackendTicket[] = await res.json();
  return rows.map((t) => mapBackendTicketToPortal(t));
}

export async function fetchAdminTechnicians(): Promise<Technician[]> {
  const res = await fetch(`${getApiBase()}/admin/technicians`, { headers: adminHeaders() });
  if (!res.ok) throw new Error(`technicians ${res.status}`);
  const rows: { id: string; full_name: string; phone?: string | null; active: boolean; email: string }[] = await res.json();
  return rows.map((r) => ({
    id: r.id,
    name: r.full_name,
    email: r.email,
    phone: r.phone ?? '—',
    specialty: 'Field service',
    available: r.active,
  }));
}

export async function createTechnicianAccountApi(input: {
  email: string;
  full_name: string;
  password: string;
  phone?: string;
}): Promise<void> {
  const res = await fetch(`${getApiBase()}/admin/technicians`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `create technician ${res.status}`);
  }
}

export async function assignTicketApi(ticketId: string, technicianId: string): Promise<void> {
  const res = await fetch(`${getApiBase()}/admin/tickets/${ticketId}/assign`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ technician_id: technicianId }),
  });
  if (!res.ok) throw new Error(`assign ${res.status}`);
}

export async function adminReplyApi(ticketId: string, message: string): Promise<void> {
  const res = await fetch(`${getApiBase()}/admin/tickets/${ticketId}/reply`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(`reply ${res.status}`);
}

export async function fetchTechnicianJobs(email: string, password: string): Promise<Job[]> {
  const res = await fetch(`${getApiBase()}/technician/jobs`, { headers: techHeaders(email, password) });
  if (!res.ok) throw new Error(`tech jobs ${res.status}`);
  const rows: BackendTicket[] = await res.json();
  return rows.map((t) => {
    const custName = normalizeCustomerEmb(t)?.full_name ?? 'Customer';
    return {
      id: t.id,
      title: t.title,
      customer: custName,
      address: t.site_address ?? '—',
      status: backendStatusToJobStatus(t.status),
      scheduledAt: t.scheduled_at ?? t.created_at,
      description: t.description ?? t.title,
      severity: t.priority === 'high' ? 'high' : t.priority === 'low' ? 'low' : 'med',
    };
  });
}

export async function patchTechnicianTicket(
  email: string,
  password: string,
  ticketId: string,
  status: string
): Promise<void> {
  const res = await fetch(`${getApiBase()}/technician/tickets/${ticketId}`, {
    method: 'PATCH',
    headers: techHeaders(email, password),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`patch ticket ${res.status}`);
}

export async function deleteTechnicianTicket(email: string, password: string, ticketId: string): Promise<void> {
  const res = await fetch(`${getApiBase()}/technician/tickets/${ticketId}`, {
    method: 'DELETE',
    headers: techHeaders(email, password),
  });
  if (!res.ok && res.status !== 204) throw new Error(`delete ticket ${res.status}`);
}

export async function fetchTechnicianStats(
  email: string,
  password: string
): Promise<{ active_tasks: number; on_site: number; scheduled: number }> {
  const res = await fetch(`${getApiBase()}/technician/stats`, { headers: techHeaders(email, password) });
  if (!res.ok) throw new Error(`stats ${res.status}`);
  return res.json();
}

function mapMessageToSupport(m: {
  id: string;
  author_type: string;
  body: string;
  created_at: string;
}): SupportThreadMessage {
  const author = m.author_type === 'admin' ? 'admin' : 'customer';
  return {
    id: m.id,
    author,
    text: m.body,
    at: m.created_at,
  };
}

export async function fetchCustomerSupportThread(customerId: string): Promise<SupportThreadMessage[]> {
  const q = encodeURIComponent(customerId);
  const res = await fetch(`${getApiBase()}/customer/support/thread?customer_id=${q}`);
  if (!res.ok) throw new Error(`support thread ${res.status}`);
  const data: { messages: { id: string; author_type: string; body: string; created_at: string }[] } = await res.json();
  return (data.messages ?? []).map(mapMessageToSupport);
}

export async function customerReplyOnTicket(
  customerId: string,
  ticketId: string,
  message: string
): Promise<void> {
  const q = encodeURIComponent(customerId);
  const res = await fetch(
    `${getApiBase()}/customer/tickets/${ticketId}/reply?customer_id=${q}`,
    {
      method: 'POST',
      headers: JSON_HDR,
      body: JSON.stringify({ message }),
    }
  );
  if (!res.ok) throw new Error(`customer reply ${res.status}`);
}

export async function fetchAdminChatInbox(): Promise<
  { key: string; customerEmail: string; customerName: string; lastPreview: string; updatedAt: string }[]
> {
  const res = await fetch(`${getApiBase()}/admin/chat/inbox`, { headers: adminHeaders() });
  if (!res.ok) throw new Error(`inbox ${res.status}`);
  const rows: { customer_email: string; customer_name: string; last_preview: string; updated_at: string }[] =
    await res.json();
  return rows.map((r) => ({
    key: r.customer_email.toLowerCase(),
    customerEmail: r.customer_email,
    customerName: r.customer_name,
    lastPreview: r.last_preview,
    updatedAt: r.updated_at,
  }));
}

export async function fetchAdminChatThread(customerEmail: string): Promise<SupportThreadMessage[]> {
  const q = encodeURIComponent(customerEmail.trim());
  const res = await fetch(`${getApiBase()}/admin/chat/thread?customer_email=${q}`, { headers: adminHeaders() });
  if (!res.ok) throw new Error(`admin thread ${res.status}`);
  const data: { messages: { id: string; author_type: string; body: string; created_at: string }[] } = await res.json();
  return (data.messages ?? []).map(mapMessageToSupport);
}

/** Latest ticket for customer (by created_at desc) for routing free-form messages */
export async function findLatestTicketIdForCustomerEmail(customerEmail: string): Promise<string | null> {
  const acc = await fetchCustomerAccountByEmail(customerEmail);
  if (!acc) return null;
  const tickets = await fetchCustomerTickets(acc.id);
  return tickets[0]?.id ?? null;
}

export async function adminReplyForCustomerEmail(customerEmail: string, message: string): Promise<void> {
  const tid = await findLatestTicketIdForCustomerEmail(customerEmail);
  if (!tid) throw new Error('No ticket found for this customer. They need to submit a ticket first.');
  await adminReplyApi(tid, message);
}
