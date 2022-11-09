![lint](https://github.com/PhilanthropyDataCommons/service/actions/workflows/lint.yml/badge.svg)
![test](https://github.com/PhilanthropyDataCommons/service/actions/workflows/test.yml/badge.svg)
![build](https://github.com/PhilanthropyDataCommons/service/actions/workflows/build.yml/badge.svg)
[![codecov](https://codecov.io/gh/PhilanthropyDataCommons/service/branch/main/graph/badge.svg?token=PG6K5X5HZD)](https://codecov.io/gh/PhilanthropyDataCommons/service)

# Philanthropy Data Commons Service

This is the data-handling service layer for the [Philanthropy Data Commons](https://philanthropydatacommons.org) (PDC).

The PDC is an access-controlled environment in which changemakers and funders can share funding proposals, both for improved efficiency (e.g., offering a "common grant application" in specific domains) and for opening up new possibilities in partnering and alliance-building.  The PDC is designed to enable cross-organizational data sharing while allowing organizations to maintain their own systems, practices, and data standards.

To do this, the PDC maintains a **mapping** between various organizations' data fields and the PDC's internal data representation.  For example, if one organization uses `Proposal Name` and another uses `Title of Proposal`, both of those might map to the PDC field `ProposalTitle`.  The PDC remembers this mapping, translating back and forth as needed so that data flow in and out seamlessly, a unified search interface can be offered, etc.

With the above overview in mind, we can now summarize what this service layer does:

* Store **opportunities** (analogous to RFPs / CFPs) and the **fields** (which hold applicants' responses) associated with those opportunities.
* Store **proposals** -- the actual responses to opportunities, with long-term consistency provided via the above-described mapping.
* **Authenticate** users and provide **access control**, so that a given organization's data is only shared with whom that organization has authorized.
* Provide a **programmatic interface** (an [API](https://en.wikipedia.org/wiki/API)) by which authorized users (both changemakers and funders) can **browse**,  **search**, and, where appropriate, **update** opportunities and proposals, subject to the access controls defined by data owners.
* Track the **provenance** and **update history** of all information, noticing and handling discrepancies.  For example, if two different [GMS](https://en.wikipedia.org/wiki/Grant_management_software) tools connect to the PDC and provide conflicting information about an application or an applicant, the PDC may be able to pick the right answer automatically (based on a up-to-date date or on some other precedence rule), or it may flag the conflict and require a human to resolve it.

Of all these features, the API is probably the most important, because it is the heart of the PDC's interoperability.  It enables GMSs and other systems to connect to the PDC to give and receive information about opportunities and proposals.  For example, it can enable a second funder to discover a proposal that a changemaker had proposed to some other potential funder originally; it even provides ways for the originally considered funder to deliberately share (assuming the changemaker authorizes) a good proposal with a specific funder that might be more appropriate for it.

While the PDC service layer will have its own web-browser-based searching and browsing interface, the API (and its associated [data schema](docs/ENTITY_RELATIONSHIP_DIAGRAM.md)) are where interoperability lives, and our top priority is documenting that API and helping people to use it.  Through the API, other systems, including but not limited to GMS tools, can connect to the PDC and use PDC data to supplement what they provide.

See also the [technical architecture diagram](docs/ARCHITECTURE.md).

## Development

In order to run this software you need to set up a [Postgres 14](https://www.postgresql.org/) database.

### Setup

1. Install npm dependencies

  ```bash
  npm ci
  ```

2. Set up environment variables

  ```bash
  cp .env.example .env
  edit .env
  ```

3. Set up test environment variables

  ```bash
  cp .env.example .env.test
  edit .env.test
  ```

4. Run migrations

  ```bash
  npm run migrate:dev
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
npm build
npm run migrate
```

To start the server:

```bash
npm build
npm start
```

To start the server in a development environment:

```bash
npm run start:dev
```

### Logging

To override the default log level in any environment, set the environment variable `LOG_LEVEL` with any of the above `npm` commands:

```bash
LOG_LEVEL=trace npm run test
```

Alternatively, one may set `LOG_LEVEL` in the `.env` file.

### API Keys

As a temporary measure, API keys from a file are used for authentication. To generate five keys, for example:

    touch secret_api_keys.txt
    chmod 600 secret_api_keys.txt
    for i in {1..5}; do tr -dc a-zA-Z0-9 </dev/random | head -c 80; echo ''; done > secret_api_keys.txt

Set `API_KEYS_FILE` in `.env` to `secret_api_keys.txt` (or whatever was specified above) but remember also to set `API_KEYS_FILE=test_keys.txt` (verbatim) in .env.test such that the .env value will not take precedence over the non-existent test value. In other words, `.env` and `.env.test` get merged in tests, and if you set API_KEYS_FILE in `.env`, the tests will unintentially pick up the wrong keys if you do not also set the variable correctly in `.env.test`. By default, if neither `.env` nor `.env.test` specifies `API_KEYS_FILE` the tests will use `test_keys.txt` which are not intended for production use.

### Understanding the Project

#### Project Structure

- `/src/databases` contains database `migrations`, `queries`, and the core `db` access object.
- `/src/handlers` contains all business logic related to the invocation of a given PDC api call.
- `/src/routers` contains the piping that maps a given API route to a controller.

#### Database

We are using a very lightweight library called [tinypg](https://www.npmjs.com/package/tinypg) for our database interactions and a similarly lightweight library called [postgres-migrations](https://www.npmjs.com/package/postgres-migrations) to handle migrations.

Migrations should be named according to the following pattern: `####-{action}-{table}`

For example: `0001-create-users` or `0001-modify-users`

### EditorConfig

We use [EditorConfig](https://editorconfig.org/) to help developers maintain proper whitespace habits in the project.  Most IDEs have [an official EditorConfig plugin](https://editorconfig.org/#download) you can install.
