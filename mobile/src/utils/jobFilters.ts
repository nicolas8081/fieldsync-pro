import { Job } from '../types/job';

/** Jobs still shown on the technician job list (completed / cancelled are hidden). */
export function isJobActiveOnList(j: Job): boolean {
  return j.status !== 'completed' && j.status !== 'cancelled';
}
