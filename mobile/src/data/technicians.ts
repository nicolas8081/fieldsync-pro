import { Technician } from '../types/portal';

export const MOCK_TECHNICIANS: Technician[] = [
  {
    id: 'tech-1',
    name: 'Marcus Thompson',
    email: 'marcus.demo@fieldsync.local',
    phone: '555-0101',
    specialty: 'Washers & dryers',
    available: true,
  },
  {
    id: 'tech-2',
    name: 'Elena Ruiz',
    email: 'elena.demo@fieldsync.local',
    phone: '555-0102',
    specialty: 'Dishwashers',
    available: true,
  },
  {
    id: 'tech-3',
    name: 'James Park',
    email: 'james.demo@fieldsync.local',
    phone: '555-0103',
    specialty: 'All appliances',
    available: false,
  },
];
