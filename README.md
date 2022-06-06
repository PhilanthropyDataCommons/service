# Philanthropy Data Commons Service

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

To start the server:

```bash
npm start
```

### Understanding the Project

#### Project Structure

- `/src/databases` contains database `migrations`, `queries`, and the core `db` access object.
- `/src/controllers` contains all business logic related to the invocation of a given PDC api call.
- `/src/routers` contains the piping that maps a given API route to a controller.

#### Database

We are using a very lightweight library called [tinypg](https://www.npmjs.com/package/tinypg) for our database interactions and a similarly lightweight library called [postgres-migrations](https://www.npmjs.com/package/postgres-migrations) to handle migrations.

Migrations should be named according to the following pattern: `####-{action}-{table}`

For example: `0001-create-users` or `0001-modify-users`

### EditorConfig

We use [EditorConfig](https://editorconfig.org/) to help developers maintain proper whitespace habits in the project.  Most IDEs have [an official EditorConfig plugin](https://editorconfig.org/#download) you can install.
