# Permissions v2

This document describes the v2 permissions model for the Philanthropy Data Commons (PDC). The v2 model provides more granular control over entity-level permissions compared to the [v1 model](./PERMISSIONS.md).

> **Note**: This is an API-only implementation. The v2 permissions are not yet enforced on protected routes. Future work will apply these permissions to control access.

## Overview

The v2 permissions model introduces several key changes from v1:

| Aspect            | v1                                                                     | v2                                 |
| ----------------- | ---------------------------------------------------------------------- | ---------------------------------- |
| Permission scope  | Fixed per entity type (e.g., Funder grants access to all related data) | Granular via `entities` attribute  |
| Permission verbs  | view, edit, manage (+ create_proposal for Opportunity)                 | view, create, edit, delete, manage |
| Root entity types | Changemaker, Funder, DataProvider, Opportunity                         | Any entity type                    |
| Storage           | 8 separate tables                                                      | 2 unified tables                   |

### Key Concepts

- **Permission Grant**: A record that grants a specific permission verb on a root entity, with an `entities` attribute specifying which sub-entity types the permission applies to.
- **Root Entity**: The entity on which the permission is granted (e.g., a specific Funder or Changemaker).
- **Entities Attribute**: An array of entity types that the permission applies to (e.g., `["proposal", "proposalVersion"]`).
- **Permission Verb**: The action being granted (view, create, edit, delete, manage).

## Permission Verbs

| Verb     | Description                                         |
| -------- | --------------------------------------------------- |
| `view`   | Read access to entities                             |
| `create` | Ability to create new entities                      |
| `edit`   | Ability to modify existing entities                 |
| `delete` | Ability to remove entities                          |
| `manage` | Ability to grant/revoke permissions for other users |

## Entity Types

The following entity types can be used both as root entities and in the `entities` attribute:

| Entity Type            | Description                              |
| ---------------------- | ---------------------------------------- |
| `changemaker`          | Grant applicants/organizations           |
| `funder`               | Funding organizations                    |
| `dataProvider`         | External data sources                    |
| `opportunity`          | Funding opportunities/RFPs               |
| `proposal`             | Grant proposals                          |
| `proposalVersion`      | Versions of proposals                    |
| `applicationForm`      | Forms defining application fields        |
| `applicationFormField` | Individual fields in an application form |
| `proposalFieldValue`   | Values submitted for form fields         |
| `bulkUpload`           | Bulk data uploads                        |
| `source`               | Data provenance records                  |
| `outcome`              | Proposal outcomes                        |
| `baseField`            | Canonical field definitions              |
| `externalFieldValue`   | Externally-sourced field values          |

## API Endpoints

### User Permission Grants

Grant or revoke permissions for individual users.

#### Grant Permission

```http
PUT /users/{userKeycloakUserId}/{entityType}/{entityPk}/permissions/{permissionVerb}
Content-Type: application/json
Authorization: Bearer <token>

{
  "entities": ["proposal", "proposalVersion", "proposalFieldValue"],
  "notAfter": "2025-12-31T23:59:59Z"
}
```

**Path Parameters:**

- `userKeycloakUserId`: UUID of the user receiving the permission
- `entityType`: Type of the root entity (e.g., `funder`, `changemaker`)
- `entityPk`: Primary key of the root entity (e.g., `ExampleInc` for funder short code, `42` for changemaker ID)
- `permissionVerb`: Permission being granted (view, create, edit, delete, manage)

**Request Body:**

- `entities`: Array of entity types this permission applies to
- `notAfter` (optional): Expiration timestamp for the permission

**Response (201 Created):**

```json
{
	"id": 1,
	"userKeycloakUserId": "8f6e6dd9-d4af-45db-af50-712f7e962cd7",
	"permissionVerb": "view",
	"rootEntityType": "funder",
	"rootEntityPk": "ExampleInc",
	"entities": ["proposal", "proposalVersion", "proposalFieldValue"],
	"createdBy": "admin-user-uuid",
	"createdAt": "2025-01-05T12:00:00Z",
	"notAfter": "2025-12-31T23:59:59Z"
}
```

#### Revoke Permission

```http
DELETE /users/{userKeycloakUserId}/{entityType}/{entityPk}/permissions/{permissionVerb}
Authorization: Bearer <token>
```

**Response:** 204 No Content

#### List User Permissions

