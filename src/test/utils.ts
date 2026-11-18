import { setImmediate } from 'node:timers/promises';
import { loadUserByKeycloakUserId } from '../database';
import {
	getScopesForContextEntityType,
	nonNullKeycloakIdToString,
	PermissionGrantEntityType,
	PermissionGrantVerb,
	stringToKeycloakId,
} from '../types';
import type { AuthContext, KeycloakId, User } from '../types';
import type { TinyPg } from 'tinypg';

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
	syncedFromKeycloakAt: null,
	disabledAt: null,
});

export const getTestAuthContextId = (
	user: Pick<User, 'keycloakUserId'>,
): string => nonNullKeycloakIdToString(user.keycloakUserId);

export const createTestUserAuthContext = async (
	db: Pick<TinyPg, 'query'>,
	user: Pick<User, 'keycloakUserId'>,
): Promise<void> => {
	await db.query(
		`INSERT INTO ephemeral_auth_contexts (
			token_id,
			user_keycloak_user_id,
			not_after
		) VALUES (:tokenId, :userKeycloakUserId, 'infinity')
		ON CONFLICT DO NOTHING;`,
		{
			tokenId: getTestAuthContextId(user),
			userKeycloakUserId: user.keycloakUserId,
		},
	);
};

export const loadTestUser = async (db: Pick<TinyPg, 'sql'>): Promise<User> =>
	await loadUserByKeycloakUserId(db, null, getTestUserKeycloakUserId());

export const getAuthContext = (
	user: User,
	isAdministrator = false,
	canViewUsersInKeycloak = false,
	canViewOrganizationsInKeycloak = false,
): AuthContext => ({
	authContextId: getTestAuthContextId(user),
	user,
	role: {
		isAdministrator,
		canViewUsersInKeycloak,
		canViewOrganizationsInKeycloak,
	},
});

export const getTestAuthContext = async (
	db: Pick<TinyPg, 'sql'>,
	isAdministrator = true,
): Promise<AuthContext> =>
	getAuthContext(await loadTestUser(db), isAdministrator);

export const getMockNextFunction = (): jest.Mock<void, unknown[]> =>
	jest.fn((): void => undefined);
export const ALL_VERBS = Object.values(PermissionGrantVerb);

export const getFullPermissionsMap = (
	contextEntityType: PermissionGrantEntityType,
	verbs: PermissionGrantVerb[] = ALL_VERBS,
): Record<string, PermissionGrantVerb[]> =>
	Object.fromEntries(
		getScopesForContextEntityType(contextEntityType)
			.filter((scope) => scope !== PermissionGrantEntityType.ANY)
			.map((scope) => [scope, verbs]),
	);
