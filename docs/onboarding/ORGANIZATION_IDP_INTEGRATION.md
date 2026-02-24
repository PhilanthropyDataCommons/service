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

## External Identity Providers

Before integrating, the PDC team needs to name an identifying alias for each
integrated system, for example `foundation-okta-oidc` or `foundation-okta-saml`,
to be used to link PDC Keycloak with the external IdP.

- [Okta](./external-idp/IDP_OKTA.md)
- [Google Workspace](./externap-idp/IDP_GOOGLE_WORKSPACE.md)
- [Microsoft Entra](./external-idp/IDP_MS_ENTRA.md)