```http
GET /users/{userKeycloakUserId}/permissions
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
	"entries": [
		{
			"id": 1,
			"userKeycloakUserId": "8f6e6dd9-d4af-45db-af50-712f7e962cd7",
			"permissionVerb": "view",
			"rootEntityType": "funder",
			"rootEntityPk": "ExampleInc",
			"entities": ["proposal", "proposalVersion"],
			"createdBy": "admin-user-uuid",
			"createdAt": "2025-01-05T12:00:00Z",
			"notAfter": null
		}
	],
	"total": 1
}
```

### User Group Permission Grants

Grant or revoke permissions for all members of a Keycloak organization.

#### Grant Permission

```http
PUT /userGroups/{keycloakOrganizationId}/{entityType}/{entityPk}/permissions/{permissionVerb}
Content-Type: application/json
Authorization: Bearer <token>

{
  "entities": ["opportunity", "applicationForm"],
  "notAfter": null
}
```

**Path Parameters:**

- `keycloakOrganizationId`: UUID of the Keycloak organization
- `entityType`: Type of the root entity
- `entityPk`: Primary key of the root entity
- `permissionVerb`: Permission being granted

**Response (201 Created):**

```json
{
	"id": 1,
	"keycloakOrganizationId": "06e80ea0-32b7-4716-b031-95d701a88a2",
	"permissionVerb": "edit",
	"rootEntityType": "funder",
	"rootEntityPk": "ExampleInc",
	"entities": ["opportunity", "applicationForm"],
	"createdBy": "admin-user-uuid",
	"createdAt": "2025-01-05T12:00:00Z",
	"notAfter": null
}
```

#### Revoke Permission

```http
DELETE /userGroups/{keycloakOrganizationId}/{entityType}/{entityPk}/permissions/{permissionVerb}
Authorization: Bearer <token>
```

**Response:** 204 No Content

#### List User Group Permissions

```http
GET /userGroups/{keycloakOrganizationId}/permissions
Authorization: Bearer <token>
```

## Permission Expiration

Permissions can optionally include a `notAfter` timestamp. When set:

- The permission is valid until the specified time
- After expiration, the permission is no longer returned in queries
- Expired permissions are filtered out automatically

To create a non-expiring permission, set `notAfter` to `null` or omit it from the request body.

## Authorization

Currently, v2 permission endpoints require the `pdc-admin` role. This ensures only administrators can manage the new permission system during the initial rollout.

Future work may allow users with `manage` permission on an entity to grant sub-permissions to others.

## Example Use Cases

### Grant a funder staff member view access to proposals

```http
PUT /users/8f6e6dd9-d4af-45db-af50-712f7e962cd7/funder/ExampleInc/permissions/view
{
  "entities": ["proposal", "proposalVersion", "proposalFieldValue"]
}
```

This grants the user the ability to view proposals, their versions, and field values for the funder "ExampleInc".

### Grant an organization edit access to opportunities

```http
PUT /userGroups/06e80ea0-32b7-4716-b031-95d701a88a2/funder/ExampleInc/permissions/edit
{
  "entities": ["opportunity", "applicationForm", "applicationFormField"]
}
```

All members of the organization can now create and modify opportunities and application forms for "ExampleInc".

### Grant temporary access

```http
PUT /users/8f6e6dd9-d4af-45db-af50-712f7e962cd7/changemaker/42/permissions/view
{
  "entities": ["proposal", "proposalVersion"],
  "notAfter": "2025-06-30T23:59:59Z"
}
```

This grants view access that automatically expires at the end of June 2025.

## Migration from v1

The v1 permission endpoints remain functional but are marked as deprecated. Both v1 and v2 permissions can coexist. Future work will:

1. Implement permission enforcement for v2 permissions
2. Provide a migration path from v1 to v2
3. Eventually remove v1 endpoints

## Database Schema

The v2 permissions use two tables:

- `user_permission_grants` - Permissions granted to individual users
- `user_group_permission_grants` - Permissions granted to Keycloak organizations

Both tables include:

- `permission_verb` - The permission action (view, create, edit, delete, manage)
- `root_entity_type` - The type of entity the permission is on
- `root_entity_pk` - The primary key of the root entity (stored as text)
- `entities` - PostgreSQL text array of entity types
- `created_by` - UUID of the user who created the grant
- `created_at` - Timestamp of creation
- `not_after` - Optional expiration timestamp

## Related Documentation

- [Permissions v1](./PERMISSIONS.md) - Original permissions model (deprecated)
- [Entity Relationship Diagram](./ENTITY_RELATIONSHIP_DIAGRAM.md) - Database schema overview
