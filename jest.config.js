module.exports = {
  globals: {
    "ts-jest": {
      tsconfig: 'tsconfig.dev.json',
    },
  },
  collectCoverageFrom: ["src/**/*.ts"],
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ["<rootDir>/dist/"],
  silent: true,
  passWithNoTests: true,
};
