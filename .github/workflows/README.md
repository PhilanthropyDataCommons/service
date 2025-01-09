# GitHub Workflow Notes for the Philanthropy Data Commons service

## Deploy

The deploy task requires an API key, secret `DIGITAL_OCEAN_TOKEN`, and an
environment with a variable `DIGITAL_OCEAN_APP_ID`. The App ID is a UUID.

The reason the task pipes to `jq` is twofold:

1. It filters out secrets by selecting a single expected deployment id.
2. It helps return an error when there is no expected deployment id (`-e`).
