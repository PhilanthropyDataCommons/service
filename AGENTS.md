# Agent Guide for PDC Service

This document provides context for LLM agents contributing to the Philanthropy Data Commons (PDC) service repository.

## Project Overview

The PDC service is a Node.js/TypeScript REST API backend for the Philanthropy Data Commons - a platform enabling cross-organizational grant data sharing between changemakers (grant applicants) and funders while maintaining data sovereignty.

**Key Technologies:**

- Node.js (see `.node-version` for current version) with TypeScript
- Express for the REST API
- PostgreSQL with TinyPG (lightweight query library)
- Keycloak for authentication (JWT-based)
- Graphile Worker for background job processing
- AWS S3 for file storage
- Jest for testing

For specific dependency versions, consult `package.json`.

## Quick Reference Commands

```bash
# Install dependencies
npm ci

# Run development server
npm run start

# Run all tests
npm run test

# Run unit tests only
npm run test:unit

# Run integration tests only (sequential)
npm run test:integration

# Run linting (all)
npm run lint

# Auto-fix formatting
npm run format

# Build for production
npm run build

# Run database migrations
npm run migrate
```

## After Making Changes

**Always run the formatter and linter after making ANY changes, including documentation, configuration, SQL, and JSON files:**

```bash
# Auto-fix formatting issues (run this first)
npm run format

# Check for linting errors
npm run lint
```

The formatter (`npm run format`) will automatically fix most style issues including:

- Code formatting via Prettier
- Import ordering via ESLint
- SQL formatting via SQLFluff

The linter (`npm run lint`) checks for:

- TypeScript errors and strict type checking
- ESLint rule violations
- Prettier formatting compliance
- SQL style issues
- OpenAPI spec validity
- Docker Compose syntax

**Run tests before considering work complete:**

```bash
npm run test
```

The full test suite takes several minutes to run. Avoid running the full test suite (`npm run test`) unless explicitly requested. Instead, run specific test files relevant to your changes:

```bash
# Run a specific test file
npx jest --config=jest.config.int.js --runInBand src/__tests__/yourFile.int.test.ts

# Run tests matching a pattern
npx jest --config=jest.config.int.js --runInBand --testNamePattern="test description"
```

The user will run the full test suite themselves when needed.

## Project Structure

```
src/
├── routers/        # Express route definitions (map URLs to handlers)
├── handlers/       # Business logic for each endpoint
├── middleware/     # Express middleware (auth, permissions, errors)
├── database/
│   ├── migrations/ # SQL schema migrations (####-action-table.sql)
│   ├── operations/ # Data access layer organized by entity
│   ├── queries/    # Reusable SQL query files
│   └── parameters/ # Query parameter definitions
├── types/          # TypeScript interfaces and type definitions
├── constants/      # Application constants (HTTP status, numbers)
├── errors/         # Custom error classes
├── tasks/          # Background job implementations
├── test/           # Test utilities and mocks
├── __tests__/      # Integration test files
└── openapi/        # OpenAPI specification (api.json)
```

## Code Conventions

### TypeScript

1. **No default exports** - Always use named exports

   ```typescript
   // Good
   export { usersHandlers };

   // Bad
   export default usersHandlers;
   ```

2. **No magic numbers** - Define constants in `src/constants/`

   ```typescript
   // Good
   import { HTTP_STATUS } from '../constants';
   res.status(HTTP_STATUS.SUCCESSFUL.OK);

   // Bad
   res.status(200);
   ```

3. **Import ordering** - Imports are auto-sorted: builtin, external, internal, parent, sibling, index, object, type

4. **Sorted exports** - Exports in `index.ts` files must be alphabetically sorted

5. **Explicit return types** - Required for all functions (except test files)

6. **Type-only imports** - Use `import type` for type-only imports

### SQL Conventions

Migrations and queries follow SQLFluff linting with these rules:

- Dialect: PostgreSQL
- Indentation: tabs
- Functions and types: lowercase
- Final semicolon required
- Migration naming: `####-{action}-{table}.sql` (e.g., `0079-create-changemaker_field_values.sql`)

### OpenAPI Conventions

- **Do NOT create separate "Writable" schemas** in the OpenAPI spec. The downstream SDK generator automatically creates writable types by stripping `readOnly` properties from the base schema. Adding an explicit `WritableFoo` schema causes the SDK build to fail. Instead, use the base entity schema (e.g., `PermissionGrant.json`) for both request bodies and responses, and mark server-managed fields with `"readOnly": true` in the base schema. OpenAPI tooling will exclude `readOnly` fields from request validation.
- Schema files live in `src/openapi/components/schemas/`
- Path files live in `src/openapi/paths/`
- Register new schemas in `src/openapi/api.json` under `components.schemas`

