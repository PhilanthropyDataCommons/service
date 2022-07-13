module.exports = {
  globals: {
    "ts-jest": {
      tsconfig: 'tsconfig.dev.json',
    },
  },
  collectCoverageFrom: ["src/**/*.ts"],
  preset: 'ts-jest',
  setupFiles: ['<rootDir>/src/test/setupEnv.ts'],
  testEnvironment: 'node',
  testPathIgnorePatterns: ["<rootDir>/dist/"],
  silent: true,
  passWithNoTests: true,
};
