![lint](https://github.com/PhilanthropyDataCommons/service/actions/workflows/lint.yml/badge.svg)
![test](https://github.com/PhilanthropyDataCommons/service/actions/workflows/test.yml/badge.svg)
![build](https://github.com/PhilanthropyDataCommons/service/actions/workflows/build.yml/badge.svg)
[![codecov](https://codecov.io/gh/PhilanthropyDataCommons/service/branch/main/graph/badge.svg?token=PG6K5X5HZD)](https://codecov.io/gh/PhilanthropyDataCommons/service)

# Philanthropy Data Commons Service

This project is related to [Philanthropy Data Commons](https://philanthropydatacommons.org) (PDC). Please visit https://philanthropydatacommons.org for an overview of PDC.

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
