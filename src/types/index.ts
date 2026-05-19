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
  demographicData?: {
    country?: string;
    industry?: string;
    companySize?: string;
    jobTitle?: string;
  };
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

export type TaskStatus = 'Todo' | 'In Progress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export type Task = {
  id: string;
  teamspaceId: string;
  title: string;
  description?: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToIds: string[];
  createdAt: any;
  updatedAt: any;
};

export type Meeting = {
  id: string;
  teamspaceId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location: string;
  organizerId: string;
  attendeeIds: string[];
  createdAt: any;
  updatedAt: any;
};

export type CallStatus = 'Completed' | 'No Answer' | 'Voicemail' | 'Busy';
export type CallType = 'Outbound' | 'Inbound';

export type Call = {
  id: string;
  teamspaceId: string;
  subject: string;
  notes?: string;
  callDate: string;
  callDurationMinutes: number;
  callType: CallType;
  status: CallStatus;
  callerId: string;
  relatedToEntityId?: string;
  relatedToEntityType?: string;
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

export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';

export type Quote = {
  id: string;
  teamspaceId: string;
  name: string;
  contactId: string;
  validUntil: string;
  status: QuoteStatus;
  totalAmount: number;
  lineItems: any[];
  ownerId: string;
  createdAt: any;
  updatedAt: any;
};

export type SalesOrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Completed' | 'Cancelled';

export type SalesOrder = {
  id: string;
  teamspaceId: string;
  orderNumber: string;
  contactId: string;
  orderDate: string;
  status: SalesOrderStatus;
  totalAmount: number;
  lineItems: any[];
  ownerId: string;
  createdAt: any;
  updatedAt: any;
};

export type PurchaseOrderStatus = 'Pending' | 'Ordered' | 'Received' | 'Cancelled';

export type PurchaseOrder = {
  id: string;
  teamspaceId: string;
  orderNumber: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  lineItems: any[];
  ownerId: string;
  createdAt: any;
  updatedAt: any;
};

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Partially Paid' | 'Overdue' | 'Voided';

export type Invoice = {
  id: string;
  teamspaceId: string;
  invoiceNumber: string;
  salesOrderId: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  totalAmount: number;
  paidAmount: number;
  lineItems: any[];
  ownerId: string;
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

export type RefundStatus = 'Pending' | 'Approved' | 'Rejected' | 'Processed' | 'Cancelled';

export type Refund = {
  id: string;
  teamspaceId: string;
  salesOrderId: string;
  reason: string;
  amount: number;
  status: RefundStatus;
  requestedById: string;
  createdAt: any;
  updatedAt: any;
};

export type ComplaintStatus = 'Received' | 'Investigating' | 'Action Taken' | 'Resolved' | 'Closed';
export type ComplaintSeverity = 'Minor' | 'Moderate' | 'Major' | 'Critical';

export type Complaint = {
  id: string;
  teamspaceId: string;
  subject: string;
  description: string;
  status: ComplaintStatus;
  contactId: string;
  assignedToId: string;
  severity: ComplaintSeverity;
  createdAt: any;
  updatedAt: any;
};

export type InteractionLog = {
  id: string;
  type: string;
  date: string;
  notes: string;
  agent?: string;
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