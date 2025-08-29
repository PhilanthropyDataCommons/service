if (process.env.TEST_LOG_LEVEL !== undefined) {
	process.env.LOG_LEVEL = process.env.TEST_LOG_LEVEL;
}

module.exports = {
	transform: {
		'^.+\\.tsx?$': [
			'ts-jest',
			{
				tsconfig: 'tsconfig.dev.json',
			},
		],
	},
	preset: 'ts-jest',
	globalSetup: '<rootDir>/src/test/globalSetup.ts',
	testEnvironment: 'node',
	testPathIgnorePatterns: ['<rootDir>/dist/'],
	silent: true,
	passWithNoTests: true,
};
