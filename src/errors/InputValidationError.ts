import { ValidationError } from './ValidationError';
import type { ErrorObject } from 'ajv';

export class InputValidationError extends ValidationError {
	public constructor(message: string, errors: ErrorObject[]) {
		super(message, errors);
		this.name = 'InputValidationError';
	}
}
