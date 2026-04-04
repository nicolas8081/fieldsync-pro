import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ticket, TicketStatus, SupportThreadMessage } from '../types/portal';
import { Job } from '../types/job';
import { MOCK_TECHNICIANS } from '../data/technicians';

const STORAGE_KEY = '@fieldsync_portal_data';

const BASE_JOBS: Job[] = [
  {
    id: '1',
    title: 'Washing machine repair - Drain issue',
    customer: 'Sarah K.',
    address: '342 Maple St',
    status: 'scheduled',
    scheduledAt: '2025-02-21T14:00:00Z',
    description: 'Samsung washer — leaking + banging noise',
    severity: 'high',
  },
  {
    id: '2',
    title: 'Dryer heating element replacement',
    customer: 'Bob Johnson',
    address: '88 Oak Avenue',
    status: 'scheduled',
    scheduledAt: '2025-02-21T16:30:00Z',
    description: 'GE dishwasher — not cleaning top rack',
    severity: 'med',
  },
  {
    id: '3',
    title: 'Dishwasher leak inspection',
    customer: 'Maria Garcia',
    address: '789 Elm Rd',
    status: 'completed',
    scheduledAt: '2025-02-19T10:00:00Z',
    description: 'Water pooling under unit.',
  },
];

type JobPatch = Partial<Pick<Job, 'status'>>;

type SupportThreadStored = {
  customerEmail: string;
  customerName: string;
  messages: SupportThreadMessage[];
  updatedAt: string;
};

type PersistShape = {
  tickets: Ticket[];
  extraJobs: Job[];
  jobPatches: Record<string, JobPatch>;
  supportThreads: Record<string, SupportThreadStored>;
};

type SupportInboxItem = {
  key: string;
  customerEmail: string;
  customerName: string;
  lastPreview: string;
  updatedAt: string;
};

type PortalDataContextValue = {
  technicians: typeof MOCK_TECHNICIANS;
  tickets: Ticket[];
  technicianJobs: Job[];
  createTicket: (input: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'assignedTechnicianId' | 'adminReplies' | 'linkedJobId'>) => Ticket;
  assignTechnician: (ticketId: string, technicianId: string) => void;
  addAdminReply: (ticketId: string, body: string) => void;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;
  setTechnicianJobStatus: (jobId: string, status: Job['status']) => void;
  removeTicketLinkedJob: (jobId: string) => void;
  findTicketForJobId: (jobId: string) => Ticket | undefined;
  getTicketsForCustomerEmail: (email: string) => Ticket[];
  getSupportMessagesForCustomer: (email: string) => SupportThreadMessage[];
  sendCustomerSupportMessage: (email: string, displayName: string, text: string) => void;
  sendAdminSupportMessage: (customerEmail: string, text: string) => void;
  getSupportInboxForAdmin: () => SupportInboxItem[];
};

const PortalDataContext = createContext<PortalDataContextValue | null>(null);

function ticketToJob(ticket: Ticket): Job {
  const id = ticket.linkedJobId || `job-${ticket.id}`;
  const scheduled = new Date();
  scheduled.setHours(scheduled.getHours() + 2);
  return {
    id,
    title: `Service — ${ticket.appliance}`,
    customer: ticket.customerName,
    address: ticket.customerAddress || 'Address on file',
    status: 'scheduled',
    scheduledAt: scheduled.toISOString(),
    description: ticket.problemDescription,
    severity: 'med',
  };
}

function linkedJobIdForTicket(t: Ticket): string {
  return t.linkedJobId ?? `job-${t.id}`;
}

function normalizeSupportEmail(email: string): string {
  const t = email.trim().toLowerCase();
  return t || 'unknown';
}

function defaultSupportWelcome(): SupportThreadMessage {
  return {
    id: 'welcome',
    author: 'admin',
    text: 'Hi — this is FieldSync support. Message us here and our team will reply.',
    at: new Date().toISOString(),
  };
}

