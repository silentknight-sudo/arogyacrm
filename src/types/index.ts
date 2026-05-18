export type UserRole = 'admin' | 'sales_team_lead' | 'sales_executive' | 'marketer' | 'support';

export type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
  role: UserRole;
  teamspaceIds: string[];
  createdBy?: string;
};

export type Teamspace = {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
};

export type LeadStatus = 'new' | 'intrested' | 'CNP' | 'done' | 'not intrested';

export type Lead = {
  id: string;
  fullName: string;
  email?: string;
  phone: string;
  status: LeadStatus;
  source?: string;
  assignedToIds: string[];
  teamspaceId: string;
  metaLeadId?: string;
  reassigned?: boolean;
  productAsked?: string[];
  createdAt: any;
  updatedAt: any;
};

export type DealStage = 'new' | 'intrested' | 'not connect' | 'CNP' | 'done' | 'not intrested';

export type Deal = {
  id: string;
  teamspaceId: string;
  leadId?: string;
  teamLeadId?: string;
  name: string;
  amount: number;
  stage: DealStage;
  type: string;
  closeDate: string;
  contactId: string;
  ownerId: string;
  lineItems: any[];
  createdAt: any;
  updatedAt: any;
};

export type Notification = {
  id: string;
  title: string;
  description: string;
  type: 'lead_assigned' | 'system';
  timestamp: string;
  read: boolean;
  link?: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
};

export type Contact = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    teamspaceId: string;
    ownerId: string;
};