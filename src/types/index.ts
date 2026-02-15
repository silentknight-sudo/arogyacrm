export type UserRole =
  | 'admin'
  | 'sales_team_lead'
  | 'sales_executive'
  | 'marketer'
  | 'support';

export type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
  role: UserRole;
  teamspaceIds: string[];
};

export type Teamspace = {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
};

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Lost'
  | 'Unqualified';

export type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  status: LeadStatus;
  source: string;
  assignedToId: string;
  teamspaceId: string;
  lastContacted?: string; // Should be a timestamp string
  score?: number;
  priority?: 'High' | 'Medium' | 'Low';
  reasoning?: string;
  // AI related fields - should match schema
  engagementScore?: number;
  leadSource?: string;
  demographicData?: {
    industry: string,
    companySize: string,
    jobTitle: string,
    country: string,
  },
  notes?: string,
  createdAt: any; // serverTimestamp
  updatedAt: any; // serverTimestamp
};

export type InteractionLog = {
  id: string;
  type: 'Call' | 'Email' | 'Meeting' | 'Note';
  date: string;
  notes: string;
  agent: string;
};

export type DealStage =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Demo'
  | 'Negotiation'
  | 'Won'
  | 'Lost';

export type Deal = {
  id: string;
  title: string;
  value: number;
  stage: DealStage;
  contactName: string;
  closeDate: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
};

export type Account = {
  id: string;
  name: string;
  industry: string;
  website: string;
  owner: string;
  employees: number;
};

export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  account: string;
  jobTitle: string;
  avatar: string;
};

export type TaskStatus = 'Todo' | 'In Progress' | 'Done';

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: string;
  assignedTo: string;
};

export type CampaignStatus = 'Planning' | 'Active' | 'Completed' | 'Cancelled';

export type Campaign = {
  id: string;
  name: string;
  status: CampaignStatus;
  budget: number;
  startDate: string;
  endDate: string;
  channel: 'Google Ads' | 'Facebook' | 'Email' | 'Content Marketing';
};

export type TicketStatus = 'Open' | 'In Progress' | 'Closed';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type Ticket = {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  customer: string; // Contact name
  assignedTo: string; // User name
  createdAt: string;
};
