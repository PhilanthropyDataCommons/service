# GitHub Workflow notes for the Philanthropy Data Commons service

## Overview of the `build.yml` here

The `build.yml` workflow builds the software, a docker image, and pushes
the image to the GitHub Container Registry (ghcr.io).

## Overview of the separate repository `deploy`

The `deploy` project's `compose.yml` operates at a higher level, at the
binary image level, rather than the source code level. It also operates
with multiple components that potentially live in other repositories as
well, e.g. a future GUI.

## The dependency on Personal Access Tokens (PAT)

The `build.yml` workflow here in the `service` project notifies the
`deploy` project (solely dedicated to software deployment alongside
other components) and waits for a workflow in that project to finish
updating its `compose.yml` deployment script.

This last step, the inter-repo or inter-project portion, apparently
requires (or is straightforward to do with) a GitHub Personal Access
Token but ideally would be done from the `deploy` project noticing a new
package and updating its `compose.yml` and/or without a Personal Access
Token.

Until a better solution is found, the GitHub secrets for this repository
needs a `REPO_ACCESS_TOKEN` variable containing a PAT having the
`public_repo` scope. If this token expires, renewal or replacement is
needed. The exact steps to update the token follow.

1. Visit https://github.com/settings/tokens
2. Choose "Generate new token"
3. Set the expiration
4. Select the scope `public_repo` under `repo`
5. Click "Generate token"
6. Create a note indicating it is for PDC CI / CD
7. Copy to clipboard or save in a temporary secure location
8. Visit https://github.com/PhilanthropyDataCommons/service/settings/secrets/actions
9. Under "Repository secrets", click "Update" next to `REPO_ACCESS_TOKEN`
10. Paste the token generated in steps 1-7.
11. Click "Update secret"

This name `REPO_ACCESS_TOKEN` is used in the `build.yml` workflow as
`${{ secrets.REPO_ACCESS_TOKEN }}`.
