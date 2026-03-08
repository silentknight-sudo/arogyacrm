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
  assignedToIds: string[];
  teamspaceId: string;
  lastContacted?: string;
  score?: number;
  priority?: 'High' | 'Medium' | 'Low';
  reasoning?: string;
  productAsked?: string;
  engagementScore?: number;
  demographicData?: {
    industry: string;
    companySize: string;
    jobTitle: string;
    country: string;
  };
  notes?: string;
  attributionFields?: string;
  createdAt: any;
  updatedAt: any;
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

export type LineItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
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