import TinyPg from 'tinypg';
import { AuthContext } from '../../../types';

const createServiceQueryAuditLog = async (
	db: TinyPg,
	authContext: AuthContext | null,
	createValues: {
		queryName: string;
		queryParameters: object;
	},
): Promise<void> => {
	await db.sql<object>('serviceQueryAuditLogs.insertOne', {
		authContextKeycloakUserId: authContext?.user?.keycloakUserId,
		authContextIsAdministrator: authContext?.role?.isAdministrator,
		queryName: createValues.queryName,
		queryParameters: createValues.queryParameters,
	});
};

export { createServiceQueryAuditLog };
