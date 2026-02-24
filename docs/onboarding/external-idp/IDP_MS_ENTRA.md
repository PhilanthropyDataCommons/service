# Microsoft Entra Configuration Using Built-in Microsoft Provider

Following https://www.keycloak.org/docs/26.5.2/server_admin/index.html#_microsoft

## In Microsoft Entra

From https://entra.microsoft.com/ perform the following steps.

1. Copy or save the Tenant ID
2. Visit "App registrations"
3. Click "New registration"
4. Set "Name" to `Philanthropy Data Commons`
5. Set "Who can use this application or access this API?" to "Accounts in this
   organizational directory only (Default Directory only - Single tenant)"
6. Click "Register"
7. Click "Certificates & secrets"
8. Under "Client secrets" click "New client secret"
9. Set "Description" to `PDC delegated authentication`
10. Set "Expires" to "730 days (24 months)"
11. Click "Add"
12. Copy or save the secret Value and Secret ID
13. Send Tenant ID, Application (client) ID, and secret Value to the PDC admin

Grant permission to PDC Keycloak to read user data from Microsoft.

1. Under "Manage" click "API Permissions"
2. Under "Microsoft Graph" to the right of "User.Read" click the ellipsis "..."
3. Under "Configured Permissions" click "Add a permission"
4. Click "Microsoft Graph"
5. Click "Delegated permissions"
6. Check "email", "openid", and "profile"
7. Click "Add permissions"
8. Click "Grant admin consent for Default Directory"

Restrict PDC access to specific users (or groups)

Following https://learn.microsoft.com/en-us/entra/identity-platform/howto-restrict-your-app-to-a-set-of-users

1. Click "Enterprise Apps" in the leftmost menu
2. Click "Philanthropy Data Commons" (this context differs from the above)
3. Under "Manage" click "Properties"
4. Set "Assignment required?" to "Yes"
5. Click "Save" (above the properties)
6. Under "Manage" click "Users and groups"
7. Click "Add user/group"
8. Under "Users" click "None Selected"
9. Check the users that should have access to PDC
10. Click "Select"
11. Click "Assign"

If your subscription permits, you may instead (of steps 8-9) create a PDC group,
assign users to that group, and then assign the group to the App.

## In Keycloak

1. Visit the Keycloak admin console
2. In the PDC realm, visit "Identity providers"
3. Click "Add provider"
4. Under "Social", click "Microsoft"
5. Set "Alias" to include the short name of the organization and `client`, for
   example `myfoundation-microsoft-entra-client`
6. Set the display name to include the full name of the organization, for
   example `My Foundation Microsoft Entra Client`
7. Set the "Client ID" to the value provided by the Entra admin (a UUID)
8. Set the "Client Secret" to the value provided by the Entra admin
9. Set "Prompt" to `login`
10. Set Tenant ID to the value provided by the Entra admin (a UUID)
11. Click "Add"

Under the newly created Identity provider,

1. Set "Scopes" to `openid profile email`
2. Set "Hide on login page" to "On"
3. Set "Show in Account console" to "When linked"
4. Set "Sync mode" to "Import"
5. Click "Save"
6. Copy or save the "Redirect URI" value
7. Send the Redirect URI to the Entra admin

Link the Organization to the newly created Identity provider:

1. Visit "Organizations"
2. Open the organization
3. Click the "Identity Providers" tab
4. Click "Link identity provider"
5. Select the IdP (created above) from the "Identity provider" dropdown menu
6. Select the organization's domain name from the "Domain" dropdown menu
7. Keep "Hide on login page" set to `On`
8. Set "Redirect when email domain matches" to `On`
9. Click "Save".

## In Microsoft Entra again

1. Visit "App registrations"
2. Click the "All applications" tab
3. Click "Philanthropy Data Commons"
4. Under "Redirect URIs" click "Add a Redirect URI"
5. Click "Add Redirect URI"
6. Click "Web"
7. Set "Redirect URI" to the value sent by the PDC admin
8. Ensure the "Implicit grant and hybrid flows" items are unchecked
9. Click "Configure"

[Test the integration](../ORGANIZATION_IDP_INTEGRATION.md#to-test-an-integration)
