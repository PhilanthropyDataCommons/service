var config = require('./jest.config.base.js');
config.testMatch = ['**/?(*.)+(int).(spec|test).[jt]s?(x)'];
config.setupFilesAfterEnv = ['<rootDir>/src/test/integrationSuiteSetup.ts'];
config.globalSetup = '<rootDir>/src/test/integrationGlobalSetup.ts';
config.globalTeardown = '<rootDir>/src/test/integrationGlobalTeardown.ts';
// Each worker uses up to 11 PostgreSQL connections (10 pool + 1 admin).
// Cap at 9 workers to stay within PostgreSQL's default max_connections of 100.
config.maxWorkers = 9;
module.exports = config;
