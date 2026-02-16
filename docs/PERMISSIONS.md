# Permissions

The Philanthropy Data Commons (PDC) uses [Keycloak] to manage users and groups.
Within the PDC service (not PDC Keycloak), permissions can be granted on data to
particular users and groups by reference to their respective Keycloak UUIDs.

Keycloak implements open standards for authentication and authorization such as
[OpenID Connect] which in turn uses a variety of other open standards. Much of
the terminology in this document comes from such standards or Keycloak and is
beyond the scope of this document. The focus of this document is to provide an
overview of data permissions within the PDC and how to grant or revoke such
permissions.

[Keycloak]: https://www.keycloak.org/documentation
[OpenID Connect]: https://openid.net/developers/how-connect-works/

## Example Workflow

This is a high level overview of a workflow whereby a changemaker gains the
ability to grant permissions on its data to other parties. Background details
and how to perform most of these steps follow in this document.

1. Funder bulk uploads changemakers and corresponding changemaker proposals.
2. One of the above changemakers requests access to the PDC.
3. PDC admin adds Keycloak organization for changemaker.
4. PDC admin [integrates the changemaker's IdP] or adds/updates users directly.
5. PDC admin links the new Keycloak organization to PDC service using its UUID.
6. PDC admin grants `manage` permission to changemaker using PDC service.
7. Changemaker may grant additional permissions using PDC service.

See also a [checklist to onboard organizations].

[integrates the changemaker's IdP]: ./onboarding/ORGANIZATION_IDP_INTEGRATION.md
[checklist to onboard organizations]: ./onboarding/ORGANIZATION_ONBOARDING_CHECKLIST.md

## Users and Their Keycloak UUIDs

Users log in to PDC via a PDC Keycloak instance styled in the PDC UI theme. A
user in Keycloak has a unique identifier, a UUID, associated. After login, the
user has a Bearer JSON Web Token (JWT) that when sent as part of the
Authorization header to the service allows the PDC to authenticate the user.
Part of this JWT is the "subject" or `sub` field with the value being the UUID.

For example, here is the relevant portion of a decoded JWT:

```json
  "sub": "8f6e6dd9-d4af-45db-af50-712f7e962cd7",
```

Users can find their IDs by logging in, making a request via the API docs page,
and finding then decoding the JWT (the word `Bearer` precedes the JWT).

Administrators of the PDC Keycloak realm can find any user's ID by logging into
the admin interface, visiting the PDC realm, selecting "Users", and selecting a
user. The UUID is shown both in the URL and in the ID field of the user page.

Within the PDC service, we usually refer to this UUID as the [`keycloakUserId`].

[`keycloakUserId`]: https://github.com/PhilanthropyDataCommons/service/blob/main/src/types/User.ts#L7

## How to Grant or Revoke PDC Data Permissions to Users

To grant or revoke permissions to users, `PUT` or `DELETE` on URLs starting with
`/users/` respectively. The `userKeycloakUserId` is the one to whom permission
is granted or revoked. The `permission` is the permission granted or revoked.
The `changemakerId`, `funderShortCode`, or `dataProviderShortCode` is the entity
whose data will be granted or revoked the permission.

For example, consider the following call:
`PUT /users/9f16a4e6-acfe-4048-82dd-d8a2d14effd0/funders/afund/permissions/edit`

PDC interprets this as "Grant the user `9f16a4e6-acfe-4048-82dd-d8a2d14effd0`
`edit` permission on objects belonging to funder `afund`."

## Groups and Their Keycloak UUIDs

Groups of PDC users are managed within Keycloak via the [Keycloak organizations]
capability. Like Keycloak users, Keycloak organizations are identified by UUID.
Assuming the (OAuth) Client used to log in requests the `organizations` scope,
group membership is shown within a user's JWT in the `organizations` section.
For the PDC UI and OpenAPI documentation that scope is configured by default.

For example, here is the relevant portion of a decoded JWT:

```json
  "organizations": {
    "ots": {
      "id": "04bef3db-421e-4611-a3da-75e7a270c3d5"
    }
  },
```

Users can see their Keycloak organizations by decoding their JWTs (again,
assuming the client they used to log in requests the `organizations` scope), or
by logging into the account management interface e.g. URL `realms/pdc/account`.

Administrators of the PDC Keycloak realm can see organizations, respective
organization UUIDs, and organization members by logging into the Keycloak admin
interface, visiting the PDC realm, selecting "Organizations", and selecting an
organization. The organization UUID appears in the URL.

[Keycloak organizations]: https://www.keycloak.org/docs/26.1.0/server_admin/index.html#_managing_organizations

## How to Link Keycloak Organizations to PDC Service Entities

After [creating an organization in Keycloak], the organization can be linked to
a changemaker, funder, or data provider in the PDC service. There may be many
changemakers in the PDC that need no corresponding Keycloak organization. There
may be changemakers posted to the PDC service prior to creation of a Keycloak
organization as well.

To link an organization to its corresponding changemaker, funder, or data
provider in the PDC service, set the `keycloakOrganizationId` field of the PDC
entity using its respective API call URL.

For example, to link PDC service changemaker with service ID `42` to its PDC
Keycloak organization with Keycloak UUID `06e80ea0-32b7-4716-b031-95d701a88a2`,
call `PATCH /changemakers/42` with a JSON body such as

```json
{
	"keycloakOrganizationId": "06e80ea0-32b7-4716-b031-95d701a88a2"
}
```

As of this writing, the link of a Keycloak organization to a PDC service entity
such as a changemaker is not programmatically used yet. It is anticipated that a
future user interface would benefit from this association. For example, in order
for changemaker C to grant permissions to funder F, it becomes straightforward
and less error-prone for the interface to allow selection of funder F (to look
up the Keycloak organization UUID) rather than the changemaker either needing
access to the Keycloak organization list or having to phone a friend to get it.
The link also serves as a kind of documentation for who has granted access to
whom. This can be useful in troubleshooting which UUIDs are specified within
permissions. A system design goal to note is keeping Keycloak focused on its
area of specialization, namely users and groups, while letting the PDC service
manage data and permissions with reference to Keycloak. To put it another way,
Keycloak can be unaware of the PDC service data while the PDC service can be
aware of Keycloak users and groups. This is further reason to link Keycloak
organizations and changemakers in the PDC service while leaving the association
out of Keycloak.

[creating an organization in Keycloak]: https://www.keycloak.org/docs/26.1.0/server_admin/index.html#creating-an-organization

## How to Grant or Revoke PDC Data Permissions to Members of a Group

To grant or revoke permissions to members of a group (a Keycloak organization),
`PUT` or `DELETE` on URLs starting with `/userGroups/` respectively. The
`keycloakOrganizationId` is the one to whose members permission is granted or
revoked. The `permission` is the permission granted or revoked. The
`changemakerId`, `funderShortCode`, or `dataProviderShortCode` is the entity
on whose data will be granted or revoked the permission.

For example, consider the following call:
`PUT /userGroups/06e80ea0-32b7-4716-b031-95d701a88a2/changemakers/42/permissions/manage`

PDC interprets this as "Grant members of the group
`06e80ea0-32b7-4716-b031-95d701a88a2` `manage` permission on objects belonging
to changemaker `42`." It may not be the case that changemaker 42 is the group
mentioned here, it may be that group `06e80ea0-32b7-4716-b031-95d701a88a2` is a
funder, data provider, or other changemaker entirely.

## Permission System Overview

The PDC permission system uses four concepts:

- **Grantee**: The user or group receiving the permission (identified by
  Keycloak UUID)
- **Context**: The entity the permission is granted against (e.g., "changemaker
  foo" or "funder bar")
- **Verb**: The action being permitted (see Available Verbs below)
- **Scope**: The type of data the permission enables access to (e.g.,
  `proposal`, `changemaker`)

### Available Verbs

The permission system supports the following verbs:

| Verb   | Description                                       |
| ------ | ------------------------------------------------- |
| view   | Read access to data                               |
| create | Create new data                                   |
| edit   | Modify existing data                              |
| delete | Delete data                                       |
| manage | Manage permission grants associated with the data |

Note: The current implementation uses `edit` for both creation and modification
operations in most contexts. This is a known semantic mismatch with the intended
meaning of the verb.

For example, "User X can view proposals of changemaker foo" breaks down as:

- Grantee: User X
- Verb: view
- Context: changemaker foo
- Scope: proposal

Currently, most enforced permissions use a scope that matches the context type
(e.g., funder context with funder scope). The data model supports more granular
grants where scope differs from context (e.g., opportunity context with proposal
scope), though not all combinations are currently enforced.

### Administrator Bypass

Users with the `pdc-admin` role in Keycloak automatically pass all permission
checks. This role grants full administrative access to the PDC service.

### Permission Grant Management

All CRUD operations on permission grants require the `pdc-admin` role.
Non-administrators cannot directly create, view, or delete permission grants
through the API.

## Implemented Permissions

The following sections describe permissions that are actually enforced by the
PDC service. While the data model supports additional context+verb+scope
combinations, only those listed below affect access control.

### Funder Permissions

Permissions granted against a funder (using the funder's `shortCode` as the
context key).

| Verb   | Scope              | What It Enables                                                   |
| ------ | ------------------ | ----------------------------------------------------------------- |
| view   | opportunity        | View the funder's opportunities                                   |
|        |                    | View application forms and fields for the funder's opportunities  |
|        |                    | View bulk upload tasks associated with the funder's opportunities |
| view   | proposal           | View proposals associated with the funder's opportunities         |
|        |                    | View proposal versions associated with the funder's opportunities |
|        |                    | View changemaker-proposal associations for the funder's proposals |
| view   | proposalFieldValue | View proposal field values for the funder's proposals             |
| create | opportunity        | Create opportunities for the funder                               |
| create | proposal           | Create proposals for the funder's opportunities                   |
|        |                    | Create bulk upload tasks for the funder's opportunities           |
| edit   | opportunity        | Create or update application forms and fields for the funder      |
| edit   | funder             | Create or update changemaker-proposal associations                |
|        |                    | Create sources associated with the funder                         |
| edit   | proposal           | Create or update proposal versions for the funder's proposals     |
| manage | funder             | View, send, and respond to funder collaborative invitations       |
|        |                    | View collaborative members for the funder                         |

### Changemaker Permissions

Permissions granted against a changemaker (using the changemaker's `id` as the
context key).

| Verb | Scope              | What It Enables                                                    |
| ---- | ------------------ | ------------------------------------------------------------------ |
| view | changemaker        | View changemaker field values for the changemaker                  |
| view | proposal           | View proposals associated with the changemaker                     |
|      |                    | View proposal versions associated with the changemaker             |
|      |                    | View changemaker-proposal associations for the changemaker         |
| view | proposalFieldValue | View proposal field values for the changemaker's proposals         |
| edit | changemaker        | Create or update changemaker field values                          |
|      |                    | Create sources associated with the changemaker                     |
| edit | proposal           | Create or update proposal versions for the changemaker's proposals |

### Opportunity Permissions

Permissions granted against an opportunity (using the opportunity's `id` as the
context key). Opportunity permissions inherit from the parent funder, so a
`create | proposal` grant on a funder automatically applies to all of that
funder's opportunities. Opportunity-level grants provide more granular control
for specific opportunities.

| Verb   | Scope              | What It Enables                                                        |
| ------ | ------------------ | ---------------------------------------------------------------------- |
| view   | opportunity        | View the specific opportunity                                          |
| view   | proposal           | View proposals associated with the opportunity                         |
|        |                    | View proposal versions for the opportunity's proposals                 |
|        |                    | View changemaker-proposal associations for the opportunity's proposals |
| view   | proposalFieldValue | View proposal field values for the opportunity's proposals             |
| create | proposal           | Create proposals for the specific opportunity                          |
|        |                    | Create bulk upload tasks for the specific opportunity                  |
| edit   | proposal           | Create or update proposal versions for the opportunity's proposals     |

### Proposal Permissions

Permissions granted directly against a proposal (using the proposal's `id` as
the context key). This provides the most granular access control for individual
proposals.

| Verb | Scope              | What It Enables                                         |
| ---- | ------------------ | ------------------------------------------------------- |
| view | proposal           | View the specific proposal                              |
|      |                    | View proposal versions for the proposal                 |
|      |                    | View changemaker-proposal associations for the proposal |
| view | proposalFieldValue | View proposal field values for the proposal             |
| edit | proposal           | Create or update proposal versions for the proposal     |

### ProposalFieldValue Permissions

Permissions to view proposal field values can be granted in two ways:

1. **Direct grants**: A `view | proposalFieldValue` permission can be granted
   directly on a proposal field value (using the field value's `id` as the
   context key). This provides the most granular control.

2. **Inherited grants**: The `proposalFieldValue` scope can be included in
   permissions granted at the proposal, opportunity, funder, or changemaker
   level. Users with such permissions can view field values for any proposals
   covered by that grant.

| Context     | Scope              | What It Enables                                        |
| ----------- | ------------------ | ------------------------------------------------------ |
| funder      | proposalFieldValue | View field values for all proposals under the funder   |
| changemaker | proposalFieldValue | View field values for all proposals of the changemaker |
| opportunity | proposalFieldValue | View field values for proposals in the opportunity     |
| proposal    | proposalFieldValue | View field values for the specific proposal            |

Note: Users who only have `view | proposal` scope (without `proposalFieldValue`)
can still view proposals but will see empty `fieldValues` arrays.

### Data Provider Permissions

Permissions granted against a data provider (using the data provider's
`shortCode` as the context key).

| Verb | Scope         | What It Enables                                  |
| ---- | ------------- | ------------------------------------------------ |
| edit | data_provider | Create sources associated with the data provider |

### Conditional Permissions

Permission grants can optionally include `conditions` that restrict which
entities the grant applies to based on entity data. When a grant has conditions,
it only applies to entities that match the specified criteria. Grants without
conditions (or with `conditions: null`) apply unconditionally, preserving
backward compatibility.

Conditions are keyed by scope entity type. Each condition specifies a `field`,
an `operator`, and a `value`:

- **field**: The entity data field to evaluate (currently only
  `baseFieldCategory` is supported)
- **operator**: `in` for array membership match
- **value**: An array of strings

For example, to grant a funder view access to only budget-related proposal field
values:

```json
{
	"granteeType": "user",
	"granteeUserKeycloakUserId": "550e8400-e29b-41d4-a716-446655440000",
	"contextEntityType": "funder",
	"funderShortCode": "examplefunder",
	"scope": ["proposalFieldValue"],
	"verbs": ["view"],
	"conditions": {
		"proposalFieldValue": {
			"field": "baseFieldCategory",
			"operator": "in",
			"value": ["budget", "project"]
		}
	}
}
```

This grant allows the user to view proposal field values only for base fields
categorized as `budget` or `project`. Field values in other categories (e.g.,
`organization`, `evaluation`) would not be visible through this grant.

Condition keys must be present in the grant's `scope` array. For instance, a
condition keyed on `proposalFieldValue` requires `proposalFieldValue` to be
included in the scope.

### Other Contexts

The permission system data model includes additional contexts (`proposalVersion`,
`applicationForm`, `applicationFormField`, `proposalFieldValue`, `source`,
`bulkUpload`, `changemakerFieldValue`) that can have permission grants created.
However, these contexts do not currently have permission checks enforced in the
codebase. Access to these entities is controlled through the parent entity
permissions described above (funder, changemaker, opportunity, or proposal).
