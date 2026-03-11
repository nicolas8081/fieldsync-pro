export interface Job {
  id: string;
  title: string;
  customer: string;
  address: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledAt: string;
  modelUrl?: string;
  description?: string;
  /** For dashboard display: high / med / low */
  severity?: 'high' | 'med' | 'low';
}

export interface DiagnosisItem {
  issue: string;
  confidence: number;
  parts?: string[];
}
