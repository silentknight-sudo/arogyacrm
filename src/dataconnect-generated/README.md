# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListAccounts*](#listaccounts)
  - [*GetMyOpportunities*](#getmyopportunities)
- [**Mutations**](#mutations)
  - [*CreateContact*](#createcontact)
  - [*UpdateOpportunityStage*](#updateopportunitystage)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListAccounts
You can execute the `ListAccounts` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listAccounts(): QueryPromise<ListAccountsData, undefined>;

interface ListAccountsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAccountsData, undefined>;
}
export const listAccountsRef: ListAccountsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listAccounts(dc: DataConnect): QueryPromise<ListAccountsData, undefined>;

interface ListAccountsRef {
  ...
  (dc: DataConnect): QueryRef<ListAccountsData, undefined>;
}
export const listAccountsRef: ListAccountsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listAccountsRef:
```typescript
const name = listAccountsRef.operationName;
console.log(name);
```

### Variables
The `ListAccounts` query has no variables.
### Return Type
Recall that executing the `ListAccounts` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListAccountsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListAccounts`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listAccounts } from '@dataconnect/generated';


// Call the `listAccounts()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listAccounts();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listAccounts(dataConnect);

console.log(data.accounts);

// Or, you can use the `Promise` API.
listAccounts().then((response) => {
  const data = response.data;
  console.log(data.accounts);
});
```

### Using `ListAccounts`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listAccountsRef } from '@dataconnect/generated';


// Call the `listAccountsRef()` function to get a reference to the query.
const ref = listAccountsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listAccountsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.accounts);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.accounts);
});
```

## GetMyOpportunities
You can execute the `GetMyOpportunities` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMyOpportunities(): QueryPromise<GetMyOpportunitiesData, undefined>;

interface GetMyOpportunitiesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyOpportunitiesData, undefined>;
}
export const getMyOpportunitiesRef: GetMyOpportunitiesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMyOpportunities(dc: DataConnect): QueryPromise<GetMyOpportunitiesData, undefined>;

interface GetMyOpportunitiesRef {
  ...
  (dc: DataConnect): QueryRef<GetMyOpportunitiesData, undefined>;
}
export const getMyOpportunitiesRef: GetMyOpportunitiesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMyOpportunitiesRef:
```typescript
const name = getMyOpportunitiesRef.operationName;
console.log(name);
```

### Variables
The `GetMyOpportunities` query has no variables.
### Return Type
Recall that executing the `GetMyOpportunities` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMyOpportunitiesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetMyOpportunities`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMyOpportunities } from '@dataconnect/generated';


// Call the `getMyOpportunities()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMyOpportunities();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMyOpportunities(dataConnect);

console.log(data.opportunities);

// Or, you can use the `Promise` API.
getMyOpportunities().then((response) => {
  const data = response.data;
  console.log(data.opportunities);
});
```

### Using `GetMyOpportunities`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMyOpportunitiesRef } from '@dataconnect/generated';


// Call the `getMyOpportunitiesRef()` function to get a reference to the query.
const ref = getMyOpportunitiesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMyOpportunitiesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.opportunities);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.opportunities);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateContact
You can execute the `CreateContact` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createContact(vars: CreateContactVariables): MutationPromise<CreateContactData, CreateContactVariables>;

interface CreateContactRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateContactVariables): MutationRef<CreateContactData, CreateContactVariables>;
}
export const createContactRef: CreateContactRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createContact(dc: DataConnect, vars: CreateContactVariables): MutationPromise<CreateContactData, CreateContactVariables>;

interface CreateContactRef {
  ...
  (dc: DataConnect, vars: CreateContactVariables): MutationRef<CreateContactData, CreateContactVariables>;
}
export const createContactRef: CreateContactRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createContactRef:
```typescript
const name = createContactRef.operationName;
console.log(name);
```

### Variables
The `CreateContact` mutation requires an argument of type `CreateContactVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateContactVariables {
  firstName: string;
  lastName: string;
  email: string;
  accountId: UUIDString;
}
```
### Return Type
Recall that executing the `CreateContact` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateContactData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateContactData {
  contact_insert: Contact_Key;
}
```
### Using `CreateContact`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createContact, CreateContactVariables } from '@dataconnect/generated';

// The `CreateContact` mutation requires an argument of type `CreateContactVariables`:
const createContactVars: CreateContactVariables = {
  firstName: ..., 
  lastName: ..., 
  email: ..., 
  accountId: ..., 
};

// Call the `createContact()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createContact(createContactVars);
// Variables can be defined inline as well.
const { data } = await createContact({ firstName: ..., lastName: ..., email: ..., accountId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createContact(dataConnect, createContactVars);

console.log(data.contact_insert);

// Or, you can use the `Promise` API.
createContact(createContactVars).then((response) => {
  const data = response.data;
  console.log(data.contact_insert);
});
```

### Using `CreateContact`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createContactRef, CreateContactVariables } from '@dataconnect/generated';

// The `CreateContact` mutation requires an argument of type `CreateContactVariables`:
const createContactVars: CreateContactVariables = {
  firstName: ..., 
  lastName: ..., 
  email: ..., 
  accountId: ..., 
};

// Call the `createContactRef()` function to get a reference to the mutation.
const ref = createContactRef(createContactVars);
// Variables can be defined inline as well.
const ref = createContactRef({ firstName: ..., lastName: ..., email: ..., accountId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createContactRef(dataConnect, createContactVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.contact_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.contact_insert);
});
```

## UpdateOpportunityStage
You can execute the `UpdateOpportunityStage` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateOpportunityStage(vars: UpdateOpportunityStageVariables): MutationPromise<UpdateOpportunityStageData, UpdateOpportunityStageVariables>;

interface UpdateOpportunityStageRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateOpportunityStageVariables): MutationRef<UpdateOpportunityStageData, UpdateOpportunityStageVariables>;
}
export const updateOpportunityStageRef: UpdateOpportunityStageRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateOpportunityStage(dc: DataConnect, vars: UpdateOpportunityStageVariables): MutationPromise<UpdateOpportunityStageData, UpdateOpportunityStageVariables>;

interface UpdateOpportunityStageRef {
  ...
  (dc: DataConnect, vars: UpdateOpportunityStageVariables): MutationRef<UpdateOpportunityStageData, UpdateOpportunityStageVariables>;
}
export const updateOpportunityStageRef: UpdateOpportunityStageRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateOpportunityStageRef:
```typescript
const name = updateOpportunityStageRef.operationName;
console.log(name);
```

### Variables
The `UpdateOpportunityStage` mutation requires an argument of type `UpdateOpportunityStageVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateOpportunityStageVariables {
  id: UUIDString;
  newStage: string;
}
```
### Return Type
Recall that executing the `UpdateOpportunityStage` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateOpportunityStageData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateOpportunityStageData {
  opportunity_update?: Opportunity_Key | null;
}
```
### Using `UpdateOpportunityStage`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateOpportunityStage, UpdateOpportunityStageVariables } from '@dataconnect/generated';

// The `UpdateOpportunityStage` mutation requires an argument of type `UpdateOpportunityStageVariables`:
const updateOpportunityStageVars: UpdateOpportunityStageVariables = {
  id: ..., 
  newStage: ..., 
};

// Call the `updateOpportunityStage()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateOpportunityStage(updateOpportunityStageVars);
// Variables can be defined inline as well.
const { data } = await updateOpportunityStage({ id: ..., newStage: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateOpportunityStage(dataConnect, updateOpportunityStageVars);

console.log(data.opportunity_update);

// Or, you can use the `Promise` API.
updateOpportunityStage(updateOpportunityStageVars).then((response) => {
  const data = response.data;
  console.log(data.opportunity_update);
});
```

### Using `UpdateOpportunityStage`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateOpportunityStageRef, UpdateOpportunityStageVariables } from '@dataconnect/generated';

// The `UpdateOpportunityStage` mutation requires an argument of type `UpdateOpportunityStageVariables`:
const updateOpportunityStageVars: UpdateOpportunityStageVariables = {
  id: ..., 
  newStage: ..., 
};

// Call the `updateOpportunityStageRef()` function to get a reference to the mutation.
const ref = updateOpportunityStageRef(updateOpportunityStageVars);
// Variables can be defined inline as well.
const ref = updateOpportunityStageRef({ id: ..., newStage: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateOpportunityStageRef(dataConnect, updateOpportunityStageVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.opportunity_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.opportunity_update);
});
```

