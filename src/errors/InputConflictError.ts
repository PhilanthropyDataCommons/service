interface ConflictErrorDetails {
	entityType: string;
	entityId: number;
	contextEntityType?: string;
	contextEntityId?: number;
}

export class InputConflictError extends Error {
	public details: ConflictErrorDetails;

	public constructor(message: string, details: ConflictErrorDetails) {
		super(message);
		this.name = 'InputConflictError';
		this.details = details;
	}
}
