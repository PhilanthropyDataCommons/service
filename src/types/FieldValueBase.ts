import type { File } from './File';
import type { Id } from './Id';

interface FieldValueBase {
	readonly id: Id;
	value: string;
	readonly file: File | null;
	goodAsOf: string | null;
	readonly isValid: boolean;
	readonly createdAt: string;
}

export { type FieldValueBase };
