import type { File } from './File';

interface FieldValueBase {
	readonly id: number;
	value: string;
	readonly file: File | null;
	goodAsOf: string | null;
	readonly isValid: boolean;
	readonly createdAt: string;
}

export { type FieldValueBase };
