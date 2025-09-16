# Organization Onboarding Checklist

These steps should ensure a good user experience for organizations that are new
to the PDC.

## In the PDC Keycloak

These steps require Keycloak PDC realm administrative access.

- [ ] Add a human user from the organization to Keycloak
- [ ] Add an organization to Keycloak
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
- [ ] Add at least one (human) user to the organization in Keycloak

## In the PDC service

These steps require membership in the `pdc-admin` group.

- [ ] If the organization is a funder, add a funder
  - [ ] Follow existing naming conventions
  - [ ] Use the organization UUID from above here
  - [ ] Grant the Keycloak organization `view` permission on the funder
  - [ ] Grant a human from the organization `manage` permission on this
  - [ ] If it exists, grant the Keycloak service account `edit` permission
- [ ] If the organization is a changemaker, add a changemaker
  - [ ] Follow existing naming conventions
  - [ ] Use the organization UUID from above here
  - [ ] Grant the Keycloak organization `view` permission on the changemaker
  - [ ] Grant a human from the organization `manage` permission on this
  - [ ] If it exists, grant the Keycloak service account `edit` permission
- [ ] If the organization is a data platform provider, add a data provider
  - [ ] Follow existing naming conventions
  - [ ] Use the organization UUID from above here
  - [ ] Grant the Keycloak organization `view` permission on the provider
  - [ ] Grant a human from the organization `manage` permission on this
  - [ ] If it exists, grant the Keycloak service account `edit` permission
- [ ] If the organization works with other organizations, grant more permissions
  - [ ] Grant `view` permission to the organization for other funders
  - [ ] Grant `view` permission to the organization for other changemakers
  - [ ] Grant `view` permission to the organization for other data providers
