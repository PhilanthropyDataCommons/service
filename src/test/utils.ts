import { db, createOrUpdateUser, loadUserByKeycloakUserId } from '../database';
import { stringToKeycloakId } from '../types';
import type { User } from '../types';

export const isoTimestampPattern =
	/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|(\+|-)\d{2}:\d{2})$/;

export const expectTimestamp = expect.stringMatching(
	isoTimestampPattern,
) as string;

// Because expressjwt does not synchronously call next, but rather calls setImmediate(next),
// send another call to setImmediate to make sure previous calls to setImmediate have made it
// through the event loop. Otherwise jest misses the call (it hasn't happened yet). Kudos:
// https://stackoverflow.com/questions/41792927/jest-tests-cant-fail-within-setimmediate-or-process-nexttick-callback#answer-59604256
export const allowNextToResolve = async () => new Promise(setImmediate);

export const generateNextWithAssertions = (
	runAssertions: (err?: unknown) => Promise<void>,
	done: jest.DoneCallback,
) =>
	jest.fn((err?) => {
		runAssertions(err).then(done).catch(done);
	});

export const getTestUserKeycloakUserId = () =>
	stringToKeycloakId('11111111-1111-1111-1111-111111111111'); // This value is not a reference, it's just a static GUID

export const createTestUser = async () =>
	createOrUpdateUser(db, null, {
		keycloakUserId: getTestUserKeycloakUserId(),
	});

export const loadTestUser = async () =>
	loadUserByKeycloakUserId(db, null, getTestUserKeycloakUserId());

export const getAuthContext = (user: User, isAdministrator = false) => ({
	user,
	role: {
		isAdministrator,
	},
});

export const getTestAuthContext = async (isAdministrator = true) =>
	getAuthContext(await loadTestUser(), isAdministrator);

export const NO_OFFSET = 0;

export const NO_LIMIT = undefined;
