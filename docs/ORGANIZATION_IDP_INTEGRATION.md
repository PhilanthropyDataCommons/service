# Organization Identity Provider Integration

The PDC uses Keycloak as an Identity Provider (IdP) and/or Service Provider.

Organizations such as funders, data providers, and changemakers that have their
own IdP can integrate with PDC using their own IdP for authentication while PDC
Keycloak and PDC handle authorization within PDC.

This guide lists specific steps to integrate specific IdPs with PDC Keycloak.

## External Identity Providers

Before integrating, the PDC team needs to name an identifying alias for each
integrated system, for example, `okta-saml-foundation`, to be used to link
PDC Keycloak with the external IdP.

### Okta Configuration using SAML 2.0

1. Log in to the admin area to Start a SAML App Integration (these steps follow
   https://help.okta.com/en-us/content/topics/apps/apps_app_integration_wizard_saml.htm
   ).
2. On the left nav bar, visit "Applications" -> "Applications"
3. Click "Create App Integration."

   ![Create App Integration](images/okta_create_app_integration.png)

4. Click "SAML 2.0."

   ![SAML 2.0](images/okta_create_a_new_app_integration_SAML.png)

5. Click "Next."
6. Add "App Name" of "Philanthropy Data Commons."
7. Click "Next."
8. Paste the Single sign-on URL endpoint provided by the PDC team, similar to
   "https://example.org/realms/pdc/broker/okta-saml-foundation/endpoint"
   into Okta's "Single sign-on URL"
9. Paste the SP Entity ID URL provided by the PDC team, similar to
   "https://example.org/realms/pdc" into Okta's "Audience URI (SP Entity ID)"
   field.
10. Set the "Name ID format" to "EmailAddress."
11. Set the "Application username" to "Email."
12. Add Attribute Statements:
    - Map "firstName", "Basic" to "user.FirstName"
    - Map "lastName", "Basic" to "user.LastName"

    ![Attribute Statements map](images/okta_attribute_statements.png)

13. Click "Next."
14. Click "Finish."
15. Send Okta's SAML "Metadata URL" to the PDC team.

    ![SAML Metadata URL](images/okta_metadata_url.png)

The PDC team will use this URL to configure an Identity Provider (IdP) within
PDC Keycloak and link it to a PDC Keycloak organization such that when users log
into PDC they will be redirected to their canonical IdP based on the domain name
in the email address. For example, entering "user@myfoundation.org" should
redirect the user to Okta. [Okta
configuration](https://help.okta.com/en-us/content/topics/users-groups-profiles/usgp-assign-apps.htm)
will determine whether a myfoundation user can log into the PDC. If
"user@myfoundation.org" has been assigned in Okta, then the Okta-configured
login procedure will be used for authentication, and if successful, the user will
be redirected to PDC Keycloak and be granted a valid PDC session.

## Keycloak Configuration

### PDC Keycloak Configuration with Okta via SAML 2.0

Configure the PDC realm to use organizations and set up an organization.

See also this Keycloak Documentation:
https://www.keycloak.org/docs/26.2.5/server_admin/index.html#_managing_organizations

1. In the PDC realm, go to "Realm Settings"
2. Set "Organizations" to "On" (if not already enabled).
3. Set "Admin Permissions" to "On."
4. Click "Save."
5. Visit "Organizations"
6. Click "Create Organization" (if not already present):
   - Set "Name" to the long name of the organization, e.g. "My Foundation"
   - Set "Alias" to a short name of the organization, e.g. "myfoundation"
   - Set "Domain" to the organization's domain name, e.g. "myfoundation.org"
   - Optionally set "Redirect URL" to the API documentation URL.
7. Click "Save."

Add a SAML Identity Provider to the PDC Realm.

See also this Keycloak documentation:
https://www.keycloak.org/docs/26.2.5/server_admin/index.html#_client-saml-configuration

8. Visit "Identity Providers".
9. Click "Add Identity Provider" of type "SAML v2.0." If none are present such
   that "Add Identity Provider" is not available, click "SAML v2.0" under "User
   defined."
10. Set the "Alias" to the descriptive, simple, unique alias named above, e.g.
    "okta-saml-foundation", **Important**: this alias sets the broker or
    "Single Sign-on URL" used by Okta for integration and therefore must match
    the "Single Sign-on URL" configured in Okta.
11. Set the "SAML entity descriptor" to the URL sent from the person who
    configured Okta. In Okta this is called the "Metadata URL."
12. Verify that the "NameID policy format" is "Email" (if not, contact the person
    who configured Okta to correct the Okta configuration, refer to Okta's step
    11).
13. Set the "Principal type" to "Subject NameID".
14. Set "Want AuthnRequests signed" to "On."
15. Set "Want Assertions signed" to "On."
16. Set "Validate Signatures" to "On."
17. Set "Sign service provider metadata" to "On."
18. Set "Pass subject" to "On."
19. Set "Hide on login page" to "On."
20. Set "Sync mode" to "Force."
21. Click "Save."
22. Click the "Mappers" tab on the Identity Provider.
23. Add a map from `firstName` to `firstName`:
    - Click "Add mapper"
    - Set "Name" to "Import First Name"
    - Leave "Sync mode override" at "Inherit"
    - Select "Attribute Importer" from the "Mapper type" dropdown menu
    - Set "Attribute Name" to "firstName" **Important:** This attribute name
      must match a "Name" set in Okta "Attribute Statements (optional)" for the
      import to work.
    - Leave "Name Format" as "ATTRIBUTE_FORMAT_BASIC"
    - Select "firstName" from the "User Attribute Name" dropdown
    - Click "Save."
24. Add a map from `lastName` to `lastName`:
    - Click "Add mapper"
    - Set "Name" to "Import Last Name"
    - Leave "Sync mode override" at "Inherit"
    - Select "Attribute Importer" from the "Mapper type" dropdown menu.
    - Set "Attribute Name" to "lastName" **Important:** This attribute name must
      match a "Name" set in Okta "Attribute Statements (optional)" for the import to
      work.
    - Leave "Name Format" as "ATTRIBUTE_FORMAT_BASIC"
    - Select "lastName" from the "User Attribute Name" dropdown
    - Click "Save."

Link the newly added IdP to its corresponding organization.

See also this Keycloak documentation:
https://www.keycloak.org/docs/26.2.5/server_admin/index.html#_managing_identity_provider_

25. Visit "Organizations."
26. Open the organization.
27. Click the "Identity Providers" tab.
28. Click "Link identity provider."
29. Select the IdP (created above) from the "Identity provider" dropdown menu.
30. Select the organization's domain name from the "Domain" dropdown menu.
31. Keep "Hide on login page" set to "Off."
32. Set "Redirect when email domain matches" to "On."
33. Click "Save."

Attempt to login to a PDC app.

34. Visit the API docs.
35. Click "Authorize."
36. Click "Authorize" on the "Available authorizations" modal.
37. Enter an email address with the organization's domain.
38. Verify that the browser is redirected to Okta.

If the user is assigned to the application in Okta, proceed with authentication
and a redirect back to the PDC API docs should occur.
