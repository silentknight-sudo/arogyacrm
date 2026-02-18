import type { InteractionLog } from '@/types';

// This file is now primarily for static data or data that will be phased out.
// Most data is now managed via Firebase Auth and Firestore.

export const revenueData = [
  { month: 'Jan', revenue: 4000 }, { month: 'Feb', revenue: 3000 }, { month: 'Mar', revenue: 5000 },
  { month: 'Apr', revenue: 4500 }, { month: 'May', revenue: 6000 }, { month: 'Jun', revenue: 5500 },
  { month: 'Jul', revenue: 7000 }, { month: 'Aug', revenue: 6500 }, { month: 'Sep', revenue: 7500 },
  { month: 'Oct', revenue: 8000 }, { month: 'Nov', revenue: 9000 }, { month: 'Dec', revenue: 8500 },
];

export const interactionLogs: { [leadId: string]: InteractionLog[] } = {
  'lead-1': [
    { id: 'int-1-1', type: 'Email', date: '2024-05-10T10:00:00Z', notes: 'Sent initial outreach email with product catalog.', agent: 'Sales Exec' },
    { id: 'int-1-2', type: 'Call', date: '2024-05-12T14:30:00Z', notes: 'Follow-up call. Lead expressed interest in Ashwagandha supplements. Scheduled a demo.', agent: 'Sales Exec' },
    { id: 'int-1-3', type: 'Meeting', date: '2024-05-15T11:00:00Z', notes: 'Conducted product demo. Answered questions about sourcing and quality.', agent: 'Sales Exec' },
    { id: 'int-1-4', type: 'Note', date: '2024-05-15T12:00:00Z', notes: 'Lead is highly qualified. Preparing a quote.', agent: 'Sales Exec' },
  ],
  // ... other logs
};

    