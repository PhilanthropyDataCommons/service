![lint](https://github.com/PhilanthropyDataCommons/service/actions/workflows/lint.yml/badge.svg)
![test](https://github.com/PhilanthropyDataCommons/service/actions/workflows/test.yml/badge.svg)
![build](https://github.com/PhilanthropyDataCommons/service/actions/workflows/build.yml/badge.svg)
[![codecov](https://codecov.io/gh/PhilanthropyDataCommons/service/branch/main/graph/badge.svg?token=PG6K5X5HZD)](https://codecov.io/gh/PhilanthropyDataCommons/service)

# Philanthropy Data Commons Service

This is the data-handling service layer for the [Philanthropy Data Commons](https://philanthropydatacommons.org) (PDC).

The PDC is an access-controlled environment in which changemakers and funders can share funding proposals, both for improved efficiency (e.g., offering a "common grant application" in specific domains) and for opening up new possibilities in partnering and alliance-building. The PDC is designed to enable cross-organizational data sharing while allowing organizations to maintain their own systems, practices, and data standards.

To do this, the PDC maintains a **mapping** between various organizations' data fields and the PDC's internal data representation. For example, if one organization uses `Proposal Name` and another uses `Title of Proposal`, both of those might map to the PDC field `ProposalTitle`. The PDC remembers this mapping, translating back and forth as needed so that data flow in and out seamlessly, a unified search interface can be offered, etc.

With the above overview in mind, we can now summarize what this service layer does:

- Store **opportunities** (analogous to RFPs / CFPs) and the **fields** (which hold applicants' responses) associated with those opportunities.
- Store **proposals** -- the actual responses to opportunities, with long-term consistency provided via the above-described mapping.
- **Authenticate** users and provide **access control**, so that a given organization's data is only shared with whom that organization has authorized.
- Provide a **programmatic interface** (an [API](https://en.wikipedia.org/wiki/API)) by which authorized users (both changemakers and funders) can **browse**, **search**, and, where appropriate, **update** opportunities and proposals, subject to the access controls defined by data owners.
- Track the **provenance** and **update history** of all information, noticing and handling discrepancies. For example, if two different [GMS](https://en.wikipedia.org/wiki/Grant_management_software) tools connect to the PDC and provide conflicting information about an application or an applicant, the PDC may be able to pick the right answer automatically (based on a up-to-date date or on some other precedence rule), or it may flag the conflict and require a human to resolve it.

Of all these features, the API is probably the most important, because it is the heart of the PDC's interoperability. It enables GMSs and other systems to connect to the PDC to give and receive information about opportunities and proposals. For example, it can enable a second funder to discover a proposal that a changemaker had proposed to some other potential funder originally; it even provides ways for the originally considered funder to deliberately share (assuming the changemaker authorizes) a good proposal with a specific funder that might be more appropriate for it.

While the PDC service layer will have its own web-browser-based searching and browsing interface, the API (and its associated [data schema](docs/ENTITY_RELATIONSHIP_DIAGRAM.md)) are where interoperability lives, and our top priority is documenting that API and helping people to use it. Through the API, other systems, including but not limited to GMS tools, can connect to the PDC and use PDC data to supplement what they provide.

See also the [technical architecture diagram](docs/ARCHITECTURE.md).

## Development

In order to run this software you need to set up a [Postgres 14](https://www.postgresql.org/) database.

### Setup

1. Install npm dependencies

```bash
npm ci
```

2. Set up environment variables

See the `.env.example` file for relevant environment variables. One option to manage environment variables is to use a `.env` file and source it prior to running a command. For example:

```bash
cp .env.example .env
edit .env
set -a
source .env
```

3. Run migrations

```bash
npm run migrate
```

### Common Commands

To build the project:

```bash
npm run build
```

To run tests:

```bash
npm run test
```

To run the linter:

```bash
npm run lint
```

To remove dev dependencies for a docker or production build:

```bash
npm prune --omit=dev
```

To build a docker image:

```bash
docker build .
```

To use a development docker image from GitHub Container Registry:

```bash
docker pull ghcr.io/philanthropydatacommons/service:latest
```

To run migrations:

```bash
npm run build
npm run migrate
```

To start the server:

```bash
npm run build
npm start
```

To start the server in a development environment:

```bash
npm run start
```

### Logging

To override the default log level in any environment, set the environment variable `LOG_LEVEL` with any of the above `npm` commands:

```bash
LOG_LEVEL=trace npm run test
```

Alternatively, one may set `LOG_LEVEL` in the `.env` file.

### Authentication and Authorization

A valid Bearer JSON Web Token (Bearer JWT) is required in requests to the PDC service. The PDC officially reccomends using [KeyCloak](https://www.keycloak.org/) as the authentication provider, but supports any valid Bearer JWT provider. Please refer to [the relevant documentation for setup and configuration](https://www.keycloak.org/guides#getting-started)

See `.env.example` for documentation on the necessary environment variables for Keycloak (or chosen authentication provider)

#### An example with a Keycloak authentication and Swagger-UI

We use Swagger to generate an interactive api interface as the default route for the service.
From the Keycloak admin interface, e.g. https://my-host/admin:

1. Add a realm e.g. "pdc" (avoid spaces in the name).
2. Within the realm just added in step (1) add a client e.g. "pdc-openapi-docs", with Client authentication off and Authorization off:
   - Standard flow Checked,
   - Direct access grants unchecked,
   - Implicit flow unchecked,
   - Service accounts roles unchecked,
   - OAuth 2.0 Device Authorization Grant (optional), and
   - OIDC CIBA Grant unchecked.
3. In the settings for the client added in step (2), set the root URL and Home URL to the URL of the PDC service (not the auth service). [For development purposes, all callback routes can be authorized](https://www.keycloak.org/docs/23.0.7/authorization_services/#_resource_overview)
   - `/*`
4. In the settings for the client added in step (2), add a Web origins of `+`.
5. Within the realm, add a user, e.g. `test-user`. Set a password for this user.
6. Set your environment variables (see `.env.example`)
7. Run the service repository with `npm run start`.
8. Go to swagger ui page at `http://localhost:3001/`
9. Click "Authorize" in the top left and click the "Authorize" button in the popup
10. Proceed through keycloak login
11. Once logged in and redirected to swagger ui, query any of the endpoints to test authentication

### Understanding the Project

#### Project Structure

- `/src/databases` contains database `migrations`, `queries`, and the core `db` access object.
- `/src/handlers` contains all business logic related to the invocation of a given PDC api call.
- `/src/routers` contains the piping that maps a given API route to a controller.

#### Database

We are using a very lightweight library called [tinypg](https://www.npmjs.com/package/tinypg) for our database interactions and a similarly lightweight library called [postgres-migrations](https://www.npmjs.com/package/postgres-migrations) to handle migrations.

Migrations should be named according to the following pattern: `####-{action}-{table}`

For example: `0001-create-users` or `0001-modify-users`

In `/src/databases/seeds` there is seed or starter data. The contents can be run manually to help developers get data in their databases. The scripts are not referenced by the software and are included for convenience. The migrations must run prior to using seed scripts.

#### Node version

We aim to use the "Active LTS" version of node, currently 18. An exact version of node is specified in automated workflows and Dockerfile while a major version is specified in the .node-version. You should be able to use any minor version within the Active LTS version and might be able to use other major versions.

### EditorConfig

We use [EditorConfig](https://editorconfig.org/) to help developers maintain proper whitespace habits in the project. Most IDEs have [an official EditorConfig plugin](https://editorconfig.org/#download) you can install.

### Ignored revisions

We have set up a file to track commits that are focused on formatting changes. It is possible to [ignore these commits when running git blame](https://akrabat.com/ignoring-revisions-with-git-blame/).

You can configure your local git to always ignore these commits by invoking:

```
git config blame.ignoreRevsFile .git-blame-ignore-revs
```
