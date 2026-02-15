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
    industry: string;
    companySize: string;
    jobTitle: string;
    country: string;
  };
  notes?: string;
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
  teamspaceId: string;
  name: string;
  amount: number;
  stage: DealStage;
  closeDate: string;
  accountId: string;
  contactId?: string;
  ownerId: string;
  createdAt: any;
  updatedAt: any;
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
  teamspaceId: string;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  address?: string;
  ownerId: string;
  createdAt?: any;
  updatedAt?: any;
};

export type Contact = {
  id: string;
  teamspaceId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  accountId: string;
  leadId?: string;
  createdAt: any;
  updatedAt: any;
  avatar?: string;
};

export type TaskStatus = 'Todo' | 'In Progress' | 'Done';

export type Task = {
  id: string;
  teamspaceId: string;
  title: string;
  description?: string;
  dueDate: string;
  status: TaskStatus;
  priority: 'Low' | 'Medium' | 'High';
  assignedToId: string;
  relatedToEntityType?: string;
  relatedToEntityId?: string;
  createdAt: any;
  updatedAt: any;
};

export type CampaignStatus = 'Planned' | 'Active' | 'Completed' | 'Paused' | 'Cancelled';

export type Campaign = {
  id: string;
  teamspaceId: string;
  name: string;
  type: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  budget: number;
  ownerId: string;
  description?: string;
  createdAt: any;
  updatedAt: any;
};

export type TicketStatus = 'Open' | 'In Progress' | 'Awaiting Customer' | 'Resolved' | 'Closed';

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type Ticket = {
  id: string;
  teamspaceId: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  contactId: string;
  assignedToId: string;
  category: string;
  createdAt: any;
  updatedAt: any;
};
