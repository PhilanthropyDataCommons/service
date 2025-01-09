import { db } from '../../db';
import { NotFoundError } from '../../../errors';
import {
	getIsAdministratorFromAuthContext,
	getKeycloakUserIdFromAuthContext,
} from '../../../types';
import type { AuthContext, JsonResultSet } from '../../../types';

/**
 * Generates an item loader function for a specific query and table.
 *
 * @template T - The type of the item being loaded.
 * @template P - The type of the parameters for the query. Use labeled tuples so the generated function has a pretty type definition.
 *
 * @param {string} queryName - The name of the query to execute.
 * @param {string} entityType - The name of entity type being loaded, for use in error messages.
 * @param {Object} parameterNames - An object mapping parameter indices to their names within the query.
 *
 * @returns {Function} A function that takes query parameters, limit, and offset, and returns a promise that resolves to a bundle of entries and total count.
 */
const generateLoadItemOperation =
	<T, P extends [...args: unknown[]]>(
		queryName: string,
		entityType: string,
		parameterNames: { [K in keyof P]: string },
	) =>
	async (authContext: AuthContext | null, ...args: [...P]): Promise<T> => {
		const authContextKeycloakUserId =
			getKeycloakUserIdFromAuthContext(authContext);
		const authContextIsAdministrator =
			getIsAdministratorFromAuthContext(authContext);
		const queryParameters = parameterNames.reduce(
			(acc, parameterName, index) => ({
				...acc,
				[parameterName]: args[index],
			}),
			{
				authContextKeycloakUserId,
				authContextIsAdministrator,
			},
		);

		const result = await db.sql<JsonResultSet<T>>(queryName, queryParameters);
		const { object } = result.rows[0] ?? {};
		if (object === undefined) {
			throw new NotFoundError(`Entity not found`, {
				entityType,
				lookupValues: queryParameters,
			});
		}
		return object;
	};

export { generateLoadItemOperation };
