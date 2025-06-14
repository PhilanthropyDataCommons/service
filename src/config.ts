import { db, loadSystemUser } from './database';
import { InternalValidationError } from './errors';
import type { User } from './types';

let systemUser: User | null = null;

export const loadConfig = async (): Promise<void> => {
	systemUser = await loadSystemUser(db, null);
};

export const getSystemUser = (): User => {
	if (systemUser === null) {
		throw new InternalValidationError('System user not loaded', []);
	}
	return systemUser;
};
