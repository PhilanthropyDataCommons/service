import type TinyPg from 'tinypg';
import type { AuthIdentityAndRole } from '../../../types';

const createServiceQueryAuditLog = async (
	db: TinyPg,
	authContext: AuthIdentityAndRole | null,
	createValues: {
		queryName: string;
		queryParameters: object;
	},
): Promise<void> => {
	await db.sql<object>('serviceQueryAuditLogs.insertOne', {
		authContextKeycloakUserId: authContext?.user.keycloakUserId,
		authContextIsAdministrator: authContext?.role.isAdministrator,
		queryName: createValues.queryName,
		queryParameters: createValues.queryParameters,
	});
};

export { createServiceQueryAuditLog };
