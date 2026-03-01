import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'studio',
  location: 'us-east4'
};

export const listAccountsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAccounts');
}
listAccountsRef.operationName = 'ListAccounts';

export function listAccounts(dc) {
  return executeQuery(listAccountsRef(dc));
}

export const createContactRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateContact', inputVars);
}
createContactRef.operationName = 'CreateContact';

export function createContact(dcOrVars, vars) {
  return executeMutation(createContactRef(dcOrVars, vars));
}

export const getMyOpportunitiesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyOpportunities');
}
getMyOpportunitiesRef.operationName = 'GetMyOpportunities';

export function getMyOpportunities(dc) {
  return executeQuery(getMyOpportunitiesRef(dc));
}

export const updateOpportunityStageRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateOpportunityStage', inputVars);
}
updateOpportunityStageRef.operationName = 'UpdateOpportunityStage';

export function updateOpportunityStage(dcOrVars, vars) {
  return executeMutation(updateOpportunityStageRef(dcOrVars, vars));
}

