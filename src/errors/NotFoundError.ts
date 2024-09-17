interface NotFoundErrorDetailsWithShortCode {
	entityType: string;
	entityShortCode: string;
}

interface NotFoundErrorDetailsWithId {
	entityType: string;
	entityId: number;
}

interface NotFoundErrorDetailsWithComplexPrimaryKey {
	entityType: string;
	entityPrimaryKey: Record<string, number | string>;
}

interface NotFoundErrorDetailsWithLookupValues {
	entityType: string;
	lookupValues: Record<string, number | string>;
}

type NotFoundErrorDetails =
	| NotFoundErrorDetailsWithShortCode
	| NotFoundErrorDetailsWithId
	| NotFoundErrorDetailsWithComplexPrimaryKey
	| NotFoundErrorDetailsWithLookupValues;

export class NotFoundError extends Error {
	public details: NotFoundErrorDetails;

	public constructor(message: string, details: NotFoundErrorDetails) {
		super(message);
		this.name = this.constructor.name;
		this.details = details;
	}
}
