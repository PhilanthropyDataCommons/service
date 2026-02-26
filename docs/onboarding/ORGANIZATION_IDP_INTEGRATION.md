# Organization Identity Provider Integration

The PDC uses Keycloak as an Identity Provider (IdP) and/or Service Provider.

Organizations such as funders, data providers, and changemakers that have their
own IdP can integrate with PDC using their own IdP for authentication while PDC
Keycloak and PDC handle authorization within PDC.

This guide lists specific steps to integrate specific IdPs with PDC Keycloak.

Integration requires a kind of three-way handshake between an organization admin
and a PDC admin before a user can log into PDC:

1. The organization admin configures a PDC app integration and sends information
   to the PDC admin
2. The PDC admin adds an organization integration and sends information to the
   organization admin
3. The organization admin finishes the PDC app integration.

Perform the steps during a live meeting between admins when practical.

For organizations without their own IdP, the PDC administrators can either
manage a Keycloak organization on their behalf (for smaller organizations) or
add a separate realm as an "external" IdP (for larger organizations). In the
latter case, the integration should be configured to allow an organization
member to manage user membership in that realm as if it were the organization's
own IdP. With a separate realm, the users will be "unmanaged" in the new realm
and "managed" in the `pdc` realm. As of this writing, these two options are
available in lieu of a future Keycloak release that includes Fine-Grained Admin
Permissions (FGAP) for the Keycloak organizations capability. When FGAP is
available for Keycloak organizations, the organization in the `pdc` realm should
be configured to allow an organization member to administer its organization,
and this should obsolete the first two options above.

## To Test an Integration

After creating an integration (below), test it using the following steps.

0. Make sure that the user is assigned to PDC within the external IdP
1. Visit the API docs
2. Click "Authorize"
3. Click "Authorize" on the "Available authorizations" modal
4. Enter an email address with the organization's domain
5. Verify that the browser is redirected to the correct IdP (outside PDC)
6. Authenticate (log in)
7. Verify that a redirect back (through Keycloak) to the PDC API docs occurs
8. Try an API call

# Keycloak Configuration

Before beginning, the PDC admin should configure the PDC realm to use organizations
and set up an organization.

See also this Keycloak Documentation:
https://www.keycloak.org/docs/26.2.5/server_admin/index.html#_managing_organizations

1. In the PDC realm, go to "Realm Settings"
2. Set "Organizations" to `On` (if not already enabled)
3. Set "Admin Permissions" to `On`
4. Click "Save"
5. Visit "Organizations"
6. Click "Create Organization" (if not already present):
   - Set "Name" to the long name of the organization, e.g. `My Foundation`
   - Set "Alias" to a short name of the organization, e.g. `myfoundation`
   - Set "Domain" to the organization's domain name, e.g. `myfoundation.org`
   - Optionally set "Redirect URL" to the API documentation URL
7. Click "Save".

## External Identity Providers

- [Okta via OIDC](./external-idp/IDP_OKTA_OIDC.md) (preferred over SAML)
- [Okta via SAML 2.0](./external-idp/IDP_OKTA_SAML.md)
- [Google Workspace](./external-idp/IDP_GOOGLE_WORKSPACE.md)
- [Microsoft Entra](./external-idp/IDP_MS_ENTRA.md)
