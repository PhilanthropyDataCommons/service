# Organization Onboarding Checklist

These steps should ensure a good user experience for organizations that are new
to the PDC. The intended audience is PDC administrators.

## In the PDC Keycloak

These steps require Keycloak PDC realm administrative access.

Use https://auth.philanthropydatacommons.org/admin to do these steps.

- [ ] Add a human from the organization to Keycloak users
- [ ] Add the organization to Keycloak organizations
  - [ ] Follow existing naming conventions
  - [ ] Note/copy the new organization UUID for use below
- [ ] If the organization has an IdP, do (./ORGANIZATION_IDP_INTEGRATION.md)
- [ ] If the organization will submit data using software, add a Keycloak client
  - [ ] Follow the `pdc-[org short name]-data-ingest` naming convention
  - [ ] Set "Client authentication" to "On"
  - [ ] Check "service accounts roles"
  - [ ] Uncheck all other Authentication flows
  - [ ] Save, click the "Service accounts roles" tab
  - [ ] Click the link following "To manage detail and group mappings, ..."
  - [ ] Set a First Name that includes the organization name
  - [ ] Set a Last Name of "Service Account"
  - [ ] Click "Save"
  - [ ] Click the "Organizations" tab
  - [ ] Join the service account user to the Keycloak organization
  - [ ] Note/copy the new service account user UUID for use below
  - [ ] Send the data integrator the client ID and secret
- [ ] Join at least one (human) Keycloak user to the Keycloak organization

## In the PDC service

These steps require membership in the `pdc-admin` group.

Use https://api.philanthropydatacommons.org to do these steps.

Use the organization UUID from above and follow existing naming conventions.

- [ ] If the organization is a funder, add a funder
  - [ ] Grant the Keycloak organization `view` permission on the funder
  - [ ] Grant a human from the organization `manage` permission on this
  - [ ] If it exists, grant the Keycloak service account `edit` permission
- [ ] If the organization is a changemaker, add a changemaker
  - [ ] Grant the Keycloak organization `view` permission on the changemaker
  - [ ] Grant a human from the organization `manage` permission on this
  - [ ] If it exists, grant the Keycloak service account `edit` permission
- [ ] If the organization is a data platform provider, add a data provider
  - [ ] Grant the Keycloak organization `view` permission on the provider
  - [ ] Grant a human from the organization `manage` permission on this
  - [ ] If it exists, grant the Keycloak service account `edit` permission
- [ ] If the organization works with other organizations, grant more permissions
  - [ ] Grant `view` permission to the organization for other funders
  - [ ] Grant `view` permission to the organization for other changemakers
  - [ ] Grant `view` permission to the organization for other data providers
