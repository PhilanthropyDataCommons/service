# Permissions v2

This document describes the v2 permissions model for the Philanthropy Data Commons (PDC). The v2 model provides more granular, entity-specific control over permissions compared to the [v1 model](./PERMISSIONS.md).

> **Note**: This is a work in progress. The v2 permissions are not yet enforced on protected routes.

## Overview

The v2 permissions model introduces:

- **Entity-specific routes** with proper primary key types for each entity
- **Constrained permission topology** that validates which child entities can be granted for each root entity
- **Granular permissions** down to the field value level

## Permission Verbs

| Verb     | Description                                         |
| -------- | --------------------------------------------------- |
| `view`   | Read access to entities                             |
| `create` | Ability to create new entities                      |
| `edit`   | Ability to modify existing entities                 |
| `delete` | Ability to remove entities                          |
| `manage` | Ability to grant/revoke permissions for other users |

## Entity Types

### Primary Key Types

Each entity type has a specific primary key type that is reflected in its API route:

| Entity Type             | PK Type             | Route Parameter Example    |
| ----------------------- | ------------------- | -------------------------- |
| `funder`                | string (short_code) | `:funderShortCode`         |
| `changemaker`           | integer             | `:changemakerId`           |
| `dataProvider`          | string (short_code) | `:dataProviderShortCode`   |
| `opportunity`           | integer             | `:opportunityId`           |
| `proposal`              | integer             | `:proposalId`              |
| `proposalVersion`       | integer             | `:proposalVersionId`       |
| `applicationForm`       | integer             | `:applicationFormId`       |
| `applicationFormField`  | integer             | `:applicationFormFieldId`  |
| `proposalFieldValue`    | integer             | `:proposalFieldValueId`    |
| `source`                | integer             | `:sourceId`                |
| `bulkUpload`            | integer             | `:bulkUploadId`            |
| `outcome`               | integer             | `:outcomeId`               |
| `changemakerFieldValue` | integer             | `:changemakerFieldValueId` |

**Note**: `baseField` is admin-only and not available as a permission root.

### Permission Topology

Each root entity type can only grant permissions on specific child entity types. This constraint is enforced when creating permission grants.

| Root Entity             | Valid Child Entities (`entities` array)                                                 |
| ----------------------- | --------------------------------------------------------------------------------------- |
| `funder`                | `opportunity`, `applicationForm`, `applicationFormField`, `source`, `bulkUpload`        |
| `changemaker`           | `proposal`, `proposalVersion`, `proposalFieldValue`, `changemakerFieldValue`, `outcome` |
| `dataProvider`          | `source`                                                                                |
| `opportunity`           | `applicationForm`, `applicationFormField`                                               |
| `proposal`              | `proposalVersion`, `proposalFieldValue`, `outcome`                                      |
| `proposalVersion`       | `proposalFieldValue`                                                                    |
| `applicationForm`       | `applicationFormField`                                                                  |
| `source`                | `bulkUpload`                                                                            |
| `applicationFormField`  | _(leaf entity - no children)_                                                           |
| `proposalFieldValue`    | _(leaf entity - no children)_                                                           |
| `bulkUpload`            | _(leaf entity - no children)_                                                           |
| `outcome`               | _(leaf entity - no children)_                                                           |
| `changemakerFieldValue` | _(leaf entity - no children)_                                                           |

## API Endpoints

### User Permission Grants

#### List User Permissions

```http
GET /users/:userKeycloakUserId/permissions
Authorization: Bearer <token>
```

#### Grant/Revoke Permission by Entity Type

Routes are entity-specific with proper PK types:

**Funder** (string short_code):

```http
PUT    /users/:userKeycloakUserId/permissions/funder/:funderShortCode/:permissionVerb
DELETE /users/:userKeycloakUserId/permissions/funder/:funderShortCode/:permissionVerb
```

**Changemaker** (integer id):

```http
PUT    /users/:userKeycloakUserId/permissions/changemaker/:changemakerId/:permissionVerb
DELETE /users/:userKeycloakUserId/permissions/changemaker/:changemakerId/:permissionVerb
```

**DataProvider** (string short_code):

```http
PUT    /users/:userKeycloakUserId/permissions/dataProvider/:dataProviderShortCode/:permissionVerb
DELETE /users/:userKeycloakUserId/permissions/dataProvider/:dataProviderShortCode/:permissionVerb
```

**Opportunity** (integer id):

```http
PUT    /users/:userKeycloakUserId/permissions/opportunity/:opportunityId/:permissionVerb
DELETE /users/:userKeycloakUserId/permissions/opportunity/:opportunityId/:permissionVerb
```

**Proposal** (integer id):

```http
PUT    /users/:userKeycloakUserId/permissions/proposal/:proposalId/:permissionVerb
DELETE /users/:userKeycloakUserId/permissions/proposal/:proposalId/:permissionVerb
```

**ProposalVersion** (integer id):

```http
PUT    /users/:userKeycloakUserId/permissions/proposalVersion/:proposalVersionId/:permissionVerb
DELETE /users/:userKeycloakUserId/permissions/proposalVersion/:proposalVersionId/:permissionVerb
```

**ApplicationForm** (integer id):

