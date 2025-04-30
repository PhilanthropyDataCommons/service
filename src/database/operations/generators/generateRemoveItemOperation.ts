import { createDbOperationAuditLog } from '../dbOperationAuditLogs/createDbOperationAuditLog';
import { NotFoundError } from '../../../errors';
import {
	getIsAdministratorFromAuthContext,
	getKeycloakUserIdFromAuthContext,
} from '../../../types';
import type { AuthContext, JsonResultSet } from '../../../types';
import type TinyPg from 'tinypg';

/**
 * Generates an item deletion function for a specific query and table.
 *
 * @template T - The type of the item being deleted.
 * @template P - The type of the parameters for the query. Use labeled tuples so the generated function has a pretty type definition.
 *
 * @param {string} queryName - The name of the query to execute.
 * @param {string} entityType - The name of entity type being loaded, for use in error messages.
 * @param {Object} parameterNames - An object mapping parameter indices to their names within the query.
 *
 * @returns {Function} An asynchronous function that takes query parameters, removes an item, and returns the removed item.
 */
const generateRemoveItemOperation =
	<T, P extends [...args: unknown[]]>(
		queryName: string,
		entityType: string,
		parameterNames: { [K in keyof P]: string },
	) =>
	async (
		db: TinyPg,
		authContext: AuthContext | null,
		...args: [...P]
	): Promise<T> => {
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
			throw new NotFoundError(
				`The item did not exist and could not be deleted`,
				{
					entityType,
					lookupValues: queryParameters,
				},
			);
		} else {
			await createDbOperationAuditLog(db, authContext, {
				queryName,
				queryParameters,
			});
		}
		return object;
	};

export { generateRemoveItemOperation };
