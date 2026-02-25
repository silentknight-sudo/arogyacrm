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
  | 'Unqualified'
  | 'Converted';

export type Lead = {
  id: string;
  fullName: string;
  email?: string;
  phone: string;
  age?: number;
  status: LeadStatus;
  source?: string;
  assignedToId: string;
  teamspaceId: string;
  lastContacted?: string; // Should be a timestamp string
  score?: number;
  priority?: 'High' | 'Medium' | 'Low';
  reasoning?: string;
  productAsked?: string;
  // AI related fields - should match schema
  engagementScore?: number;
  demographicData?: {
    industry: string;
    companySize: string;
    jobTitle: string;
    country: string;
  };
  notes?: string;
  attributionFields?: string;
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
  description: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  createdAt: any;
  updatedAt: any;
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
  ownerId: string;
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


export type LineItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
export type Quote = {
  id: string;
  teamspaceId: string;
  name: string;
  accountId: string;
  contactId?: string;
  validUntil: string;
  status: QuoteStatus;
  totalAmount: number;
  lineItems: LineItem[];
  ownerId: string;
  createdAt: any;
  updatedAt: any;
};

export type SalesOrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Completed' | 'Cancelled';
export type SalesOrder = {
  id: string;
  teamspaceId: string;
  orderNumber: string;
  accountId: string;
  contactId?: string;
  orderDate: string;
  status: SalesOrderStatus;
  totalAmount: number;
  lineItems: LineItem[];
  quoteId?: string;
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
    lineItems: LineItem[];
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
    lineItems: LineItem[];
    ownerId: string;
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
    callerId: string; // User who made the call
    relatedToEntityType?: string;
    relatedToEntityId?: string;
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
    relatedToEntityType?: string;
    relatedToEntityId?: string;
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
    processedById?: string;
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
    relatedToEntityType?: string;
    relatedToEntityId?: string;
    createdAt: any;
    updatedAt: any;
};

// Represents a row from the CSV upload before it's converted to a full Lead object.
export type RawLead = {
  'Name': string;
  'Email address': string;
  'Phone': string;
  'Source': string;
  [key: string]: any; // Allow other fields from the CSV
};
