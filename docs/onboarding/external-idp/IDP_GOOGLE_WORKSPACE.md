# Google Workspace Configuration using SAML 2.0

As of this writing, Google Workspace seems to support SAML 2.0 and not OIDC.

## In Google Workspace

Via https://support.google.com/a/answer/6087519?sjid=14379173059534913826-NA#zippy=%2Cstep-add-the-custom-saml-app

1. Visit https://admin.google.com and log in as a super-administrator user.
2. Visit https://admin.google.com/ac/apps/unified
3. Click "Add App" -> "Add custom SAML app"
4. Set "App name" to `Philanthropy Data Commons`
5. Set "Description" to `Allows login to the PDC using this Google Workspace`
6. Set "App icon" to the PDC logo
7. Click "Continue"
8. Click "DOWNLOAD METADATA" and save the XML file
9. Click "Continue"

Send the metadata XML file to the person helping with integration.

## In PDC Keycloak

1. Visit the Keycloak admin console
2. In the PDC realm, visit "Identity providers"
3. Click "Add Identity Provider" of type "SAML v2.0." If none are present such
   that "Add Identity Provider" is not available, click "SAML v2.0" under "User
   defined"
4. Set the "Alias" to the descriptive, simple, unique alias named above, e.g.
   `foundation-google-saml`, **Important**: this alias sets the broker or
   "Single Sign-on URL" used by Google for integration and therefore must match
   the "Single Sign-on URL" configured in Google Workspace
5. Set "Use entity descriptor" to "Off"
6. Under "Import config from file" click "Browse"
7. Choose the metadata file downloaded from Google above
8. Ensure "NameID policy format" is set to "Email"
9. Ensure "Principal type" is set to "Subject NameID"
10. Set "Want Assertions signed" to "On"
11. Ensure "Validate signatures" is "On"
12. Set "Pass subject" to "On"
13. Set "Sync mode" to "Import"
14. Click "Save"
15. Visit the new Identity provider's Provider details
16. Write down the "Redirect URI" value and "Service provider entity ID" value
17. Click "Mappers" tab
18. Add a map from `firstName` to `firstName`:
    - Click "Add mapper"
    - Set "Name" to `Import First Name`
    - Leave "Sync mode override" as `Inherit`
    - Select `Attribute Importer` from the "Mapper type" dropdown menu
    - Set "Attribute Name" to `firstName` **Important:** this attribute name
      must match a "Name" set in Google "App attributes" for the import to work
    - Leave "Name Format" as `ATTRIBUTE_FORMAT_BASIC`
    - Select `firstName` from the "User Attribute Name" dropdown
    - Click "Save"
19. Add a map from `lastName` to `lastName`:
    - Click "Add mapper"
    - Set "Name" to `Import Last Name`
    - Leave "Sync mode override" as `Inherit`
    - Select `Attribute Importer` from the "Mapper type" dropdown menu
    - Set "Attribute Name" to `lastName` **Important:** this attribute name must
      match a "Name" set in Google "App attributes" for the import to work
    - Leave "Name Format" as `ATTRIBUTE_FORMAT_BASIC`
    - Select `lastName` from the "User Attribute Name" dropdown
    - Click "Save".

Send the following information to the organization integrating Google:

- PDC Keycloak's "Redirect URI" (to be Google's "ACS URL")
- PDC Keycloak's "Service provider entity ID" (to be Google's "Entity ID")

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

## In Google Workspace Again

1. Enter Keycloak's "Redirect URI" as Google's "ACS URL"
2. Enter Keycloak's "Service provider entity ID" as Google's "Entity ID"
3. Ensure "Signed response" is unchecked (assertions will still be signed)
4. Set "Name ID format" to `Email`
5. Set "Name ID" to `Basic Information > Primary email`
6. Click "Continue"
7. Under Attributes, click "Add Mapping"
8. Select "First name", set "App attributes" to `firstName` **Important:** this
   attribute name must match an "Attribute Name" set in Keycloak Mappers for the
   import to work.
9. Click "Add Mapping" again
10. Select "Last name", set "App attributes" to `lastName` **Important:** this
    attribute name must match an "Attribute Name" set in Keycloak Mappers for
    the import to work.
11. Click "Finish"

By default, User access is "OFF for everyone" so create a group for PDC access.

1. Click "Directory" on the leftmost menu
2. Click "Groups"
3. Click "Create group" or "CREATE A GROUP"
4. Set "Group name" to "PDC"
5. Set "Group email" to "pdc"
6. Set "Group description" to "Philanthropy Data Commons users"
7. Check "Security" to make it a security group to which you apply policies
8. Click "Next"
9. Set "Access type" to "Restricted"
10. Click "CREATE GROUP"

Add at least one member to the newly created PDC group.

1. From the PDC group, click "ADD MEMBERS"
2. Find and add a user by clicking "ADD TO GROUP"

Grant members of the PDC group access to log in to the PDC App.

1. Visit the ["Apps" area](https://admin.google.com/ac/apps/unified?journey=218)
2. Click the "Philanthropy Data Commons" app
3. Under "User access" click the inverted carat to expand "User access"
4. Under "Philanthropy Data Commons" click "Groups"
5. Click "Search for a group"
6. Click the "PDC" group
7. Under "Service status" click "ON"
8. Click "SAVE"
9. Visit the "Philanthropy Data Commons" app again
10. Verify that "User access" is "ON for 1 group", namely the "PDC" group

[Test the integration](../ORGANIZATION_IDP_INTEGRATION.md#to-test-an-integration)
