# GitHub Workflow Notes for the Philanthropy Data Commons service

## Deploy

The deploy task requires an API key, secret `DIGITAL_OCEAN_TOKEN`, and an
environment with a variable `DIGITAL_OCEAN_APP_ID`. The App ID is a UUID.

In order for `@dependabot merge` to access `DIGITAL_OCEAN_TOKEN`, it needs to be
added to the repository secrets in the dependabot area in addition to the
actions area (see repository Settings -> Security -> Secrets and Variables).
The Digital Ocean API token does not vary by environment because both Test and
Production run on Digital Ocean App Platforms. To generate such a token, visit
https://cloud.digitalocean.com/account/api/tokens and create a token with access
to Create, Read, and Update Apps.

The `DIGITAL_OCEAN_APP_ID` varies by environment. It is specified in the
repository Settings -> Code and automation -> Environments area, one per each.
The App ID can be found in the URL of the Digital Ocean cloud management
interface for the Test or Production App.

The reason the deploy task pipes to `jq` is twofold:

1. It filters out secrets by selecting a single expected deployment id.
2. It helps return an error when there is no expected deployment id (`-e`).
