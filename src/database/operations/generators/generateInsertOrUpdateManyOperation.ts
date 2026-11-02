import type { TinyPg } from 'tinypg';

const generateInsertOrUpdateManyOperation =
	<R extends object, T, P extends [...args: unknown[]]>(
		queryName: string,
		listParamName: string,
		parameterNames: { [K in keyof P]: string },
		rowPostProcessor: (row: R, index: number, rows: R[]) => T,
	) =>
	async (
		db: Pick<TinyPg, 'sql'>,
		listed: object[],
		...args: [...P]
	): Promise<T[]> => {
		const queryParameters = parameterNames.reduce(
			(acc, parameterName, index) => ({
				...acc,
				[parameterName]: args[index],
			}),
			{},
		);
		const { rows } = await db.sql<R>(queryName, {
			...queryParameters,
			[listParamName]: JSON.stringify(listed),
		});
		return rows.map(rowPostProcessor);
	};

export { generateInsertOrUpdateManyOperation };
