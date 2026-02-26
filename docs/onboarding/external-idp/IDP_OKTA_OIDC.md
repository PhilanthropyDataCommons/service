# Okta Configuration using OIDC (preferred over SAML)

[Click here if using SAML](./IDP_OKTA_SAML.md)

Log in to the admin area to Start an OIDC App Integration (these steps follow
https://help.okta.com/en-us/content/topics/apps/apps_app_integration_wizard_oidc.htm
with the insertion of group steps and appendage of access policy steps).

## Create a PDC Group

1. On the left nav bar, visit "Directory" -> "Groups"
2. Click "Add group"
3. Set "Name" to `PDC`
4. Set "Description" to `Users who may access the Philanthropy Data Commons`
5. Click "Save"
6. Click the newly created "PDC" group
7. Click "Assign people" and add at least one user.

## Create a PDC Application

1. On the left nav bar, visit "Applications" -> "Applications"
2. Click "Create App Integration"

   ![Create App Integration](./images/okta_create_app_integration.png)

3. Click "OIDC"
4. Select "Web Application"
5. Click "Next"
6. Add "App Name" of `Philanthropy Data Commons`
7. Leave "Proof of possession" unchecked
8. Set "Grant type" to `Authorization code` only
9. Set "Sign-in redirect URI" to the endpoint provided by the PDC team, similar
   to `https://example.org/realms/pdc/broker/foundation-okta-oidc/endpoint`
   **Important**: the name following `broker/` here needs to match the agreed
   alias mentioned above
10. Clear the "Sign-out redirect URIs" by clicking the X
11. Under "Assignments" select `Limit access to selected groups`
12. Set the "Selected group(s)" to the `PDC` group created earlier
13. Click "Save"
14. Confirm under "Login" that "Login initiated by" is `App Only`
15. Share the "Client ID" from "Client Credentials" with the PDC team
16. Under "Client Credentials" click "Edit"
17. Set "Client authentication" to `Public key / Private key`
18. Check "Require PKCE as additional verification"
19. Under "Public Keys" -> "Configuration", check "Use a URL to fetch keys..."
20. Set the URL to the JWKS URL of the PDC Keycloak server, provided by the PDC
    team, similar to
    `https://example.org/realms/pdc/protocol/openid-connect/certs`
21. Click "Save"
22. Click "Save" at an "Existing client secrets will no longer be used" warning.

## Create an Access Policy and Rule for the Authorization Server

1. On the left nav bar, visit "Security" -> "API" (way down there)
2. Click the desired Authorization Server name, usually "default"
3. Copy the "Metadata URI" value and send it to the PDC team
4. Click the "Access Policies" tab
5. Click "Add New Access Policy"
6. Set "Name" to `PDC`
7. Set "Description" to `Allow users to authenticate to PDC`
8. Set "Assign to" to `The following clients:`
9. Type `P` in the input box and then pick the "PDC" client created above
10. Click "Create Policy"
11. Under the new PDC policy, click "Add rule"
12. Set the "Rule Name" to `Issue tokens to users authenticating to PDC`
13. Reduce the token lifetimes such as to `5 minutes` (access) and `90 minutes`
14. Click "Create rule".

# PDC Keycloak configuration with Okta via OIDC

Add an OIDC Identity Provider to the PDC Realm.

See also this Keycloak documentation:
https://www.keycloak.org/docs/26.2.5/server_admin/index.html#_identity_broker_oidc

1. Visit "Identity Providers"
2. Click "Add Provider" of type "OpenID Connect v1.0." If no existing providers
   are present such that "Add Identity Provider" is not available, click "OpenID
   Connect v1.0" under "User defined"
3. Set the "Alias" to the descriptive, simple, unique alias named above, e.g.
   `foundation-okta-oidc`, **Important**: this alias sets the broker or
   "Single Sign-on URL" used by Okta for integration and therefore must match
   the "Single Sign-on URL" configured in Okta
4. Set the "Display name" to describe the organization that is herein linked
5. Under "OpenID Connect Settings" leave "Use discover endpoint" `On`
6. Set "Discovery endpoint" to the "Metadata URI" from Okta, similar to
   `https://example.org/oauth2/default/.well-known/oauth-authorization-server`
7. Set "Client authentication" to `JWT signed with private key`
8. Set "Client ID" to the "Client ID" from Okta, similar to
   `0oatc6chn9IXY0389697`
9. Leave "Client Secret" blank (it is not required due to using a keypair)
10. Leave "Client assertion signature algorithm" to `Algorithm not specified`
11. Leave "Client assertion audience" blank
12. Leave "Add X.509 Headers to the JWT" `Off`
13. Click "Add"
14. Under "OpenID Connect Settings", ensure "Validate Signatures" is `On`
15. Set "Use PKCE" to `On`
16. Set "PKCE Method" to `S256`
17. Expand "Advanced"
18. Set "Pass login_hint" to `On`
19. Set "Scopes" to `openid profile email`
20. Set "Trust Email" to `On`
21. Set "Hide on login page" to `On`
22. Set "Sync mode" to `Force`
23. Click "Save"
24. Click the "Mappers" tab
25. Click "Add mapper"
26. Set "Name" to `Import First Name From Profile Claim`
27. Set "Mapper type" to `Attribute Importer` (from the dropdown)
28. Set "Claim" to `profile`
29. Set "User Attribute Name" to `firstName` (from the dropdown)
30. Click "Save"
31. Click "Provider details" near the top to go back to the "Mappers" tab
32. Click "Add mapper"
33. Set "Name" to `Import Last Name From Profile Claim`
34. Set "Mapper type" to `Attribute Importer` (from the dropdown)
35. Set "Claim" to `profile`
36. Set "User Attribute Name" to `lastName` (from the dropdown)
37. Click "Save"
38. Click "Provider details" near the top to go back to the "Mappers" tab
39. Click "Add mapper"
40. Set "Name" to `Import Email Address From Email Claim`
41. Set "Mapper type" to `Attribute Importer` (from the dropdown)
42. Set "Claim" to `email`
43. Set "User Attribute Name" to `email` (from the dropdown)
44. Click "Save".

Link the newly added IdP to its corresponding organization.

See also this Keycloak documentation:
https://www.keycloak.org/docs/26.2.5/server_admin/index.html#_managing_identity_provider_

1. Visit "Organizations"
2. Open the organization
3. Click the "Identity Providers" tab
4. Click "Link identity provider"
5. Select the IdP (created above) from the "Identity provider" dropdown menu
6. Select the organization's domain name from the "Domain" dropdown menu
7. Keep "Hide on login page" set to `On`
8. Set "Redirect when email domain matches" to `On`
9. Click "Save".

[Test the integration](../ORGANIZATION_IDP_INTEGRATION.md#to-test-an-integration)
