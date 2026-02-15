export type UserRole =
  | 'admin'
  | 'sales_team_lead'
  | 'sales_executive'
  | 'marketer'
  | 'support';

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  teamspaceIds: string[];
};

export type Teamspace = {
  id: string;
  name: string;
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
  name: string;
  email: string;
  company: string;
  status: LeadStatus;
  source: string;
  assignedTo: string;
  lastContacted: string;
  score?: number;
  priority?: 'High' | 'Medium' | 'Low';
  reasoning?: string;
  engagementScore: number;
  leadSource: string;
  demographicData: {
    industry: string,
    companySize: string,
    jobTitle: string,
    country: string,
  },
  leadStatus: string,
  notes: string,
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
