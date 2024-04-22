import { loadBundle } from './loadBundle';
import type { JsonResultSet, Bundle, User, AuthContext } from '../../../types';

export const loadUserBundle = async (
	queryParameters: {
		offset: number;
		limit: number;
		authenticationId?: string;
	},
	authContext?: AuthContext,
): Promise<Bundle<User>> => {
	const defaultQueryParameters = {
		authenticationId: '',
		userId: 0,
		isAdministrator: false,
	};
	const { offset, limit, authenticationId } = queryParameters;
	const userId = authContext?.user.id;
	const isAdministrator = authContext?.role.isAdministrator;

	const bundle = await loadBundle<JsonResultSet<User>>(
		'users.selectWithPagination',
		{
			...defaultQueryParameters,
			offset,
			limit,
			authenticationId,
			userId,
			isAdministrator,
		},
		'users',
	);
	const entries = bundle.entries.map((entry) => entry.object);
	return {
		...bundle,
		entries,
	};
};
