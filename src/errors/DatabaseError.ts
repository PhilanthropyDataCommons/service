import type { TinyPgErrorWithQueryContext } from '../types';

export class DatabaseError extends Error {
	public tinyPgError: TinyPgErrorWithQueryContext;

	public constructor(
		message: string,
		tinyPgError: TinyPgErrorWithQueryContext,
	) {
		super(message);
		this.name = this.constructor.name;
		this.tinyPgError = tinyPgError;
	}
}
