var config = require('./jest.config.base.js');

commonProjectConfig = {
	transform: {
		'^.+\\.tsx?$': [
			'ts-jest',
			{
				tsconfig: 'tsconfig.dev.json',
			},
		],
	},
};

module.exports = {
	...config,
	collectCoverage: true,
	collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.*', '!src/test/**'],
	// Each worker uses up to 11 PostgreSQL connections (10 pool + 1 admin).
	// Cap at 9 workers to stay within PostgreSQL's default max_connections of 100.
	maxWorkers: 9,
	projects: [
		{
			...commonProjectConfig,
			displayName: 'integration',
			testMatch: ['**/*.int.test.ts'],
			setupFilesAfterEnv: ['<rootDir>/src/test/integrationSuiteSetup.ts'],
			globalSetup: '<rootDir>/src/test/integrationGlobalSetup.ts',
			globalTeardown: '<rootDir>/src/test/integrationGlobalTeardown.ts',
		},
		{
			...commonProjectConfig,
			displayName: 'unit',
			testMatch: ['**/*.unit.test.ts'],
		},
	],
};
