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
  npm run migrations
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

### EditorConfig

We use [EditorConfig](https://editorconfig.org/) to help developers maintain proper whitespace habits in the project.  Most IDEs have [an official EditorConfig plugin](https://editorconfig.org/#download) you can install.