export function PortalDataProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [extraJobs, setExtraJobs] = useState<Job[]>([]);
  const [jobPatches, setJobPatches] = useState<Record<string, JobPatch>>({});
  const [supportThreads, setSupportThreads] = useState<Record<string, SupportThreadStored>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const p = JSON.parse(raw) as PersistShape;
          if (Array.isArray(p.tickets)) setTickets(p.tickets);
          if (Array.isArray(p.extraJobs)) setExtraJobs(p.extraJobs);
          if (p.jobPatches && typeof p.jobPatches === 'object' && !Array.isArray(p.jobPatches)) {
            setJobPatches(p.jobPatches as Record<string, JobPatch>);
          }
          if (p.supportThreads && typeof p.supportThreads === 'object' && !Array.isArray(p.supportThreads)) {
            setSupportThreads(p.supportThreads as Record<string, SupportThreadStored>);
          }
        } catch {
          /* ignore */
        }
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: PersistShape = { tickets, extraJobs, jobPatches, supportThreads };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [tickets, extraJobs, jobPatches, supportThreads, hydrated]);

  const createTicket = useCallback(
    (input: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'assignedTechnicianId' | 'adminReplies' | 'linkedJobId'>) => {
      const t: Ticket = {
        ...input,
        id: `tkt-${Date.now()}`,
        status: 'new',
        createdAt: new Date().toISOString(),
        assignedTechnicianId: null,
        adminReplies: [],
        linkedJobId: null,
      };
      setTickets((prev) => [t, ...prev]);
      return t;
    },
    []
  );

  const assignTechnician = useCallback((ticketId: string, technicianId: string) => {
    const tech = MOCK_TECHNICIANS.find((x) => x.id === technicianId);
    if (!tech) return;
    let newJob: Job | null = null;
    setTickets((prev) => {
      const ticket = prev.find((t) => t.id === ticketId);
      if (!ticket) return prev;
      const linkedJobId = ticket.linkedJobId || `job-${ticket.id}`;
      const updated: Ticket = {
        ...ticket,
        assignedTechnicianId: technicianId,
        status: 'assigned',
        linkedJobId,
      };
      newJob = ticketToJob(updated);
      return prev.map((t) => (t.id === ticketId ? updated : t));
    });
    if (newJob) {
      setExtraJobs((jobs) => {
        const filtered = jobs.filter((j) => j.id !== newJob!.id);
        return [...filtered, newJob!];
      });
    }
  }, []);

  const addAdminReply = useCallback((ticketId: string, body: string) => {
    const reply = { id: `rep-${Date.now()}`, body: body.trim(), at: new Date().toISOString() };
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, adminReplies: [...t.adminReplies, reply], status: t.status === 'new' ? 'triaged' : t.status }
          : t
      )
    );
  }, []);

  const updateTicketStatus = useCallback((ticketId: string, status: TicketStatus) => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status } : t)));
  }, []);

  const findTicketForJobId = useCallback(
    (jobId: string) => tickets.find((t) => linkedJobIdForTicket(t) === jobId),
    [tickets]
  );

  const setTechnicianJobStatus = useCallback((jobId: string, status: Job['status']) => {
    setJobPatches((prev) => ({ ...prev, [jobId]: { ...prev[jobId], status } }));
    setTickets((prev) =>
      prev.map((t) => {
        if (linkedJobIdForTicket(t) !== jobId) return t;
        let nextStatus: TicketStatus = t.status;
        if (status === 'completed') nextStatus = 'resolved';
        else if (status === 'in_progress') nextStatus = 'in_progress';
        else if (status === 'scheduled') nextStatus = t.assignedTechnicianId ? 'assigned' : 'triaged';
        else if (status === 'cancelled') nextStatus = 'cancelled';
        return { ...t, status: nextStatus };
      })
    );
  }, []);

  const removeTicketLinkedJob = useCallback((jobId: string) => {
    setTickets((prev) => prev.filter((t) => linkedJobIdForTicket(t) !== jobId));
    setExtraJobs((prev) => prev.filter((j) => j.id !== jobId));
    setJobPatches((prev) => {
      const next = { ...prev };
      delete next[jobId];
      return next;
    });
  }, []);

  const technicianJobs = useMemo(() => {
    const byId = new Map<string, Job>();
    BASE_JOBS.forEach((j) => {
      const patch = jobPatches[j.id];
      byId.set(j.id, patch ? { ...j, ...patch } : { ...j });
    });
    extraJobs.forEach((j) => {
      const patch = jobPatches[j.id];
      byId.set(j.id, { ...j, ...patch });
    });
    // Tickets with an assigned tech always produce a queue row (fixes admin “assigned” vs missing job if storage desynced).
    tickets.forEach((t) => {
      if (!t.assignedTechnicianId) return;
      const jobId = linkedJobIdForTicket(t);
      if (byId.has(jobId)) return;
      const patch = jobPatches[jobId];
      const base = ticketToJob(t);
      byId.set(jobId, patch ? { ...base, ...patch } : base);
    });
    return Array.from(byId.values());
  }, [extraJobs, jobPatches, tickets]);

  const getTicketsForCustomerEmail = useCallback(
    (email: string) => tickets.filter((t) => t.customerEmail.toLowerCase() === email.trim().toLowerCase()),
    [tickets]
  );

  const getSupportMessagesForCustomer = useCallback(
    (email: string) => {
      const key = normalizeSupportEmail(email);
      const thread = supportThreads[key];
      return thread?.messages ?? [];
    },
    [supportThreads]
  );

  const sendCustomerSupportMessage = useCallback((email: string, displayName: string, text: string) => {
    const body = text.trim();
    if (!body) return;
    const key = normalizeSupportEmail(email);
    const msg: SupportThreadMessage = {
      id: `m-${Date.now()}`,
      author: 'customer',
      text: body,
      at: new Date().toISOString(),
    };
    setSupportThreads((prev) => {
      const existing = prev[key];
      if (!existing) {
        return {
          ...prev,
          [key]: {
            customerEmail: email.trim() || email,
            customerName: displayName.trim() || 'Customer',
            messages: [defaultSupportWelcome(), msg],
            updatedAt: msg.at,
          },
        };
      }
      return {
        ...prev,
        [key]: {
          ...existing,
          customerName: displayName.trim() || existing.customerName,
          messages: [...existing.messages, msg],
          updatedAt: msg.at,
        },
      };
    });
  }, []);

  const sendAdminSupportMessage = useCallback((customerEmail: string, text: string) => {
    const body = text.trim();
    if (!body) return;
    const key = normalizeSupportEmail(customerEmail);
    const msg: SupportThreadMessage = {
      id: `m-${Date.now()}`,
      author: 'admin',
      text: body,
      at: new Date().toISOString(),
    };
    setSupportThreads((prev) => {
      const existing = prev[key];
      if (!existing) {
        return {
          ...prev,
          [key]: {
            customerEmail: customerEmail.trim() || customerEmail,
            customerName: 'Customer',
            messages: [msg],
            updatedAt: msg.at,
          },
        };
      }
      return {
        ...prev,
        [key]: {
          ...existing,
          messages: [...existing.messages, msg],
          updatedAt: msg.at,
        },
      };
    });
  }, []);

  const getSupportInboxForAdmin = useCallback((): SupportInboxItem[] => {
    return Object.entries(supportThreads)
      .map(([key, t]) => {
        const last = t.messages[t.messages.length - 1];
        return {
          key,
          customerEmail: t.customerEmail,
          customerName: t.customerName,
          lastPreview: last ? last.text : '',
          updatedAt: t.updatedAt,
        };
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [supportThreads]);

  const value = useMemo<PortalDataContextValue>(
    () => ({
      technicians: MOCK_TECHNICIANS,
      tickets,
      technicianJobs,
      createTicket,
      assignTechnician,
      addAdminReply,
      updateTicketStatus,
      setTechnicianJobStatus,
      removeTicketLinkedJob,
      findTicketForJobId,
      getTicketsForCustomerEmail,
      getSupportMessagesForCustomer,
      sendCustomerSupportMessage,
      sendAdminSupportMessage,
      getSupportInboxForAdmin,
    }),
    [
      tickets,
      technicianJobs,
      createTicket,
      assignTechnician,
      addAdminReply,
      updateTicketStatus,
      setTechnicianJobStatus,
      removeTicketLinkedJob,
      findTicketForJobId,
      getTicketsForCustomerEmail,
      getSupportMessagesForCustomer,
      sendCustomerSupportMessage,
      sendAdminSupportMessage,
      getSupportInboxForAdmin,
    ]
  );

  return <PortalDataContext.Provider value={value}>{children}</PortalDataContext.Provider>;
}

export function usePortalData(): PortalDataContextValue {
  const ctx = useContext(PortalDataContext);
  if (!ctx) throw new Error('usePortalData must be used within PortalDataProvider');
  return ctx;
}

export function getBaseJobs(): Job[] {
  return BASE_JOBS;
}
