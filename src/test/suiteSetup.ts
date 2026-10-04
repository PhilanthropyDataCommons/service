// This mock prevents graphile-worker from running background jobs during tests.
// A factory is used rather than an automock because graphile-worker is published
// as an ES module, which jest cannot load from our CommonJS test environment.
jest.mock('graphile-worker', () => {
	class Logger {
		error = jest.fn();
		warn = jest.fn();
		info = jest.fn();
		debug = jest.fn();
		scope = jest.fn(() => new Logger());
	}
	return {
		Logger,
		run: jest.fn(),
		runMigrations: jest.fn(),
		addJobAdhoc: jest.fn(),
	};
});
