interface ConflictErrorDetails {
	entityType: string;
	entityId?: number;
	entityShortCode?: string;
	contextEntityType?: string;
	contextEntityId?: number;
	contextEntityShortCode?: string;
}

export class InputConflictError extends Error {
	public details: ConflictErrorDetails;

	public constructor(message: string, details: ConflictErrorDetails) {
		super(message);
		this.name = 'InputConflictError';
		this.details = details;
	}
}
