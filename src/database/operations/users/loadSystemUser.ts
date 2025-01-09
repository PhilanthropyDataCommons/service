import { generateLoadItemOperation } from '../generators';
import type { User } from '../../../types';

const loadSystemUser = generateLoadItemOperation<User, []>(
	'users.selectSystemUser',
	'User',
	[],
);

export { loadSystemUser };
