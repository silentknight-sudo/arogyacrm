import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface Account_Key {
  id: UUIDString;
  __typename?: 'Account_Key';
}

export interface Contact_Key {
  id: UUIDString;
  __typename?: 'Contact_Key';
}

export interface CreateContactData {
  contact_insert: Contact_Key;
}

export interface CreateContactVariables {
  firstName: string;
  lastName: string;
  email: string;
  accountId: UUIDString;
}

export interface GetMyOpportunitiesData {
  opportunities: ({
    id: UUIDString;
    name: string;
    amount: number;
    stage: string;
    account: {
      name: string;
    };
      expectedCloseDate?: DateString | null;
  } & Opportunity_Key)[];
}

export interface Interaction_Key {
  id: UUIDString;
  __typename?: 'Interaction_Key';
}

export interface ListAccountsData {
  accounts: ({
    id: UUIDString;
    name: string;
    industry?: string | null;
    owner?: {
      id: UUIDString;
      firstName: string;
      lastName: string;
    } & User_Key;
  } & Account_Key)[];
}

export interface Opportunity_Key {
  id: UUIDString;
  __typename?: 'Opportunity_Key';
}

export interface UpdateOpportunityStageData {
  opportunity_update?: Opportunity_Key | null;
}

export interface UpdateOpportunityStageVariables {
  id: UUIDString;
  newStage: string;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

/** Generated Node Admin SDK operation action function for the 'ListAccounts' Query. Allow users to execute without passing in DataConnect. */
export function listAccounts(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListAccountsData>>;
/** Generated Node Admin SDK operation action function for the 'ListAccounts' Query. Allow users to pass in custom DataConnect instances. */
export function listAccounts(options?: OperationOptions): Promise<ExecuteOperationResponse<ListAccountsData>>;

/** Generated Node Admin SDK operation action function for the 'CreateContact' Mutation. Allow users to execute without passing in DataConnect. */
export function createContact(dc: DataConnect, vars: CreateContactVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateContactData>>;
/** Generated Node Admin SDK operation action function for the 'CreateContact' Mutation. Allow users to pass in custom DataConnect instances. */
export function createContact(vars: CreateContactVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateContactData>>;

/** Generated Node Admin SDK operation action function for the 'GetMyOpportunities' Query. Allow users to execute without passing in DataConnect. */
export function getMyOpportunities(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyOpportunitiesData>>;
/** Generated Node Admin SDK operation action function for the 'GetMyOpportunities' Query. Allow users to pass in custom DataConnect instances. */
export function getMyOpportunities(options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyOpportunitiesData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateOpportunityStage' Mutation. Allow users to execute without passing in DataConnect. */
export function updateOpportunityStage(dc: DataConnect, vars: UpdateOpportunityStageVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateOpportunityStageData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateOpportunityStage' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateOpportunityStage(vars: UpdateOpportunityStageVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateOpportunityStageData>>;

