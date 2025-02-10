import {
	getIsAdministratorFromAuthContext,
	getKeycloakUserIdFromAuthContext,
} from '../../../types';
import type { AuthContext } from '../../../types';
import type TinyPg from 'tinypg';

/**
 * Generates an entity removal function run via a specific query.
 *
 * @template P - The type of the parameters for the query. Use labeled tuples so the generated function has a pretty type definition.
 *
 * @param {string} queryName - The name of the query to execute.
 * @param {Object} parameterNames - An object mapping parameter indices to their names within the query.
 *
 * @returns {Function} A function that takes query parameters and returns the total number of rows removed.
 */
const generateRemoveOperation =
	<P extends [...args: unknown[]]>(
		queryName: string,
		parameterNames: { [K in keyof P]: string },
	) =>
	async (
		db: TinyPg,
		authContext: AuthContext | null,
		...args: [...P]
	): Promise<number> => {
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

		const result = await db.sql(queryName, queryParameters);
		return result.rows.length;
	};

export { generateRemoveOperation };
