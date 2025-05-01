import TinyPg from 'tinypg';
import { AuthContext } from '../../../types';

export const createDbOperationAuditLog = async (
	db: TinyPg,
	authContext: AuthContext | null,
	createValues: {
		queryName: string;
		queryParameters: object;
	},
): Promise<void> => {
	await db.sql('dbOperationAuditLogs.insertOne', {
		authContextKeycloakUserId: authContext?.user?.keycloakUserId,
		authContextIsAdministrator: authContext?.role?.isAdministrator,
		queryName: createValues.queryName,
		queryParameters: createValues.queryParameters,
	});
};
