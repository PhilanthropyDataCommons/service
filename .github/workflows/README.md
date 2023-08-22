# GitHub Workflow notes for the Philanthropy Data Commons service

## Overview of the `build.yml` here

The `build.yml` workflow builds the software, a docker image, and pushes
the image to the GitHub Container Registry (ghcr.io).

## Overview of the separate repository `deploy`

The `deploy` project's `compose.yml` operates at a higher level, at the
binary image level, rather than the source code level. It also operates
with multiple components that potentially live in other repositories as
well, e.g. the Single-Sign-On auth container.

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

As of May, 2023, the Personal Access Token can be linked with an
organization and particular repositories rather than only an individual
having access to the organizations. See [issue
#343](https://github.com/PhilanthropyDataCommons/service/issues/343). The
active organization tokens can be seen in the [organization settings
tokens](https://github.com/organizations/PhilanthropyDataCommons/settings/personal-access-tokens/active).

Until a better solution is found, the GitHub secrets for this repository
needs a `REPO_ACCESS_TOKEN` variable containing a PAT having "Read access
to code and metadata" and "Read and Write access to actions" for the
`deploy` and `service` repositories. When this token expires, renewal or
replacement is needed. Exact steps to update the token follow. As of August,
2023, the fine-grained access tokens are in beta, so the steps may differ
in the future.

1. Visit https://github.com/settings/tokens
2. Click "Fine-grained tokens" rather than "Tokens (classic)"
3. Choose "Generate new token"
4. Add a name, e.g. "Trigger actions in deploy from service"
5. Set the expiration, e.g. a year
6. Add a description, e.g. "The service repository build action triggers
   actions in the deploy repository that deploy to a test environment."
7. Set the resource owner as "Philanthropy Data Commons"
8. Under "Repository access", choose "Only select repositories":
   - service
   - deploy
9. Under "Permissions -> Repository permissions", grant these permissions:
   - Actions, Access: Read and write
   - Contents, Access: Read-only
   - Metadata, Access: Read-only
10. Click "Generate token"
11. Copy to clipboard or save in a temporary secure location
12. Visit https://github.com/PhilanthropyDataCommons/service/settings/secrets/actions
13. Under "Repository secrets", click "Update" next to `REPO_ACCESS_TOKEN`
14. Paste the token generated in steps 1-7.
15. Click "Update secret"

This name `REPO_ACCESS_TOKEN` is used in the `build.yml` workflow as
`${{ secrets.REPO_ACCESS_TOKEN }}`.

The token can be revoked from [organization settings -> Personal access tokens
-> Active tokens](https://github.com/organizations/PhilanthropyDataCommons/settings/personal-access-tokens/active).
