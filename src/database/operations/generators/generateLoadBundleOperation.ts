import { createServiceQueryAuditLog } from '../serviceQueryAuditLogs';
import { loadTableMetrics } from '../generic/loadTableMetrics';
import {
	getIsAdministratorFromAuthContext,
	getKeycloakUserIdFromAuthContext,
} from '../../../types';
import type { AuthContext, Bundle, JsonResultSet } from '../../../types';
import type TinyPg from 'tinypg';

/**
 * Generates a bundle loader function for a specific query and table.
 *
 * @template T - The type of the entries in the bundle.
 * @template P - The type of the parameters for the query. Use labeled tuples so the generated function has a pretty type definition.
 *
 * @param {string} queryName - The name of the query to execute.
 * @param {string} tableName - The name of the table to load metrics from.
 * @param {Object} parameterNames - An object mapping parameter indices to their names within the query.
 *
 * @returns {Function} A function that takes query parameters, limit, and offset, and returns a promise that resolves to a bundle of entries and total count.
 */
const generateLoadBundleOperation = <T, P extends [...args: unknown[]]>(
	queryName: string,
	tableName: string,
	parameterNames: { [K in keyof P]: string },
) => {
	const generatedParameterNames = [...parameterNames, 'limit', 'offset'];
	return async (
		db: TinyPg,
		authContext: AuthContext | null,
		...args: [...P, limit: number | undefined, offset: number | undefined]
	): Promise<Bundle<T>> => {
		const queryParameters = generatedParameterNames.reduce(
			(acc, parameterName, index) => ({
				...acc,
				[parameterName]: args[index],
			}),
			{
				authContextKeycloakUserId:
					getKeycloakUserIdFromAuthContext(authContext),
				authContextIsAdministrator:
					getIsAdministratorFromAuthContext(authContext),
			},
		);
		const result = await db.sql<JsonResultSet<T>>(queryName, queryParameters);
		const entries = result.rows.map((row) => row.object);
		const metrics = await loadTableMetrics(tableName);
		await createServiceQueryAuditLog(db, authContext, {
			queryName,
			queryParameters,
		});
		return {
			entries,
			total: metrics.count,
		};
	};
};

export { generateLoadBundleOperation };
