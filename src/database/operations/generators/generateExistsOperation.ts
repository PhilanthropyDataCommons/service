import {
	getIsAdministratorFromAuthContext,
	getKeycloakUserIdFromAuthContext,
} from '../../../types';
import type { AuthIdentityAndRole } from '../../../types';
import type { TinyPg } from 'tinypg';

interface ExistsResult {
	result: boolean;
}

// This may seem silly but it is necessary to get all keys of all
// possible types in the event the type is a Union (e.g. A | B | C)
type KeysOfUnion<T> = T extends T ? keyof T : never;

/**
 * Generates an operation that executes a SQL query expected to return a single
 * boolean column aliased as "result" and resolves to that value (or false if
 * no row was returned).
 *
 * The auth context is supplied to the query automatically as
 * `authContextKeycloakUserId` and `authContextIsAdministrator`. Each name in
 * `inputAttributes` becomes a named query parameter; the corresponding value
 * is read from the caller-supplied `input` object, and any attribute the
 * input does not provide is bound as NULL.
 *
 * @param queryName - The name of the SQL query to execute.
 * @param inputAttributes - Attribute names on the input object that should
 *   become named query parameters.
 *
 * @returns A function that, given a database handle, an auth context, and the
 *   input object, resolves to the boolean result of the query.
 */
const generateExistsOperation =
	<I extends Record<string, unknown>>(
		queryName: string,
		inputAttributes: ReadonlyArray<KeysOfUnion<I>>,
	): ((
		db: Pick<TinyPg, 'sql'>,
		authContext: AuthIdentityAndRole | null,
		input: I,
	) => Promise<boolean>) =>
	async (db, authContext, input): Promise<boolean> => {
		const inputAttributeQueryParameters = inputAttributes.reduce<
			Record<string, unknown>
		>((acc, attribute) => {
			const { [attribute]: value } = input as Record<KeysOfUnion<I>, unknown>;
			return {
				...acc,
				[attribute]: value,
			};
		}, {});
		const {
			rows: [row],
		} = await db.sql<ExistsResult>(queryName, {
			authContextKeycloakUserId: getKeycloakUserIdFromAuthContext(authContext),
			authContextIsAdministrator:
				getIsAdministratorFromAuthContext(authContext),
			...inputAttributeQueryParameters,
		});
		return row?.result ?? false;
	};

export { generateExistsOperation };
