import { TinyPgError } from 'tinypg';
import {
	enqueueSyncUsersFromKeycloakJob,
	redactJobPayloadFromMeta,
} from '../jobQueue';

jest.mock('../logger', () => ({
	getLogger: () => ({
		error: jest.fn(),
		warn: jest.fn(),
		info: jest.fn(),
		debug: jest.fn(),
	}),
}));
jest.mock('../database/db', () => ({ getDatabase: jest.fn() }));
jest.mock('../tasks', () => ({
	copyBaseFields: jest.fn(),
	processBulkUploadTask: jest.fn(),
	syncUsersFromKeycloak: jest.fn(),
}));

describe('redactJobPayloadFromMeta', () => {
	it('scrubs the job payload from log metadata', () => {
		const meta = {
			failure: true,
			job: {
				id: 5,
				payload: { keycloakAdminAuthorizationHeader: 'Bearer secret-token' },
			},
		};
		expect(redactJobPayloadFromMeta(meta)).toEqual({
			failure: true,
			job: { id: 5, payload: '[REDACTED]' },
		});
	});

	it('leaves metadata without a job untouched', () => {
		const meta = { failure: true };
		expect(redactJobPayloadFromMeta(meta)).toEqual(meta);
	});
});

describe('enqueueSyncUsersFromKeycloakJob', () => {
	it('scrubs the caller credentials from the enqueue failure', async () => {
		const transactionDb = {
			sql: jest.fn().mockRejectedValue(
				new TinyPgError('connection lost', undefined, {
					error: { code: '08003' },
					params: {
						identifier: 'syncUsersFromKeycloak',
						payload: JSON.stringify({
							userSyncTaskId: 1,
							keycloakAdminAuthorizationHeader: 'Bearer secret-token',
						}),
						maxAttempts: 1,
					},
				}),
			),
		};
		const caught = await enqueueSyncUsersFromKeycloakJob(
			transactionDb,
			1,
			'Bearer secret-token',
		).catch((caughtError: unknown) => caughtError);

		// The bind parameters carry the caller's credentials; the propagated
		// error must not contain them.
		expect(JSON.stringify(caught)).not.toContain('Bearer secret-token');
		expect(JSON.stringify(caught)).toContain('syncUsersFromKeycloak');
	});
});
