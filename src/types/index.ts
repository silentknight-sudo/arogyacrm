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
  createdBy?: string;
};

export type Teamspace = {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
};

export type LeadStatus =
  | 'new'
  | 'intrested'
  | 'CNP'
  | 'done'
  | 'not intrested';

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
  demographicData?: {
    country?: string;
    [key: string]: any;
  };
  reassigned?: boolean;
  reminderDays?: number;
  reminderAt?: any;
  reminderNotifiedAt?: any;
  createdAt: any;
  updatedAt: any;
};

export type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  email?: string;
  phone?: string;
  ownerId: string;
  teamspaceId: string;
  createdAt: any;
  updatedAt: any;
};

export type CallStatus = 'Completed' | 'No Answer' | 'Voicemail' | 'Busy';

export type CallType = 'Outbound' | 'Inbound';

export type Call = {
  id: string;
  subject: string;
  callDate: string;
  callDurationMinutes: number;
  callType: CallType;
  status: CallStatus;
  notes?: string;
  callerId: string;
  teamspaceId: string;
  relatedToEntityId?: string;
  relatedToEntityType?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type CampaignStatus = 'Planned' | 'Active' | 'Completed' | 'Paused' | 'Cancelled';

export type Campaign = {
  id: string;
  name: string;
  type: string;
  status: CampaignStatus;
  budget: number;
  startDate: string;
  endDate: string;
  description?: string;
  ownerId: string;
  teamspaceId: string;
  createdAt?: any;
  updatedAt?: any;
};

export type Meeting = {
  id: string;
  title: string;
  meetingDate: string;
  attendees?: string[];
  relatedToEntityId?: string;
  notes?: string;
  ownerId?: string;
  teamspaceId: string;
  createdAt?: any;
  updatedAt?: any;
};

export type TaskStatus = 'Todo' | 'In Progress' | 'Done';

export type Task = {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: string;
  status: TaskStatus;
  assignedToIds: string[];
  teamspaceId: string;
  createdAt?: any;
  updatedAt?: any;
};

export type Product = {
  id: string;
  name: string;
  sku?: string;
  imageUrl?: string;
  category?: string;
  price?: number;
  stock?: number;
  stockQuantity?: number;
  description?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type Quote = {
  id: string;
  ownerId: string;
  teamspaceId: string;
  contactId: string;
  status?: string;
  total?: number;
  createdAt?: any;
  updatedAt?: any;
};

export type SalesOrder = {
  id: string;
  ownerId: string;
  teamspaceId: string;
  contactId: string;
  orderNumber?: string;
  status?: string;
  total?: number;
  totalAmount?: number;
  lineItems?: any[];
  createdAt?: any;
  updatedAt?: any;
};

export type PurchaseOrder = {
  id: string;
  ownerId: string;
  teamspaceId: string;
  status?: string;
  total?: number;
  createdAt?: any;
  updatedAt?: any;
};

export type Invoice = {
  id: string;
  ownerId: string;
  teamspaceId: string;
  salesOrderId?: string;
  status?: string;
  total?: number;
  createdAt?: any;
  updatedAt?: any;
};

export type Ticket = {
  id: string;
  teamspaceId: string;
  contactId?: string;
  assignedToId?: string;
  subject: string;
  status?: string;
  priority?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type RefundStatus = 'Requested' | 'Approved' | 'Rejected' | 'Processed';

export type Refund = {
  id: string;
  teamspaceId: string;
  salesOrderId?: string;
  status: RefundStatus | string;
  amount?: number;
  reason?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type Complaint = {
  id: string;
  teamspaceId: string;
  contactId?: string;
  assignedToId?: string;
  subject?: string;
  status?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type InteractionLog = {
  id: string;
  type: string;
  date?: string;
  notes?: string;
  agent?: string;
  description?: string;
  createdAt?: any;
  createdBy?: string;
};

export type DealStage = 
  | 'new' 
  | 'intrested' 
  | 'not connect' 
  | 'CNP' 
  | 'done' 
  | 'not intrested';

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
  type: 'lead_assigned' | 'lead_reminder' | 'system';
  timestamp: string;
  read: boolean;
  link?: string;
};