### Testing

- **Unit tests**: `*.unit.test.ts` - Test isolated functions
- **Integration tests**: `*.int.test.ts` - Test full API endpoints with database
- Tests use `supertest` for HTTP assertions
- Mock JWT authentication via `mockJwt` from `src/test/mockJwt.ts`
- Test utilities in `src/test/utils.ts`

Example test pattern:

```typescript
import request from 'supertest';
import { app } from '../app';
import { mockJwt as authHeader } from '../test/mockJwt';

describe('/endpoint', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await request(app).get('/endpoint').expect(401);
		});

		it('returns data for authenticated users', async () => {
			const response = await request(app)
				.get('/endpoint')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				/* expected */
			});
		});
	});
});
```

## Architecture Patterns

### Request Flow

```
Router -> Middleware -> Handler -> Database Operation -> SQL Query
```

1. **Routers** (`src/routers/`) - Define routes and apply middleware
2. **Middleware** (`src/middleware/`) - Authentication, authorization, validation
3. **Handlers** (`src/handlers/`) - Business logic, calls database operations
4. **Database Operations** (`src/database/operations/`) - Data access, executes queries

### Adding a New Entity

1. Create type definition in `src/types/NewEntity.ts`
2. Export from `src/types/index.ts` (keep alphabetically sorted)
3. Create database migration in `src/database/migrations/`
4. Create database operations in `src/database/operations/newEntity/`
5. Create handler in `src/handlers/newEntityHandlers.ts`
6. Create router in `src/routers/newEntityRouter.ts`
7. Register router in `src/routers/index.ts`
8. Add OpenAPI spec in `src/openapi/api.json`
9. Write integration tests in `src/__tests__/newEntity.int.test.ts`

### Database Operations Pattern

Operations use generator functions for common CRUD patterns:

```typescript
import { generateCreateOrUpdateItemOperation } from '../generators';
import type { Entity, WritableEntity } from '../../../types';

const createOrUpdateEntity = generateCreateOrUpdateItemOperation<
	Entity,
	WritableEntity,
	[]
>('entities.insertOrUpdateOne', ['field1', 'field2'], []);

export { createOrUpdateEntity };
```

### Handler Pattern

```typescript
import { HTTP_STATUS } from '../constants';
import { db, loadEntityBundle } from '../database';
import { isAuthContext } from '../types';
import { FailedMiddlewareError } from '../errors';
import type { Request, Response } from 'express';

const getEntities = async (req: Request, res: Response): Promise<void> => {
	if (!isAuthContext(req)) {
		throw new FailedMiddlewareError('Unexpected lack of auth context.');
	}

	const bundle = await loadEntityBundle(db, req);

	res
		.status(HTTP_STATUS.SUCCESSFUL.OK)
		.contentType('application/json')
		.send(bundle);
};

const entityHandlers = { getEntities };

export { entityHandlers };
```

## Permission System

The PDC uses a layered permission model:

1. **Authentication** - Keycloak JWT validation (required for most endpoints)
2. **Role-based** - `pdc-admin` role grants administrative access
3. **Entity permissions** - Per-entity (changemaker, funder, dataProvider, opportunity):
   - `VIEW` - Read access
   - `EDIT` - Create/modify access
   - `MANAGE` - Grant permissions to others

Permissions can be granted to:

- Individual users (by `keycloakUserId`)
- User groups (by `keycloakOrganizationId`)

See `docs/PERMISSIONS.md` for detailed documentation.

## Environment Variables

Key environment variables (see `.env.example` for full list):

| Variable                                                           | Purpose                                                            |
| ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`           | PostgreSQL connection                                              |
| `AUTH_SERVER_ISSUER`                                               | Keycloak realm URL                                                 |
| `OPENAPI_DOCS_AUTH_CLIENT_ID`                                      | Keycloak client ID                                                 |
| `S3_ACCESS_KEY_ID`, `S3_ACCESS_SECRET`, `S3_BUCKET`, `S3_ENDPOINT` | S3 storage                                                         |
| `LOG_LEVEL`                                                        | Logging verbosity (trace, debug, info, warn, error, fatal, silent) |

## CI/CD Workflows

GitHub Actions workflows in `.github/workflows/`:

- `lint.yml` - ESLint, Prettier, TSC, SQLFluff, OpenAPI validation
- `test.yml` - Unit and integration tests with coverage
- `docker.yml` - Docker image building
- `deploy.yml` - Production deployment

All checks must pass before merging PRs.

## Common Tasks

### Adding a Database Migration

1. Determine next migration number (check `src/database/migrations/`)
2. Create file: `####-{action}-{table}.sql`
3. Write PostgreSQL DDL with proper formatting
4. Run `npm run migrate` to apply
5. Run `npm run lint:sqlfluff` to verify SQL style

