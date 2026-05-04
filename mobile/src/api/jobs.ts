import { getApiBase } from '../config/api';
import { Job, DiagnosisItem } from '../types/job';

const MOCK_JOBS: Job[] = [
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

export async function fetchJobs(): Promise<Job[]> {
  try {
    const res = await fetch(`${getApiBase()}/api/jobs`);
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : data.jobs || [];
    }
  } catch {
    // Fallback to mock data when backend unavailable
  }
  return MOCK_JOBS;
}

export async function fetchJobById(id: string): Promise<Job | null> {
  try {
    const res = await fetch(`${getApiBase()}/api/jobs/${id}`);
    if (res.ok) return await res.json();
  } catch {
    // Fallback to mock
  }
  return MOCK_JOBS.find((j) => j.id === id) ?? null;
}

/** Mock AI diagnosis for job detail (Screen 7 style) */
export function getDiagnosisForJob(_jobId: string): DiagnosisItem[] {
  return [
    { issue: 'Drum Bearing Failure', confidence: 87, parts: ['DC97-16151A Bearing', 'Grease Kit'] },
    { issue: 'Door Boot Seal Tear', confidence: 64, parts: ['DC64-00802A Seal'] },
    { issue: 'Drain Pump Failure', confidence: 41 },
  ];
}
