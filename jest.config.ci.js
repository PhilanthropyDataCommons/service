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
	collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.*'],
	projects: [
		{
			...commonProjectConfig,
			displayName: 'integration',
			testMatch: ['**/*.int.test.ts'],
			setupFilesAfterEnv: ['<rootDir>/src/test/integrationSuiteSetup.ts'],
		},
		{
			...commonProjectConfig,
			displayName: 'unit',
			testMatch: ['**/*.unit.test.ts'],
		},
	],
};
