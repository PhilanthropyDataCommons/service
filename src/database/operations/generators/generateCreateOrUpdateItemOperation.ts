import { db as defaultDb } from '../../db';
import {
	getIsAdministratorFromAuthContext,
	getKeycloakUserIdFromAuthContext,
} from '../../../types';
import type { AuthContext, JsonResultSet } from '../../../types';

// This may seem silly but it is necessary to get all keys of all
// possible types in the event the type is a Union (e.g. A | B | C)
type KeysOfUnion<T> = T extends T ? keyof T : never;

/**
 * Generates a function that will invoke a specific query for data insertion
 *
 * @template T - The type of the item being created.
 * @template I - The type of object to be passed for data insertion.
 *
 * @param {string} queryName - The name of the query to execute.
 * @param {Object} savedAttributes - A list of the attribute names which should be converted to query parameters.
 *
 * @returns {Function} A function that takes query parameters, limit, and offset, and returns a promise that resolves to a bundle of entries and total count.
 */
const generateCreateOrUpdateItemOperation =
	<T, P extends Record<string, unknown>>(
		queryName: string,
		savedAttributes: KeysOfUnion<P>[],
	) =>
	async (
		authContext: AuthContext | null,
		createValues: P,
		db = defaultDb,
	): Promise<T> => {
		const authContextKeycloakUserId =
			getKeycloakUserIdFromAuthContext(authContext);
		const authContextIsAdministrator =
			getIsAdministratorFromAuthContext(authContext);
		const queryParameters = savedAttributes.reduce(
			(acc, attribute) => ({
				...acc,
				[attribute]: createValues[attribute],
			}),
			{
				authContextKeycloakUserId,
				authContextIsAdministrator,
			},
		);

		const result = await db.sql<JsonResultSet<T>>(queryName, queryParameters);
		const { object } = result.rows[0] ?? {};
		if (object === undefined) {
			throw new Error('The database did not return a query result.');
		}
		return object;
	};

export { generateCreateOrUpdateItemOperation };