### Updating the OpenAPI Spec

1. Edit `src/openapi/api.json`
2. Run `npm run lint:openapi` to validate
3. Run `npm run build:openapi` to bundle

**Important:** See the [OpenAPI conventions](#openapi-conventions) section for rules about schema design.

### Running Tests with Logging

```bash
LOG_LEVEL=debug npm run test
```

### Docker Development

```bash
# Start full stack (API, DB, Keycloak, S3)
docker compose -f compose-ci.yml up

# Build image
docker build .
```

## Key Files Reference

| File                             | Purpose                    |
| -------------------------------- | -------------------------- |
| `src/index.ts`                   | Server entry point         |
| `src/app.ts`                     | Express app configuration  |
| `src/database/db.ts`             | Database connection pool   |
| `src/middleware/processJwt.ts`   | JWT authentication         |
| `src/middleware/errorHandler.ts` | Centralized error handling |
| `src/types/index.ts`             | All type exports           |
| `src/constants/httpStatus.ts`    | HTTP status code constants |

## Documentation

- `README.md` - Project overview and setup
- `docs/PERMISSIONS.md` - Access control model
- `docs/ENTITY_RELATIONSHIP_DIAGRAM.md` - Database schema
- `docs/CHANGEMAKER_DATA.md` - Data provenance and consistency
- `docs/HOSTING.md` - Production deployment
- `docs/KEYCLOAK_CHECKLIST.md` - Authentication server setup

## Maintaining Documentation

When making changes to the codebase, ensure that relevant documentation is kept up to date. Documentation drift leads to confusion and maintenance burden.

### Entity Relationship Diagram (ERD)

The ERD at `docs/ENTITY_RELATIONSHIP_DIAGRAM.md` documents the database schema using Mermaid syntax.

**When to update the ERD:**

- Adding new database tables (via migrations)
- Removing or renaming database tables
- Adding, removing, or renaming columns
- Changing relationships between tables (foreign keys)
- Changing primary keys or data types

**What to update:**

1. The Mermaid `erDiagram` block with entity definitions and relationships
2. The narrative section if the conceptual model changes
3. The example sections if they reference outdated concepts or terminology

**Tips:**

- You can connect to the local database via `psql` to inspect the current schema
- Use `\dt` to list tables and `\d table_name` to describe table structure
- Compare the ERD against the actual schema periodically to catch drift

### Other Documentation to Keep Current

| Document               | Update When                                                       |
| ---------------------- | ----------------------------------------------------------------- |
| `CHANGELOG.md`         | Any API changes (new endpoints, schema changes, behavior changes) |
| `docs/ARCHITECTURE.md` | Architectural changes or new system patterns                      |
| `docs/GLOSSARY.md`     | Introducing new terminology or concepts                           |
| `docs/PERMISSIONS.md`  | Changing the permissions model                                    |
| `README.md`            | Adding features or changing setup                                 |
| `src/openapi/api.json` | Adding/modifying API endpoints                                    |

### Changelog

The `CHANGELOG.md` file follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format. **Always update the changelog when making API changes**, including:

- New endpoints or entity types
- Changes to request/response schemas
- Changes to API behavior (e.g., new filtering, sorting, or data selection logic)
- Deprecations or removals

Add entries under the `## Unreleased` section using the appropriate subsection:

- `### Added` - New features
- `### Changed` - Changes to existing functionality
- `### Deprecated` - Features that will be removed
- `### Removed` - Removed features
- `### Fixed` - Bug fixes
- `### Security` - Security-related changes

### Making a Release

When creating a new release version:

1. Move entries from `## Unreleased` to a new version section (e.g., `## 0.28.0 2025-01-08`)
2. Update the version in `src/openapi/api.json` to match the new release version
3. Leave an empty `## Unreleased` section for future changes
4. Run `npm run format` and `npm run lint` to ensure all files are properly formatted

## Maintaining This Document

This document should be kept up to date as the codebase evolves. Update it when:

- **New patterns are established** - Add examples of new architectural patterns or conventions
- **Conventions change** - Update coding standards, linting rules, or testing approaches
- **Project structure changes** - Reflect new directories or reorganization
- **New workflows are added** - Document new npm scripts or CI/CD processes
- **Key dependencies change significantly** - Update technology descriptions (but reference `package.json` for specific versions)

**Guidelines for updates:**

- Keep the document user-agnostic (no local paths or developer-specific references)
- Reference version files (`.node-version`, `package.json`) rather than hardcoding versions
- Include code examples that match current codebase patterns
- Verify examples compile/work before adding them
- Remove outdated information rather than letting it accumulate
