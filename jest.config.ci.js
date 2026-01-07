var config = require('./jest.config.base.js');
var integrationConfig = require('./jest.config.int.js');
var unitConfig = require('./jest.config.unit.js');

var commonProjectConfig = {
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
			testMatch: integrationConfig.testMatch,
			globalSetup: integrationConfig.globalSetup,
			globalTeardown: integrationConfig.globalTeardown,
			setupFilesAfterEnv: integrationConfig.setupFilesAfterEnv,
			maxWorkers: integrationConfig.maxWorkers,
		},
		{
			...commonProjectConfig,
			displayName: 'unit',
			testMatch: unitConfig.testMatch,
		},
	],
};
