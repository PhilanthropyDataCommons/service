# Philanthropy Data Commons Service

## Development

### Setup

1. Install npm dependencies

  ```bash
  npm ci
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

To generate a json schema from the included types:
```bash
npm run generate-json-schema
```

### EditorConfig

We use [EditorConfig](https://editorconfig.org/) to help developers maintain proper whitespace habits in the project.  Most IDEs have [an official EditorConfig plugin](https://editorconfig.org/#download) you can install.
