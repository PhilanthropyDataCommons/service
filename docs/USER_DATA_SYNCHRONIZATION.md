# User Data Synchronization

The PDC service keeps a cache of user existence and identity in its
`/users` endpoint. `POST /users/sync` kicks off an asynchronous task that
walks the whole realm's user list at the Keycloak Admin REST API and merges
it into the cache; `GET /users/sync/{userSyncTaskId}` polls the task. The
sync sets the `disabledAt` attribute for users that Keycloak reports as
deleted or not enabled instead of deleting them, so client applications can
distinguish live users from users that Keycloak has removed or disabled.
The sync does not disable users when the walk sees none at all, because the
requester's own valid token proves at least one user exists; sync runs are
serialized, so a run that starts while another holds the sync lock fails.

The sync endpoints mirror the authorization Keycloak itself applies to the
equivalent direct calls: a caller whose JWT carries any one of the Keycloak
`realm-management` roles `query-users`, `view-users`, or `manage-users` may
request a sync, because that is exactly the role set Keycloak accepts on the
`GET /admin/realms/{realm}/users` list call the sync performs. The task runs
with the requester's own credentials, passed through to Keycloak as-is; the
service holds no Keycloak credential of its own, the credentials are never
written to the audit log, and the background job carries them only in the
transient job payload. The payload is removed when the job completes; if the
service crashes mid-run, the next sync run marks the abandoned task rows
failed and removes the job rows that can no longer run. The
`userSyncTask` rows are audited at the row level, with their free-form
`details` payload excluded from the audit log.
