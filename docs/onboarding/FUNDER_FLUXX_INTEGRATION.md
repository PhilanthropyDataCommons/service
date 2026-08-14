# Fluxx Onboarding Checklist

Funders that link Fluxx with PDC require these steps to integrate.

These steps are not expected for changemaker organizations, only funders.

## In the PDC Keycloak

These steps require Keycloak PDC realm administrative access.

Visit https://auth.philanthropydatacommons.org/admin/pdc/console/#/pdc/clients

- [ ] Add a client for the Fluxx/funder integration:
  - [ ] Follow the `pdc-fluxx-[org short name]` naming convention
  - [ ] Set the Root URL, usually like `https://[org short name].fluxx.io`
  - [ ] Add a "Valid redirect URI" like `https://[org short name].fluxx.io/*`
  - [ ] If other subdomains are used, add them to "Valid redirect URIs"
  - [ ] Set "Valid post logout redirect URIs" to `+`
  - [ ] Set "Web origins" to `+`
  - [ ] Set "Client authentication" to `Off`
  - [ ] Enable the "Standard flow"
  - [ ] Uncheck all other Authentication flows
  - [ ] Set "Require PKCE" to `On`
  - [ ] Click "Save"
  - [ ] In "Client Scopes" tab set `organizations` client scope to `Default`

Test the integration from Fluxx and correct the Valid redirect URIs as needed.
Users of any organization (for example, changemakers) who can log into Fluxx
should be able to click the PDC login button inside the Fluxx integration, log
in, and successfully get redirected back into Fluxx.
