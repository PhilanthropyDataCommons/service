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
4. PDC admin adds Keycloak users (if needed) for changemaker.
5. PDC admin sets Keycloak organization membership (if needed) for changemaker.
6. PDC admin links the new Keycloak organization to PDC service using its UUID.
7. PDC admin grants `manage` permission to changemaker using PDC service.
8. Changemaker may grant additional permissions using PDC service.

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

[`keycloakUserId`]: ../src/types/User.ts#L9

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
Assuming the (OAuth) Client used to log in requests the `organization:*` scope,
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
assuming the client they used to log in requests the `organization:*` scope), or
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

## Permission Descriptions

### Changemaker

#### Edit

- Allows users to create sources for the changemaker.

#### Manage

- Allows users to modify the permissions for the changemaker for other users and user groups.

#### View

- Allows users to view the proposal associations with the changemaker.
- Allows users to view proposals associated with the changemaker.

### Data Provider

#### Edit

- Allows users to create sources for the data provider.

#### Manage

- Allows users to modify the permissions for the data provider for other users and user groups.

### Funder

#### Edit

- Allows users to create new opportunities for the funder.
- Allows users to create new application forms for the funder's opportunities.
- Allows users to create new bulk uploads for the funder.
- Allows users to create sources for the funder.
- Allows users to create new proposals for the funder's opportunities.
- Allows users to create new changemaker relationships with proposals for the funder's opportunities.
- Allows users to create new proposal versions for proposals responding to the funder's opportunities.

#### Manage

- Allows users to modify the permissions for the funder for other users and user groups.

#### View

- Allows users to view the application forms associated with the funder's opportunities.
- Allows users to view the bulk uploads associated with the funder.
- Allows users to view the changemaker associations with any proposals associated with the funder's opportunities.
- Allows users to view proposals associated with the funder's opportunities
