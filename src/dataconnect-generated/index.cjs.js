const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'studio',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const listAccountsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAccounts');
}
listAccountsRef.operationName = 'ListAccounts';
exports.listAccountsRef = listAccountsRef;

exports.listAccounts = function listAccounts(dc) {
  return executeQuery(listAccountsRef(dc));
};

const createContactRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateContact', inputVars);
}
createContactRef.operationName = 'CreateContact';
exports.createContactRef = createContactRef;

exports.createContact = function createContact(dcOrVars, vars) {
  return executeMutation(createContactRef(dcOrVars, vars));
};

const getMyOpportunitiesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyOpportunities');
}
getMyOpportunitiesRef.operationName = 'GetMyOpportunities';
exports.getMyOpportunitiesRef = getMyOpportunitiesRef;

exports.getMyOpportunities = function getMyOpportunities(dc) {
  return executeQuery(getMyOpportunitiesRef(dc));
};

const updateOpportunityStageRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateOpportunityStage', inputVars);
}
updateOpportunityStageRef.operationName = 'UpdateOpportunityStage';
exports.updateOpportunityStageRef = updateOpportunityStageRef;

exports.updateOpportunityStage = function updateOpportunityStage(dcOrVars, vars) {
  return executeMutation(updateOpportunityStageRef(dcOrVars, vars));
};
