import { Job } from '../types/job';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Washing machine repair - Drain issue',
    customer: 'Jane Smith',
    address: '123 Oak St, Apt 4B',
    status: 'scheduled',
    scheduledAt: '2025-02-21T09:00:00Z',
    modelUrl: 'https://example.com/models/washer.glb',
    description: 'Customer reports F21 error, water not draining.',
  },
  {
    id: '2',
    title: 'Dryer heating element replacement',
    customer: 'Bob Johnson',
    address: '456 Pine Ave',
    status: 'in_progress',
    scheduledAt: '2025-02-20T14:00:00Z',
    description: 'Dryer runs but no heat.',
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
    const res = await fetch(`${API_BASE}/api/jobs`);
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
    const res = await fetch(`${API_BASE}/api/jobs/${id}`);
    if (res.ok) return await res.json();
  } catch {
    // Fallback to mock
  }
  return MOCK_JOBS.find((j) => j.id === id) ?? null;
}
