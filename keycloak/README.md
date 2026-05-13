# Keycloak dev/CI realm

A pre-configured `realm.json` is imported on first boot of `pdc-auth` (via `--import-realm`). It defines a Keycloak realm for dev/ci: a `pdc-admin` group/role, two users (`dev@pdc.local`, `user@pdc.local`), the `pdc-openapi-docs` public client, and the `pdc-dev-ingest` confidential client and its service-account user.

> [!WARNING]
> This is for development / CI use only. Passwords and client secrets in this file are stored in plaintext.

## Regenerating

Edit the live realm and re-export:

1. Bring up a clean stack:

   ```sh
   docker compose -f compose-ci.yml down --remove-orphans --volumes
   docker compose -f compose-ci.yml up -d --wait
   ```

2. Make changes via the admin UI at <http://localhost:8780> (`admin` / `admin`, then switch to the `pdc` realm) or `kcadm.sh` inside the `pdc-auth` container.

3. Export via the admin REST API. The `partial-export` endpoint covers the realm/clients/groups/roles and includes service-account users; regular users come from a separate `GET /admin/realms/pdc/users`.

   Merge them into one file, then:
   - For each regular user, add `credentials` (type `password`, set a plaintext password value, set `temporary: false`), `groups` (paths from `GET /users/{id}/groups`), and `realmRoles: [default-roles-pdc]`.
   - Replace the masked `pdc-dev-ingest` `secret` with a plaintext value (the export masks confidential-client secrets)
   - Strip `createdTimestamp` fields so Keycloak regenerates them on import. Leave `id` fields in place so diffs stay stable across re-exports.

4. Verify by tearing down volumes and booting fresh: login should work for affected users, and `pdc-dev-ingest` should still issue tokens with `client_secret=<password>`.

## Keycloak version alignment

Keycloak exports a specific version in the realm file. When bumping the image tag beyond minor versions, regenerate `realm.json` against the new version (see above) so the two stay aligned.
