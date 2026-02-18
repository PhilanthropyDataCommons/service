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

See [permissions documentation](../PERMISSIONS.md) for how to grant permissions.

Permissions are granted via `POST /permissionGrants` with a JSON body specifying
`granteeType` (`user` or `userGroup`), context entity, `scope` (array), and
`verbs` (array). For example, to grant an organization `view` on a funder:

```json
{
	"verbs": ["view"],
	"funderShortCode": "funder_shortcode_goes_here",
	"scope": ["funder", "opportunity", "proposal", "proposalFieldValue"],
	"contextEntityType": "funder",
	"granteeType": "userGroup",
	"granteeKeycloakOrganizationId": "00000000-0000-0000-0000-aaaaaaaaaaa"
}
```

And an example of granting an individual several types of permissions on a
funder:

```json
{
	"verbs": ["view", "create", "edit", "delete"],
	"funderShortCode": "funder_shortcode_goes_here",
	"scope": ["funder", "opportunity", "proposal", "proposalFieldValue"],
	"contextEntityType": "funder",
	"granteeType": "user",
	"granteeUserKeycloakUserId": "00000000-0000-0000-0000-aaaaaaaaaaa"
}
```

- [ ] If the organization is a funder, add a funder
  - [ ] Grant the Keycloak organization verbs `["view"]` on the funder with
        scope `["funder", "opportunity", "proposal", "proposalFieldValue"]`
  - [ ] Grant a human from the organization verbs
        `["view", "create", "edit", "delete", "manage"]` on the funder with scope
        `["funder", "opportunity", "proposal", "proposalFieldValue"]`
  - [ ] If it exists, grant the Keycloak service account verbs
        `["view", "create", "edit", "delete"]` on the funder with scope
        `["funder", "opportunity", "proposal", "proposalFieldValue"]`
- [ ] If the organization is a changemaker, add a changemaker
  - [ ] Grant the Keycloak organization verbs `["view"]` on the changemaker
        with scope `["changemaker", "proposal", "proposalFieldValue"]`
  - [ ] Grant a human from the organization verbs
        `["view", "create", "edit", "delete", "manage"]` on the changemaker with
        scope `["changemaker", "proposal", "proposalFieldValue"]`
  - [ ] If it exists, grant the Keycloak service account verbs
        `["view", "create", "edit", "delete"]` on the changemaker with scope
        `["changemaker", "proposal", "proposalFieldValue"]`
- [ ] If the organization is a data platform provider, add a data provider
  - [ ] Grant the Keycloak organization verbs `["view"]` on the data provider
        with scope `["dataProvider"]`
  - [ ] Grant a human from the organization verbs
        `["view", "create", "edit", "delete", "manage"]` on the data provider with
        scope `["dataProvider"]`
  - [ ] If it exists, grant the Keycloak service account verbs
        `["view", "create", "edit", "delete"]` on the data provider with scope
        `["dataProvider"]`
- [ ] If the organization works with other organizations, grant more permissions
  - [ ] Grant verbs `["view"]` to the organization for other funders with scope
        `["funder", "opportunity", "proposal", "proposalFieldValue"]`
  - [ ] Grant verbs `["view"]` to the organization for other changemakers with
        scope `["changemaker", "proposal", "proposalFieldValue"]`
  - [ ] Grant verbs `["view"]` to the organization for other data providers
        with scope `["dataProvider"]`