```http
PUT    /users/:userKeycloakUserId/permissions/applicationForm/:applicationFormId/:permissionVerb
DELETE /users/:userKeycloakUserId/permissions/applicationForm/:applicationFormId/:permissionVerb
```

**ApplicationFormField** (integer id):

```http
PUT    /users/:userKeycloakUserId/permissions/applicationFormField/:applicationFormFieldId/:permissionVerb
DELETE /users/:userKeycloakUserId/permissions/applicationFormField/:applicationFormFieldId/:permissionVerb
```

**ProposalFieldValue** (integer id):

```http
PUT    /users/:userKeycloakUserId/permissions/proposalFieldValue/:proposalFieldValueId/:permissionVerb
DELETE /users/:userKeycloakUserId/permissions/proposalFieldValue/:proposalFieldValueId/:permissionVerb
```

**Source** (integer id):

```http
PUT    /users/:userKeycloakUserId/permissions/source/:sourceId/:permissionVerb
DELETE /users/:userKeycloakUserId/permissions/source/:sourceId/:permissionVerb
```

**BulkUpload** (integer id):

```http
PUT    /users/:userKeycloakUserId/permissions/bulkUpload/:bulkUploadId/:permissionVerb
DELETE /users/:userKeycloakUserId/permissions/bulkUpload/:bulkUploadId/:permissionVerb
```

**Outcome** (integer id):

```http
PUT    /users/:userKeycloakUserId/permissions/outcome/:outcomeId/:permissionVerb
DELETE /users/:userKeycloakUserId/permissions/outcome/:outcomeId/:permissionVerb
```

**ChangemakerFieldValue** (integer id):

```http
PUT    /users/:userKeycloakUserId/permissions/changemakerFieldValue/:changemakerFieldValueId/:permissionVerb
DELETE /users/:userKeycloakUserId/permissions/changemakerFieldValue/:changemakerFieldValueId/:permissionVerb
```

### User Group Permission Grants

Same structure as user permissions, under `/userGroups/:keycloakOrganizationId/permissions/...`

```http
GET /userGroups/:keycloakOrganizationId/permissions
```

Example:

```http
PUT /userGroups/:keycloakOrganizationId/permissions/funder/:funderShortCode/:permissionVerb
```

## Request Format

### Grant Permission

```http
PUT /users/8f6e6dd9-d4af-45db-af50-712f7e962cd7/permissions/funder/ExampleInc/view
Content-Type: application/json
Authorization: Bearer <token>

{
  "entities": ["opportunity", "applicationForm"],
  "notAfter": "2025-12-31T23:59:59Z"
}
```

**Request Body:**

| Field      | Type            | Required | Description                                   |
| ---------- | --------------- | -------- | --------------------------------------------- |
| `entities` | string[]        | Yes      | Child entity types this permission applies to |
| `notAfter` | ISO 8601 string | No       | Expiration timestamp (null for no expiration) |

The `entities` array is validated against the permission topology. For a `funder` root, only `opportunity`, `applicationForm`, `applicationFormField`, `source`, and `bulkUpload` are valid.

### Response Format

```json
{
	"id": 1,
	"userKeycloakUserId": "8f6e6dd9-d4af-45db-af50-712f7e962cd7",
	"permissionVerb": "view",
	"rootEntityType": "funder",
	"rootEntityPk": "ExampleInc",
	"entities": ["opportunity", "applicationForm"],
	"createdBy": "admin-user-uuid",
	"createdAt": "2025-01-06T12:00:00Z",
	"notAfter": "2025-12-31T23:59:59Z"
}
```

## Example Use Cases

### Grant funder staff view access to proposals

```http
PUT /users/8f6e6dd9-d4af-45db-af50-712f7e962cd7/permissions/funder/ExampleInc/view
{
  "entities": ["opportunity", "applicationForm", "applicationFormField"]
}
```

### Grant changemaker edit access to their proposals

```http
PUT /users/8f6e6dd9-d4af-45db-af50-712f7e962cd7/permissions/changemaker/42/edit
{
  "entities": ["proposal", "proposalVersion", "proposalFieldValue"]
}
```

### Grant temporary view access

```http
PUT /users/8f6e6dd9-d4af-45db-af50-712f7e962cd7/permissions/opportunity/123/view
{
  "entities": ["applicationForm", "applicationFormField"],
  "notAfter": "2025-06-30T23:59:59Z"
}
```

### Grant permission on a specific proposal field value

```http
PUT /users/8f6e6dd9-d4af-45db-af50-712f7e962cd7/permissions/proposalFieldValue/456/view
{
  "entities": []
}
```

## Authorization

V2 permission endpoints require the `pdc-admin` role during the initial rollout. Future work may allow users with `manage` permission on an entity to grant sub-permissions to others.

## Migration from v1

The v1 permission endpoints remain functional. Future work will:

1. Implement full permission enforcement for v2 permissions
2. Provide a migration path from v1 to v2
3. Eventually deprecate v1 endpoints

## Related Documentation

- [Permissions v1](./PERMISSIONS.md) - Original permissions model
- [Entity Relationship Diagram](./ENTITY_RELATIONSHIP_DIAGRAM.md) - Database schema overview
