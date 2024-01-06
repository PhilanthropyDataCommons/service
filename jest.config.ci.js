var config = require('./jest.config.base.js');
module.exports = {
	...config,
	setupFilesAfterEnv: ['<rootDir>/src/test/integrationSuiteSetup.ts'],
	collectCoverage: true,
};
