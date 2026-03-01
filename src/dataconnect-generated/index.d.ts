import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

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

interface ListAccountsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAccountsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListAccountsData, undefined>;
  operationName: string;
}
export const listAccountsRef: ListAccountsRef;

export function listAccounts(): QueryPromise<ListAccountsData, undefined>;
export function listAccounts(dc: DataConnect): QueryPromise<ListAccountsData, undefined>;

interface CreateContactRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateContactVariables): MutationRef<CreateContactData, CreateContactVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateContactVariables): MutationRef<CreateContactData, CreateContactVariables>;
  operationName: string;
}
export const createContactRef: CreateContactRef;

export function createContact(vars: CreateContactVariables): MutationPromise<CreateContactData, CreateContactVariables>;
export function createContact(dc: DataConnect, vars: CreateContactVariables): MutationPromise<CreateContactData, CreateContactVariables>;

interface GetMyOpportunitiesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyOpportunitiesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyOpportunitiesData, undefined>;
  operationName: string;
}
export const getMyOpportunitiesRef: GetMyOpportunitiesRef;

export function getMyOpportunities(): QueryPromise<GetMyOpportunitiesData, undefined>;
export function getMyOpportunities(dc: DataConnect): QueryPromise<GetMyOpportunitiesData, undefined>;

interface UpdateOpportunityStageRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateOpportunityStageVariables): MutationRef<UpdateOpportunityStageData, UpdateOpportunityStageVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateOpportunityStageVariables): MutationRef<UpdateOpportunityStageData, UpdateOpportunityStageVariables>;
  operationName: string;
}
export const updateOpportunityStageRef: UpdateOpportunityStageRef;

export function updateOpportunityStage(vars: UpdateOpportunityStageVariables): MutationPromise<UpdateOpportunityStageData, UpdateOpportunityStageVariables>;
export function updateOpportunityStage(dc: DataConnect, vars: UpdateOpportunityStageVariables): MutationPromise<UpdateOpportunityStageData, UpdateOpportunityStageVariables>;

