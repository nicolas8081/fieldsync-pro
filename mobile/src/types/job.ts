export interface Job {
  id: string;
  title: string;
  customer: string;
  address: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledAt: string;
  modelUrl?: string;
  description?: string;
}
