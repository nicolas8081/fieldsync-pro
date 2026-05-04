import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Ticket, TicketStatus } from '../types/portal';
import { Job } from '../types/job';
import type { SupportThreadMessage } from '../types/portal';
import {
  adminReplyApi,
  adminReplyForCustomerEmail,
  assignTicketApi,
  createTicketApi,
  customerReplyOnTicket,
  deleteTechnicianTicket,
  fetchAdminChatInbox,
  fetchAdminTechnicians,
  fetchAdminTickets,
  fetchCustomerSupportThread,
  fetchCustomerTickets,
  fetchTechnicianJobs,
  fetchTechnicianStats,
  findLatestTicketIdForCustomerEmail,
  jobStatusToBackend,
  mapBackendTicketToPortal,
  patchTechnicianTicket,
  type BackendTicket,
} from '../api/portalApi';
import { useAuth } from './AuthContext';

type JobPatch = Partial<Pick<Job, 'status'>>;

type SupportInboxItem = {
  key: string;
  customerEmail: string;
  customerName: string;
  lastPreview: string;
  updatedAt: string;
};

type PortalDataContextValue = {
  technicians: import('../types/portal').Technician[];
  tickets: Ticket[];
  technicianJobs: Job[];
  /** Server-side stats for technician dashboard (when logged in as technician with password). */
  technicianStats: { active: number; onSite: number; scheduled: number } | null;
  syncError: string | null;
  /** Reload lists from the API for the current role. */
  refreshPortal: () => Promise<void>;
  createTicket: (
    input: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'assignedTechnicianId' | 'adminReplies' | 'linkedJobId'>
  ) => Promise<Ticket>;
  assignTechnician: (ticketId: string, technicianId: string) => Promise<void>;
  addAdminReply: (ticketId: string, body: string) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  setTechnicianJobStatus: (jobId: string, status: Job['status']) => Promise<void>;
  removeTicketLinkedJob: (jobId: string) => Promise<void>;
  findTicketForJobId: (jobId: string) => Ticket | undefined;
  getTicketsForCustomerEmail: (email: string) => Ticket[];
  getSupportMessagesForCustomer: (email: string) => SupportThreadMessage[];
  /** Loads ticket-thread messages from the API into local cache. */
  refreshSupportThreadForCustomer: (email: string) => Promise<void>;
  sendCustomerSupportMessage: (email: string, displayName: string, text: string) => Promise<void>;
  sendAdminSupportMessage: (customerEmail: string, text: string) => Promise<void>;
  getSupportInboxForAdmin: () => SupportInboxItem[];
  resetPortalToDefaults: () => void;
};

const PortalDataContext = createContext<PortalDataContextValue | null>(null);

function normalizeSupportEmail(email: string): string {
  const t = email.trim().toLowerCase();
  return t || 'unknown';
}

