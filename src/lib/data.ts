import type { UserProfile, Teamspace, Deal, Product, InteractionLog, Account, Contact, Task, Campaign, Ticket } from '@/types';

// This file is now primarily for static data or data that will be phased out.
// User data is now managed via Firebase Auth and Firestore.

export const products: Product[] = [
  { id: 'prod-1', name: 'Arogya Ashwagandha', sku: 'ARO-ASH-001', category: 'Stress Relief', price: 24.99, stock: 150, imageUrl: 'https://picsum.photos/seed/product1/400/400' },
  { id: 'prod-2', name: 'Arogya Turmeric Max', sku: 'ARO-TUR-001', category: 'Anti-inflammatory', price: 29.99, stock: 200, imageUrl: 'https://picsum.photos/seed/product2/400/400' },
  { id: 'prod-3', name: 'Arogya Brahmi Oil', sku: 'ARO-BRA-001', category: 'Hair Care', price: 19.99, stock: 80, imageUrl: 'https://picsum.photos/seed/product3/400/400' },
  { id: 'prod-4', name: 'Arogya Triphala', sku: 'ARO-TRI-001', category: 'Digestion', price: 15.99, stock: 300, imageUrl: 'https://picsum.photos/seed/product4/400/400' },
  { id: 'prod-5', name: 'Arogya Chyawanprash', sku: 'ARO-CHY-001', category: 'Immunity', price: 34.99, stock: 120, imageUrl: 'https://picsum.photos/seed/product5/400/400' },
];

export const revenueData = [
  { month: 'Jan', revenue: 4000 }, { month: 'Feb', revenue: 3000 }, { month: 'Mar', revenue: 5000 },
  { month: 'Apr', revenue: 4500 }, { month: 'May', revenue: 6000 }, { month: 'Jun', revenue: 5500 },
  { month: 'Jul', revenue: 7000 }, { month: 'Aug', revenue: 6500 }, { month: 'Sep', revenue: 7500 },
  { month: 'Oct', revenue: 8000 }, { month: 'Nov', revenue: 9000 }, { month: 'Dec', revenue: 8500 },
];

// Mock data below will be replaced with Firestore data gradually.
export const deals: Deal[] = Array.from({ length: 10 }, (_, i) => ({
  id: `deal-${i + 1}`,
  title: `Deal with Company ${String.fromCharCode(65 + (i % 5))}`,
  value: (Math.floor(Math.random() * 20) + 5) * 1000,
  stage: (['New', 'Qualified', 'Demo', 'Negotiation', 'Won', 'Lost'] as const)[i % 6],
  contactName: `Lead User ${i + 1}`,
  closeDate: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
}));


export const interactionLogs: { [leadId: string]: InteractionLog[] } = {
  'lead-1': [
    { id: 'int-1-1', type: 'Email', date: '2024-05-10T10:00:00Z', notes: 'Sent initial outreach email with product catalog.', agent: 'Sales Exec' },
    { id: 'int-1-2', type: 'Call', date: '2024-05-12T14:30:00Z', notes: 'Follow-up call. Lead expressed interest in Ashwagandha supplements. Scheduled a demo.', agent: 'Sales Exec' },
    { id: 'int-1-3', type: 'Meeting', date: '2024-05-15T11:00:00Z', notes: 'Conducted product demo. Answered questions about sourcing and quality.', agent: 'Sales Exec' },
    { id: 'int-1-4', type: 'Note', date: '2024-05-15T12:00:00Z', notes: 'Lead is highly qualified. Preparing a quote.', agent: 'Sales Exec' },
  ],
  // ... other logs
};

export const contacts: Contact[] = Array.from({ length: 25 }, (_, i) => ({
    id: `contact-${i + 1}`,
    name: `Contact Person ${i + 1}`,
    email: `contact${i + 1}@example.com`,
    phone: `+1-202-555-01${(i < 10 ? '0' : '') + i}`,
    account: `Account ${String.fromCharCode(65 + (i % 5))}`,
    jobTitle: (['CEO', 'CTO', 'Sales Manager', 'Developer'])[i % 4],
    avatar: `https://picsum.photos/seed/contact${i}/100/100`,
}));

export const tasks: Task[] = Array.from({ length: 12 }, (_, i) => ({
  id: `task-${i + 1}`,
  title: `Task number ${i+1}`,
  status: (['Todo', 'In Progress', 'Done'] as const)[i % 3],
  dueDate: new Date(Date.now() + (i-5) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  assignedTo: 'Sales Exec',
}));

export const campaigns: Campaign[] = Array.from({ length: 8 }, (_, i) => ({
  id: `camp-${i + 1}`,
  name: `Campaign ${i + 1}`,
  status: (['Active', 'Completed', 'Planning', 'Cancelled'] as const)[i % 4],
  budget: (Math.floor(Math.random() * 10) + 2) * 500,
  startDate: new Date(Date.now() - (i * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate: new Date(Date.now() + ((15 - i) * 15) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  channel: (['Google Ads', 'Facebook', 'Email', 'Content Marketing'] as const)[i % 4],
}));

export const tickets: Ticket[] = Array.from({ length: 15 }, (_, i) => ({
    id: `ticket-${i + 1}`,
    subject: `Issue with order #${(i + 1) * 7}`,
    status: (['Open', 'In Progress', 'Closed'] as const)[i % 3],
    priority: (['Low', 'Medium', 'High', 'Urgent'] as const)[i % 4],
    customer: contacts[i % contacts.length].name,
    assignedTo: 'Support User',
    createdAt: new Date(Date.now() - i * 3 * 60 * 60 * 1000).toISOString().split('T')[0],
}));
