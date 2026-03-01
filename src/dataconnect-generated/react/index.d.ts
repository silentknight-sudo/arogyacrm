import { ListAccountsData, CreateContactData, CreateContactVariables, GetMyOpportunitiesData, UpdateOpportunityStageData, UpdateOpportunityStageVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useListAccounts(options?: useDataConnectQueryOptions<ListAccountsData>): UseDataConnectQueryResult<ListAccountsData, undefined>;
export function useListAccounts(dc: DataConnect, options?: useDataConnectQueryOptions<ListAccountsData>): UseDataConnectQueryResult<ListAccountsData, undefined>;

export function useCreateContact(options?: useDataConnectMutationOptions<CreateContactData, FirebaseError, CreateContactVariables>): UseDataConnectMutationResult<CreateContactData, CreateContactVariables>;
export function useCreateContact(dc: DataConnect, options?: useDataConnectMutationOptions<CreateContactData, FirebaseError, CreateContactVariables>): UseDataConnectMutationResult<CreateContactData, CreateContactVariables>;

export function useGetMyOpportunities(options?: useDataConnectQueryOptions<GetMyOpportunitiesData>): UseDataConnectQueryResult<GetMyOpportunitiesData, undefined>;
export function useGetMyOpportunities(dc: DataConnect, options?: useDataConnectQueryOptions<GetMyOpportunitiesData>): UseDataConnectQueryResult<GetMyOpportunitiesData, undefined>;

export function useUpdateOpportunityStage(options?: useDataConnectMutationOptions<UpdateOpportunityStageData, FirebaseError, UpdateOpportunityStageVariables>): UseDataConnectMutationResult<UpdateOpportunityStageData, UpdateOpportunityStageVariables>;
export function useUpdateOpportunityStage(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateOpportunityStageData, FirebaseError, UpdateOpportunityStageVariables>): UseDataConnectMutationResult<UpdateOpportunityStageData, UpdateOpportunityStageVariables>;
