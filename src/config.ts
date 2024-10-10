import { loadSystemUser } from './database';
import { InternalValidationError } from './errors';
import type { User } from './types';

let systemUser: User | null = null;

export const loadConfig = async () => {
	systemUser = await loadSystemUser();
};

export const getSystemUser = (): User => {
	if (systemUser === null) {
		throw new InternalValidationError('System user not loaded', []);
	}
	return systemUser;
};
