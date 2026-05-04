/** UUID string from Postgres `gen_random_uuid()` etc. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Short readable ticket reference from a UUID backend id (lists + headers stay scannable).
 * Non-matching ids are truncated lightly so demo / legacy strings still behave.
 */
export function formatTicketRef(id: string | null | undefined): string {
  if (id == null || typeof id !== 'string') return '—';
  const s = id.trim();
  if (!s) return '—';
  if (UUID_RE.test(s)) {
    return s.replace(/-/g, '').slice(0, 8).toUpperCase();
  }
  return s.length > 12 ? `${s.slice(0, 12)}…` : s;
}

/** “Ref · AB12CD34” for visible labels */
export function ticketRefLine(id: string | null | undefined): string {
  const r = formatTicketRef(id);
  return r === '—' ? 'Ticket' : `Ref · ${r}`;
}
