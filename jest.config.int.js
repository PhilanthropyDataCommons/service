var config = require('./jest.config.base.js');
config.testMatch = ['**/?(*.)+(int).(spec|test).[jt]s?(x)'];
config.globalSetup = '<rootDir>/src/test/integrationGlobalSetup.ts';
config.globalTeardown = '<rootDir>/src/test/globalTeardown.ts';
config.setupFilesAfterEnv = ['<rootDir>/src/test/integrationSuiteSetup.ts'];
// Cap workers to prevent PostgreSQL "out of shared memory" errors from too many concurrent schemas
config.maxWorkers = 8;
module.exports = config;
