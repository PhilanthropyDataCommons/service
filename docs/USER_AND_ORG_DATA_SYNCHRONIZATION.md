# User and Org Data Synchronization

PDC keeps a cached replica of the realm's users, organizations, and
memberships so applications can tell which users still exist and can log
in, and which organizations exist, what they are named, and who belongs
to them, without calling Keycloak. A sync refreshes that cache:

1. `POST /users/sync` or `POST /organizations/sync` with an
   `Authorization` header whose JWT carries the realm-management roles
   Keycloak requires on the equivalent listings: `view-users` or
   `manage-users` for the user sync; `view-organizations`,
   `manage-organizations`, or `manage-realm`, plus `view-users` or
   `manage-users`, for the organization sync. The Admin REST API
   additionally requires tokens issued for a client holding the built-in
   `kc-admin-api` client scope. The response is a sync task with status
   `pending`.
2. Poll `GET /users/sync/{userSyncTaskId}` or
   `GET /organizations/sync/{organizationSyncTaskId}` until the status
   is `completed` or `failed`.

The sync lists the realm at the Keycloak Admin REST API using the
requester's own credentials and merges it into the `users`,
`organizations`, and `user_organization_memberships` tables. Rows
Keycloak reports as deleted, disabled, or removed get `disabledAt` set
instead of being deleted, keeping rows for referential integrity;
`disabledAt` clears once Keycloak reports the row live again (a user
login also clears it). The organization sync merges discovered members
into the `users` table, but only the user sync performs the realm-wide
disable sweep for users. The requester's `Authorization` header is
stored only inside the background-job payload, where it expires with
the token.