export function PortalDataProvider({ children }: { children: React.ReactNode }) {
  const { user, updateSession } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<import('../types/portal').Technician[]>([]);
  const [technicianJobs, setTechnicianJobs] = useState<Job[]>([]);
  const [technicianStats, setTechnicianStats] = useState<{
    active: number;
    onSite: number;
    scheduled: number;
  } | null>(null);
  const [supportInbox, setSupportInbox] = useState<SupportInboxItem[]>([]);
  const [supportCache, setSupportCache] = useState<Record<string, SupportThreadMessage[]>>({});
  const [jobPatches] = useState<Record<string, JobPatch>>({});
  const [syncError, setSyncError] = useState<string | null>(null);

  const refreshPortal = useCallback(async () => {
    if (!user) {
      setTickets([]);
      setTechnicians([]);
      setTechnicianJobs([]);
      setTechnicianStats(null);
      setSupportInbox([]);
      return;
    }
    setSyncError(null);
    try {
      if (user.role === 'admin') {
        const [t, tech, inbox] = await Promise.all([
          fetchAdminTickets('all'),
          fetchAdminTechnicians(),
          fetchAdminChatInbox(),
        ]);
        setTickets(t);
        setTechnicians(tech);
        setSupportInbox(inbox);
      } else if (user.role === 'customer') {
        const cid = user.customerId;
        if (!cid) {
          setTickets([]);
          return;
        }
        const t = await fetchCustomerTickets(cid);
        setTickets(t);
        const msgs = await fetchCustomerSupportThread(cid);
        setSupportCache((prev) => ({ ...prev, [normalizeSupportEmail(user.email)]: msgs }));
      } else if (user.role === 'technician') {
        const pw = user.accountPassword;
        if (!pw) {
          setTechnicianJobs([]);
          setTechnicianStats(null);
          return;
        }
        const [jobs, stats] = await Promise.all([
          fetchTechnicianJobs(user.email, pw),
          fetchTechnicianStats(user.email, pw),
        ]);
        setTechnicianJobs(jobs);
        setTechnicianStats({
          active: stats.active_tasks,
          onSite: stats.on_site,
          scheduled: stats.scheduled,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not sync with server';
      setSyncError(msg);
    }
  }, [user]);

  useEffect(() => {
    void refreshPortal();
  }, [refreshPortal]);

  const resetPortalToDefaults = useCallback(() => {
    setTickets([]);
    setTechnicians([]);
    setTechnicianJobs([]);
    setTechnicianStats(null);
    setSupportInbox([]);
    setSupportCache({});
    setSyncError(null);
  }, []);

  const createTicket = useCallback(
    async (
      input: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'assignedTechnicianId' | 'adminReplies' | 'linkedJobId'>
    ): Promise<Ticket> => {
      const title = `${input.appliance.trim() || 'Appliance'} — service request`;
      const raw = (await createTicketApi({
        customer_email: input.customerEmail,
        customer_name: input.customerName,
        customer_phone: input.customerPhone,
        title,
        description: input.problemDescription,
        site_address: input.customerAddress,
      })) as BackendTicket;
      if (user?.role === 'customer') {
        updateSession({ customerId: raw.customer_id });
      }
      const mapped = mapBackendTicketToPortal(raw);
      await refreshPortal();
      return mapped;
    },
    [refreshPortal, updateSession, user?.role]
  );

  const assignTechnician = useCallback(
    async (ticketId: string, technicianId: string) => {
      await assignTicketApi(ticketId, technicianId);
      await refreshPortal();
    },
    [refreshPortal]
  );

  const addAdminReply = useCallback(
    async (ticketId: string, body: string) => {
      await adminReplyApi(ticketId, body);
      await refreshPortal();
    },
    [refreshPortal]
  );

  const updateTicketStatus = useCallback((_ticketId: string, _status: TicketStatus) => {
    /* Reserved — ticket status changes flow through technician PATCH or admin workflows */
  }, []);

  const findTicketForJobId = useCallback(
    (jobId: string) => tickets.find((t) => t.linkedJobId === jobId || t.id === jobId),
    [tickets]
  );

  const setTechnicianJobStatus = useCallback(
    async (jobId: string, status: Job['status']) => {
      const pw = user?.accountPassword;
      if (!user || user.role !== 'technician' || !pw) return;
      await patchTechnicianTicket(user.email, pw, jobId, jobStatusToBackend(status));
      await refreshPortal();
    },
    [refreshPortal, user]
  );

  const removeTicketLinkedJob = useCallback(
    async (jobId: string) => {
      const pw = user?.accountPassword;
      if (!user || user.role !== 'technician' || !pw) return;
      await deleteTechnicianTicket(user.email, pw, jobId);
      await refreshPortal();
    },
    [refreshPortal, user]
  );

  const getTicketsForCustomerEmail = useCallback(
    (email: string) =>
      tickets.filter((t) => t.customerEmail.toLowerCase() === email.trim().toLowerCase()),
    [tickets]
  );

  const getSupportMessagesForCustomer = useCallback(
    (email: string) => supportCache[normalizeSupportEmail(email)] ?? [],
    [supportCache]
  );

  const refreshSupportThreadForCustomer = useCallback(
    async (email: string) => {
      const cid = user?.customerId;
      if (!cid) return;
      const msgs = await fetchCustomerSupportThread(cid);
      setSupportCache((s) => ({ ...s, [normalizeSupportEmail(email)]: msgs }));
    },
    [user?.customerId]
  );

  const sendCustomerSupportMessage = useCallback(
    async (email: string, _displayName: string, text: string) => {
      const cid = user?.customerId;
      if (!cid) throw new Error('Missing customer profile. Submit a ticket first.');
      const tid = await findLatestTicketIdForCustomerEmail(email);
      if (!tid) throw new Error('Open a ticket from Home before messaging support.');
      await customerReplyOnTicket(cid, tid, text.trim());
      await refreshSupportThreadForCustomer(email);
    },
    [refreshSupportThreadForCustomer, user?.customerId]
  );

  const sendAdminSupportMessage = useCallback(
    async (customerEmail: string, text: string) => {
      await adminReplyForCustomerEmail(customerEmail, text.trim());
      const inbox = await fetchAdminChatInbox();
      setSupportInbox(inbox);
      await refreshPortal();
    },
    [refreshPortal]
  );

  const getSupportInboxForAdmin = useCallback(() => supportInbox, [supportInbox]);

  const technicianJobsMerged = useMemo(() => {
    const byId = new Map<string, Job>();
    technicianJobs.forEach((j) => {
      const patch = jobPatches[j.id];
      byId.set(j.id, patch ? { ...j, ...patch } : { ...j });
    });
    return Array.from(byId.values());
  }, [technicianJobs, jobPatches]);

  const value = useMemo<PortalDataContextValue>(
    () => ({
      technicians,
      tickets,
      technicianJobs: technicianJobsMerged,
      technicianStats,
      syncError,
      refreshPortal,
      createTicket,
      assignTechnician,
      addAdminReply,
      updateTicketStatus,
      setTechnicianJobStatus,
      removeTicketLinkedJob,
      findTicketForJobId,
      getTicketsForCustomerEmail,
      getSupportMessagesForCustomer,
      refreshSupportThreadForCustomer,
      sendCustomerSupportMessage,
      sendAdminSupportMessage,
      getSupportInboxForAdmin,
      resetPortalToDefaults,
    }),
    [
      technicians,
      tickets,
      technicianJobsMerged,
      technicianStats,
      syncError,
      refreshPortal,
      createTicket,
      assignTechnician,
      addAdminReply,
      updateTicketStatus,
      setTechnicianJobStatus,
      removeTicketLinkedJob,
      findTicketForJobId,
      getTicketsForCustomerEmail,
      getSupportMessagesForCustomer,
      refreshSupportThreadForCustomer,
      sendCustomerSupportMessage,
      sendAdminSupportMessage,
      getSupportInboxForAdmin,
      resetPortalToDefaults,
    ]
  );

  return <PortalDataContext.Provider value={value}>{children}</PortalDataContext.Provider>;
}

export function usePortalData(): PortalDataContextValue {
  const ctx = useContext(PortalDataContext);
  if (!ctx) throw new Error('usePortalData must be used within PortalDataProvider');
  return ctx;
}

/** @deprecated Mock helper — technician queue is API-backed */
export function getBaseJobs(): Job[] {
  return [];
}
