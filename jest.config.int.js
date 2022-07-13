var config = require('./jest.config.base.js');
config.testMatch = ['**/?(*.)+(int).(spec|test).[jt]s?(x)'];
config.setupFilesAfterEnv = ["<rootDir>/src/test/integrationSuiteSetup.ts"];
module.exports = config;
