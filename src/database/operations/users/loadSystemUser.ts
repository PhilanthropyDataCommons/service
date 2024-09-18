import { loadUserByAuthenticationId } from './loadUserByAuthenticationId';
import type { User } from '../../../types';

const loadSystemUser = async (): Promise<User> =>
	loadUserByAuthenticationId('');

export { loadSystemUser };
