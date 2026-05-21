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
  phone?: string;
  dateOfBirth?: string;
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
    industry?: string;
    companySize?: string;
    jobTitle?: string;
    [key: string]: any;
  };
  reassigned?: boolean;
  reminderValue?: number;
  reminderUnit?: 'hours' | 'days';
  reminderAt?: any;
  reminderNotifiedAt?: any;
  productAsked?: string[];
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
  createdAt?: any;
  updatedAt?: any;
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

export type CampaignFormFieldType =
  | 'text'
  | 'textarea'
  | 'tel'
  | 'email'
  | 'number'
  | 'select';

export type CampaignFormField = {
  id: string;
  name: string;
  label: string;
  type: CampaignFormFieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[];
};

export type Campaign = {
  id: string;
  name: string;
  type: string;
  status: CampaignStatus;
  budget: number;
  budgetInterval?: 'Daily' | 'Weekly';
  description?: string;
  ownerId: string;
  teamspaceId: string;
  slug?: string;
  landingPath?: string;
  landingPageEnabled?: boolean;
  landingPageStatus?: 'draft' | 'live';
  locale?: 'hi' | 'en';
  templateKey?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  productName?: string;
  currentPrice?: number;
  originalPrice?: number;
  benefits?: string[];
  heroImageUrl?: string;
  productImageUrl?: string;
  secondaryImageUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  trustPoints?: string[];
  testimonials?: string[];
  formTitle?: string;
  formSubtitle?: string;
  formFields?: CampaignFormField[];
  createdAt?: any;
  updatedAt?: any;
};

export type CampaignLead = {
  id: string;
  campaignId: string;
  teamspaceId: string;
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  age?: string;
  painPoint?: string;
  customFields?: Record<string, any>;
  source: 'landing_page';
  importedToProspects?: boolean;
  importedLeadId?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type Meeting = {
  id: string;
  title: string;
  meetingDate?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  location?: string;
  attendees?: string[];
  attendeeIds?: string[];
  relatedToEntityId?: string;
  notes?: string;
  ownerId?: string;
  organizerId?: string;
  teamspaceId: string;
  createdAt?: any;
  updatedAt?: any;
};

export type TaskStatus = 'Todo' | 'In Progress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export type Task = {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: string | TaskPriority;
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

export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';

export type Quote = {
  id: string;
  ownerId: string;
  teamspaceId: string;
  contactId: string;
  name?: string;
  validUntil?: string;
  status?: string | QuoteStatus;
  total?: number;
  totalAmount?: number;
  lineItems?: any[];
  createdAt?: any;
  updatedAt?: any;
};

export type SalesOrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Completed' | 'Cancelled';

export type SalesOrder = {
  id: string;
  ownerId: string;
  teamspaceId: string;
  contactId: string;
  orderNumber?: string;
  orderDate?: string;
  status?: string | SalesOrderStatus;
  total?: number;
  totalAmount?: number;
  lineItems?: any[];
  createdAt?: any;
  updatedAt?: any;
};

export type PurchaseOrderStatus = 'Pending' | 'Ordered' | 'Received' | 'Cancelled';

export type PurchaseOrder = {
  id: string;
  ownerId: string;
  teamspaceId: string;
  orderNumber?: string;
  supplierName?: string;
  orderDate?: string;
  expectedDeliveryDate?: string;
  status?: string | PurchaseOrderStatus;
  total?: number;
  totalAmount?: number;
  lineItems?: any[];
  createdAt?: any;
  updatedAt?: any;
};

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Partially Paid' | 'Overdue' | 'Voided';

export type Invoice = {
  id: string;
  ownerId: string;
  teamspaceId: string;
  salesOrderId?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  status?: string | InvoiceStatus;
  total?: number;
  totalAmount?: number;
  paidAmount?: number;
  lineItems?: any[];
  createdAt?: any;
  updatedAt?: any;
};

export type TicketStatus = 'Open' | 'In Progress' | 'Awaiting Customer' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type Ticket = {
  id: string;
  teamspaceId: string;
  contactId?: string;
  assignedToId?: string;
  subject: string;
  description?: string;
  status?: string | TicketStatus;
  priority?: string | TicketPriority;
  category?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type RefundStatus = 'Pending' | 'Approved' | 'Rejected' | 'Processed' | 'Cancelled';

export type Refund = {
  id: string;
  teamspaceId: string;
  salesOrderId?: string;
  status: RefundStatus | string;
  amount?: number;
  reason?: string;
  requestedById?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type ComplaintStatus = 'Received' | 'Investigating' | 'Action Taken' | 'Resolved' | 'Closed';
export type ComplaintSeverity = 'Minor' | 'Moderate' | 'Major' | 'Critical';

export type Complaint = {
  id: string;
  teamspaceId: string;
  contactId?: string;
  assignedToId?: string;
  subject?: string;
  description?: string;
  status?: string | ComplaintStatus;
  severity?: ComplaintSeverity;
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
