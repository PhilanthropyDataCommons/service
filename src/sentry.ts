import * as Sentry from '@sentry/node';

const initSentry = (): void => {
	Sentry.init({
		dsn: process.env.SENTRY_DSN,
		environment: process.env.SENTRY_ENVIRONMENT,
		defaultIntegrations: false,
		integrations: [
			Sentry.onUncaughtExceptionIntegration(),
			Sentry.onUnhandledRejectionIntegration(),
			Sentry.httpIntegration({ sessions: false, breadcrumbs: false }),
			Sentry.requestDataIntegration(),
			Sentry.contextLinesIntegration(),
		],
		tracePropagationTargets: [],
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
		beforeSend: (event) => ({ ...event, extra: undefined }),
	});
};

export { initSentry };
