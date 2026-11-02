import type { TinyPg } from 'tinypg';

const generateDeleteManyOperation =
	<R extends object, T, P extends [...args: unknown[]]>(
		queryName: string,
		parameterNames: { [K in keyof P]: string },
		rowPostProcessor: (row: R, index: number, rows: R[]) => T,
	) =>
	async (db: Pick<TinyPg, 'sql'>, ...args: [...P]): Promise<T[]> => {
		const queryParameters = parameterNames.reduce(
			(acc, parameterName, index) => ({
				...acc,
				[parameterName]: args[index],
			}),
			{},
		);
		const { rows } = await db.sql<R>(queryName, queryParameters);
		return rows.map(rowPostProcessor);
	};

export { generateDeleteManyOperation };
