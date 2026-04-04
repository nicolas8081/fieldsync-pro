import { Ticket } from '../types/portal';

/** Tickets that are still active in queues (hidden from admin / tech / customer home when “done”). */
export function isTicketOpen(t: Ticket): boolean {
  return t.status !== 'resolved' && t.status !== 'cancelled';
}

/** Resolved or cancelled — shown in admin “past” archive only. */
export function isTicketClosed(t: Ticket): boolean {
  return !isTicketOpen(t);
}
