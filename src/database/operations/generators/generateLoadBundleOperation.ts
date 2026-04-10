import { createServiceQueryAuditLog } from '../serviceQueryAuditLogs';
import {
	getIsAdministratorFromAuthContext,
	getKeycloakUserIdFromAuthContext,
} from '../../../types';
import type {
	AuthIdentityAndRole,
	Bundle,
	PaginatedJsonResultSet,
} from '../../../types';
import type { TinyPg } from 'tinypg';

/**
 * Generates a bundle loader function for a specific query.
 *
 * @template T - The type of the entries in the bundle.
 * @template P - The type of the parameters for the query. Use labeled tuples so the generated function has a pretty type definition.
 *
 * @param {string} queryName - The name of the query to execute.
 * @param {Object} parameterNames - An object mapping parameter indices to their names within the query.
 *
 * @returns {Function} A function that takes query parameters, limit, and offset, and returns a promise that resolves to a bundle of entries and total count.
 */
const generateLoadBundleOperation = <T, P extends [...args: unknown[]]>(
	queryName: string,
	parameterNames: { [K in keyof P]: string },
	itemPostProcessor: (item: T) => T | Promise<T> = (item: T) => item,
) => {
	const generatedParameterNames = [...parameterNames, 'limit', 'offset'];
	return async (
		db: Pick<TinyPg, 'sql' | 'query'>,
		authContext: AuthIdentityAndRole | null,
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
		const { rows } = await db.sql<PaginatedJsonResultSet<T>>(
			queryName,
			queryParameters,
		);
		const [firstRow] = rows;
		const total = Number(firstRow?.total ?? '0');
		const entries = (
			await Promise.all(
				rows.map(async (row) =>
					row.object === null ? null : await itemPostProcessor(row.object),
				),
			)
		).filter((entry): entry is Awaited<T> => entry !== null);
		await createServiceQueryAuditLog(db, authContext, {
			queryName,
			queryParameters,
		});
		return {
			entries,
			total,
		};
	};
};

export { generateLoadBundleOperation };
