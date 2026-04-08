/**
 * All test databases are named with this prefix. The test infrastructure
 * enforces this on CREATE/DROP, and the application refuses to start if
 * PGDATABASE matches it, preventing accidental use of a test database
 * in a non-test context.
 */
const TEST_DATABASE_PREFIX = 'pdc_test';

export { TEST_DATABASE_PREFIX };
