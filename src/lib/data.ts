import type { User, Teamspace, Lead, Deal, Product, InteractionLog, Account, Contact, Task } from '@/types';
import { format } from 'date-fns';

export const users: User[] = [
  {
    id: 'user-1',
    name: 'Admin User',
    email: 'admin@arogya.bio',
    avatar: 'https://picsum.photos/seed/admin/100/100',
    role: 'admin',
    teamspaceIds: ['ts-sales', 'ts-marketing', 'ts-support', 'ts-operations'],
  },
  {
    id: 'user-2',
    name: 'Sales Lead',
    email: 'sales.lead@arogya.bio',
    avatar: 'https://picsum.photos/seed/slead/100/100',
    role: 'sales_team_lead',
    teamspaceIds: ['ts-sales'],
  },
  {
    id: 'user-3',
    name: 'Sales Exec',
    email: 'sales.exec@arogya.bio',
    avatar: 'https://picsum.photos/seed/sexec/100/100',
    role: 'sales_executive',
    teamspaceIds: ['ts-sales'],
  },
  {
    id: 'user-4',
    name: 'Marketer User',
    email: 'marketer@arogya.bio',
    avatar: 'https://picsum.photos/seed/marketer/100/100',
    role: 'marketer',
    teamspaceIds: ['ts-marketing'],
  },
  {
    id: 'user-5',
    name: 'Support User',
    email: 'support@arogya.bio',
    avatar: 'https://picsum.photos/seed/support/100/100',
    role: 'support',
    teamspaceIds: ['ts-support'],
  },
];

export const teamspaces: Teamspace[] = [
  { id: 'ts-sales', name: 'Sales Teamspace', memberIds: ['user-1', 'user-2', 'user-3'] },
  { id: 'ts-marketing', name: 'Marketing Teamspace', memberIds: ['user-1', 'user-4'] },
  { id: 'ts-support', name: 'Support Teamspace', memberIds: ['user-1', 'user-5'] },
  { id: 'ts-operations', name: 'Operations Teamspace', memberIds: ['user-1'] },
];

export const leads: Lead[] = Array.from({ length: 20 }, (_, i) => ({
  id: `lead-${i + 1}`,
  name: `Lead User ${i + 1}`,
  email: `lead${i + 1}@example.com`,
  company: `Company ${String.fromCharCode(65 + (i % 5))}`,
  status: (['New', 'Contacted', 'Qualified', 'Lost'] as const)[i % 4],
  source: (['Website', 'Referral', 'Google Ads', 'Facebook'])[i % 4],
  assignedTo: users.find(u => u.role === 'sales_executive')?.name || 'Unassigned',
  lastContacted: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  engagementScore: Math.floor(Math.random() * 100),
  leadSource: (['Website', 'Google Ads', 'Referral'])[i % 3],
  demographicData: {
    industry: (['Healthcare', 'Wellness', 'Retail', 'Tech'])[i%4],
    companySize: (['1-10', '11-50', '51-200', '201+'])[i%4],
    jobTitle: (['Manager', 'Director', 'Owner', 'Consultant'])[i%4],
    country: (['USA', 'India', 'UK', 'Canada'])[i%4],
  },
  leadStatus: (['New', 'Contacted', 'Qualified'])[i%3],
  notes: 'Interested in bulk purchase of Ashwagandha supplements.'
}));

export const deals: Deal[] = Array.from({ length: 10 }, (_, i) => ({
  id: `deal-${i + 1}`,
  title: `Deal with Company ${String.fromCharCode(65 + (i % 5))}`,
  value: (Math.floor(Math.random() * 20) + 5) * 1000,
  stage: (['New', 'Qualified', 'Demo', 'Negotiation', 'Won', 'Lost'] as const)[i % 6],
  contactName: `Lead User ${i + 1}`,
  closeDate: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
}));

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

export const interactionLogs: { [leadId: string]: InteractionLog[] } = {
  'lead-1': [
    { id: 'int-1-1', type: 'Email', date: '2024-05-10T10:00:00Z', notes: 'Sent initial outreach email with product catalog.', agent: 'Sales Exec' },
    { id: 'int-1-2', type: 'Call', date: '2024-05-12T14:30:00Z', notes: 'Follow-up call. Lead expressed interest in Ashwagandha supplements. Scheduled a demo.', agent: 'Sales Exec' },
    { id: 'int-1-3', type: 'Meeting', date: '2024-05-15T11:00:00Z', notes: 'Conducted product demo. Answered questions about sourcing and quality.', agent: 'Sales Exec' },
    { id: 'int-1-4', type: 'Note', date: '2024-05-15T12:00:00Z', notes: 'Lead is highly qualified. Preparing a quote.', agent: 'Sales Exec' },
  ],
  'lead-2': [
    { id: 'int-2-1', type: 'Note', date: '2024-05-11T09:00:00Z', notes: 'Lead captured from website "Contact Us" form.', agent: 'System' },
    { id: 'int-2-2', type: 'Email', date: '2024-05-11T09:05:00Z', notes: 'Automated welcome email sent.', agent: 'System' },
    { id: 'int-2-3', type: 'Call', date: '2024-05-13T16:00:00Z', notes: 'Left a voicemail. No answer.', agent: 'Sales Exec' },
  ],
  'lead-3': [
    { id: 'int-3-1', type: 'Email', date: '2024-05-14T13:20:00Z', notes: 'Inquired about bulk pricing for Turmeric Max.', agent: 'Lead User 3' },
    { id: 'int-3-2', type: 'Email', date: '2024-05-14T13:45:00Z', notes: 'Responded with bulk pricing tiers and requested a call.', agent: 'Sales Exec' },
  ],
  'lead-4': [
     { id: 'int-4-1', type: 'Call', date: '2024-05-15T15:00:00Z', notes: 'Cold call. Lead was not interested at this time.', agent: 'Sales Exec' },
  ],
  'lead-5': [
    { id: 'int-5-1', type: 'Meeting', date: '2024-05-16T10:30:00Z', notes: 'Met at a trade show. Discussed partnership opportunities.', agent: 'Sales Lead' },
    { id: 'int-5-2', type: 'Note', date: '2024-05-16T11:30:00Z', notes: 'Follow up next week with a proposal.', agent: 'Sales Lead' },
  ],
};

export const accounts: Account[] = Array.from({ length: 15 }, (_, i) => ({
  id: `acc-${i + 1}`,
  name: `Account ${String.fromCharCode(65 + i)}`,
  industry: (['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing'])[i % 5],
  website: `account${i + 1}.com`,
  owner: users[1].name,
  employees: Math.floor(Math.random() * 500) + 10,
}));

export const contacts: Contact[] = Array.from({ length: 25 }, (_, i) => ({
    id: `contact-${i + 1}`,
    name: `Contact Person ${i + 1}`,
    email: `contact${i + 1}@example.com`,
    phone: `+1-202-555-01${(i < 10 ? '0' : '') + i}`,
    account: accounts[i % accounts.length].name,
    jobTitle: (['CEO', 'CTO', 'Sales Manager', 'Developer'])[i % 4],
    avatar: `https://picsum.photos/seed/contact${i}/100/100`,
}));

export const tasks: Task[] = Array.from({ length: 12 }, (_, i) => ({
  id: `task-${i + 1}`,
  title: `Task number ${i+1}`,
  status: (['Todo', 'In Progress', 'Done'] as const)[i % 3],
  dueDate: new Date(Date.now() + (i-5) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  assignedTo: users[Math.floor(Math.random() * users.length)].name,
}));
