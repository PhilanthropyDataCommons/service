# User Data Synchronization

PDC keeps a cached replica of the realm's users so applications can tell
which users still exist and can log in without calling Keycloak. A sync
refreshes that cache:

1. `POST /users/sync` with an `Authorization` header whose JWT carries the
   `view-users` or `manage-users` realm-management role. The response is a
   `userSyncTask` with status `pending`.
2. Poll `GET /users/sync/{userSyncTaskId}` until the status is `completed`
   or `failed`.

The sync lists the realm's users at the Keycloak Admin REST API using the
requester's own credentials, adds new users to the cache, updates names,
and sets `disabledAt` on users Keycloak reports as deleted or disabled
(rows are kept for referential integrity) while clearing it for users
Keycloak reports as enabled. The requester's `Authorization` header is stored only inside the
background-job payload, where it expires with the token.
