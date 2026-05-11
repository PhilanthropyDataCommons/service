import { createServiceQueryAuditLog } from '../serviceQueryAuditLogs';
import { NoDataReturnedError } from '../../../errors/NoDataReturnedError';
import {
	getIsAdministratorFromAuthContext,
	getKeycloakUserIdFromAuthContext,
} from '../../../types';
import type {
	AuthIdentityAndRole,
	UpsertJsonResultSet,
	UpsertResult,
} from '../../../types';
import type { TinyPg } from 'tinypg';

// This may seem silly but it is necessary to get all keys of all
// possible types in the event the type is a Union (e.g. A | B | C)
type KeysOfUnion<T> = T extends T ? keyof T : never;

/**
 * Generates an item upsert function for a specific query.
 *
 * @template T - The type of the item being upserted.
 * @template I - The type of object to be passed for data insertion.
 * @template P - The type of the parameters for the query. Use labeled tuples so the generated function has a pretty type definition.
 *
 * @param {string} queryName - The name of the query to execute.
 * @param {Array<string>} saveItemAttributes - The attribute names which should be converted to query parameters.
 * @param {Array<string>} parameterNames - A tuple of parameter names, positionally aligned with the query's positional arguments.
 *
 * @returns {Function} An asynchronous function that takes query parameters, upserts an item, and returns the upserted item along with a `wasInserted` flag indicating whether the row was newly inserted.
 */
const generateUpsertItemOperation =
	<T, I extends Record<string, unknown>, P extends [...args: unknown[]]>(
		queryName: string,
		saveItemAttributes: Array<KeysOfUnion<I>>,
		parameterNames: { [K in keyof P]: string },
		itemPostProcessor: (item: T) => T | Promise<T> = (item: T) => item,
	) =>
	async (
		db: Pick<TinyPg, 'sql'>,
		authContext: AuthIdentityAndRole | null,
		createValues: I,
		...args: [...P]
	): Promise<UpsertResult<T>> => {
		const authContextKeycloakUserId =
			getKeycloakUserIdFromAuthContext(authContext);
		const authContextIsAdministrator =
			getIsAdministratorFromAuthContext(authContext);
		const authenticationQueryParameters = {
			authContextKeycloakUserId,
			authContextIsAdministrator,
		};
		const savedItemAttributeQueryParameters = saveItemAttributes.reduce(
			(acc, attribute) => {
				const { [attribute]: value } = createValues;
				return {
					...acc,
					[attribute]: value,

					// tinypg / pg converts `undefined` and `null` to `NULL`; this attributes allows
					// a query to optionally handle the two cases in different ways, e.g. in the context
					// of a patch query with nullable fields.
					[`${attribute}WasProvided`]: value !== undefined,
				};
			},
			{},
		);
		const operationQueryParameters = parameterNames.reduce(
			(acc, parameterName, index) => ({
				...acc,
				[parameterName]: args[index],
			}),
			{},
		);
		const queryParameters = {
			...authenticationQueryParameters,
			...savedItemAttributeQueryParameters,
			...operationQueryParameters,
		};

		const result = await db.sql<UpsertJsonResultSet<T>>(
			queryName,
			queryParameters,
		);
		const {
			rows: [wrappedObject],
		} = result;
		if (wrappedObject === undefined) {
			throw new NoDataReturnedError(
				'The database did not return a query result.',
			);
		}
		await createServiceQueryAuditLog(db, authContext, {
			queryName,
			queryParameters,
		});
		const { object, wasInserted } = wrappedObject;
		return {
			item: await itemPostProcessor(object),
			wasInserted,
		};
	};

export { generateUpsertItemOperation };
