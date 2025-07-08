# Keycloak Checklist

This is intended to be a comprehensive checklist of Keycloak configurations that
should be present to fully interoperate with the PDC service and external IdPs
as expected. It is intended to remind, not to detail setup of each item.

- [ ] Required action `.jar` file in `providers` directory (from `auth` project)
- [ ] SMS 2FA `.jar` file in `providers` directory (from `auth` project)
- [ ] Theme `.jar` file in `providers` directory (from `auth` project)
- [ ] A realm matching the PDC service env vars (rest is part of this realm)
- [ ] Authn Required Actions includes "Update mobile number" enabled
- [ ] Browser authn flow includes "TOTP or SMS" after passphrase
- [ ] SMS Authentication step in Browser authn flow has an alias
- [ ] SMS Authentication step also has SenderId "Philanthropy Data Commons"
- [ ] Custom Login theme enabled (realm Themes)
- [ ] Custom Email theme enabled (realm Themes)
- [ ] Use `pdc-` prefix on custom clients to distinguish from built-in clients
- [ ] `pdc-openapi-docs` client (service API docs use this)
- [ ] `pdc-admin` group
- [ ] `pdc-admin` role assigned to `pdc-admin` group
- [ ] `realm-management` `manage-users` role assigned to `pdc-admin` group
- [ ] `realm-management` `view-users` role assigned to `pdc-admin` group
- [ ] `realm-management` `query-users` role assigned to `pdc-admin` group
- [ ] At least one user assigned to `pdc-admin` group
- [ ] Organizations enabled
- [ ] Admin Permissions enabled in realm (aka Fine-grained Admin Permissions)
- [ ] Email as username enabled (realm Login, assists IdP domain-name matching)
- [ ] Login with email enabled (realm Login, assists IdP domain-name matching)
- [ ] Browser authn flow includes organization elements
- [ ] Broker first login authn flow includes organization elements
- [ ] `organizations` Client scope with `organizations` mapper (for JWT)
- [ ] All custom clients have `organizations` client scope assigned as default
