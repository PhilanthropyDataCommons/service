import * as Sentry from '@sentry/node';

Sentry.init({
	dsn: process.env.SENTRY_DSN,
	environment: process.env.SENTRY_ENVIRONMENT,
	integrations: [Sentry.expressIntegration({ shouldHandleError: false })],
	dataCollection: {
		userInfo: false,
		cookies: false,
		httpHeaders: { allow: ['content-length', 'content-type', 'user-agent'] },
		httpBodies: [],
		urlQueryParams: false,
		databaseQueryData: false,
		queues: false,
		stackFrameVariables: false,
	},
});
