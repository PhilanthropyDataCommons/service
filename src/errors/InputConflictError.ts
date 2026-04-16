import type { Id } from '../types';

interface ConflictErrorDetails {
	entityType: string;
	entityId?: Id;
	entityShortCode?: string;
	contextEntityType?: string;
	contextEntityId?: Id;
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
