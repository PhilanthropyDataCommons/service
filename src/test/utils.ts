import { setImmediate } from 'node:timers/promises';
import { db, createOrUpdateUser, loadUserByKeycloakUserId } from '../database';
import { stringToKeycloakId } from '../types';
import type { AuthContext, KeycloakId, User } from '../types';

// Because expressjwt does not synchronously call next, but rather calls setImmediate(next),
// send another call to setImmediate to make sure previous calls to setImmediate have made it
// through the event loop. Otherwise jest misses the call (it hasn't happened yet). Kudos:
// https://stackoverflow.com/questions/41792927/jest-tests-cant-fail-within-setimmediate-or-process-nexttick-callback#answer-59604256
export const allowNextToResolve = async (): Promise<void> => {
	await setImmediate();
};

export const generateNextWithAssertions = (
	runAssertions: (err?: unknown) => void | Promise<void>,
	done: (value?: unknown) => unknown,
): jest.Mock<void, unknown[]> =>
	jest.fn((...args: unknown[]) => {
		const [err] = args;
		Promise.resolve()
			.then(async () => {
				await runAssertions(err);
			})
			.then(() => {
				done();
			})
			.catch((thrownError: unknown) => {
				done(thrownError);
			});
	});

export const getTestUserKeycloakUserId = (): KeycloakId =>
	stringToKeycloakId('11111111-1111-1111-1111-111111111111'); // This value is not a reference, it's just a static GUID

export const getTestUserKeycloakUserName = (): string => 'Moe';

export const getMockedUser = (): User => ({
	keycloakUserId: getTestUserKeycloakUserId(),
	keycloakUserName: getTestUserKeycloakUserName(),
	createdAt: '',
	permissions: {
		opportunity: {},
	},
});

export const createTestUser = async (): Promise<User> =>
	await createOrUpdateUser(db, null, {
		keycloakUserId: getTestUserKeycloakUserId(),
		keycloakUserName: getTestUserKeycloakUserName(),
	});

export const loadTestUser = async (): Promise<User> => {
	const testUserKeycloakUserId = getTestUserKeycloakUserId();
	return await loadUserByKeycloakUserId(
		db,
		{
			user: { keycloakUserId: testUserKeycloakUserId },
			role: { isAdministrator: false },
		},
		testUserKeycloakUserId,
	);
};

export const getAuthContext = (
	user: User,
	isAdministrator = false,
): AuthContext => ({
	user,
	role: {
		isAdministrator,
	},
});

export const getTestAuthContext = async (
	isAdministrator = true,
): Promise<AuthContext> =>
	getAuthContext(await loadTestUser(), isAdministrator);

export const getMockNextFunction = (): jest.Mock<void, unknown[]> =>
	jest.fn((): void => undefined);

export const NO_OFFSET = 0;

export const NO_LIMIT = undefined;
