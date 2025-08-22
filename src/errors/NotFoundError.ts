import type { Uuid } from '../types';

interface NotFoundErrorDetailsWithShortCode {
	entityType: string;
	entityShortCode: string;
}

interface NotFoundErrorDetailsWithId {
	entityType: string;
	entityId: number;
}

interface NotFoundErrorDetailsWithUuid {
	entityType: string;
	entityUuid: Uuid;
}

interface NotFoundErrorDetailsWithComplexPrimaryKey {
	entityType: string;
	entityPrimaryKey: Record<string, number | string>;
}

interface NotFoundErrorDetailsWithLookupValues {
	entityType: string;
	lookupValues: Record<string, unknown>;
}

type NotFoundErrorDetails =
	| NotFoundErrorDetailsWithShortCode
	| NotFoundErrorDetailsWithId
	| NotFoundErrorDetailsWithUuid
	| NotFoundErrorDetailsWithComplexPrimaryKey
	| NotFoundErrorDetailsWithLookupValues;

export class NotFoundError extends Error {
	public details: NotFoundErrorDetails;

	public constructor(
		message: string,
		details: NotFoundErrorDetails,
		options?: object,
	) {
		super(message, options);
		this.name = 'NotFoundError';
		this.details = details;
	}
}
