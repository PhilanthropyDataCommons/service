import { createServiceQueryAuditLog } from '../serviceQueryAuditLogs';
import {
	contextEntityKeyProperties,
	getKeycloakUserIdFromAuthContext,
} from '../../../types';
import type {
	AuthIdentityAndRole,
	PermissionGrantContextEntity,
} from '../../../types';
import type { TinyPg } from 'tinypg';

const QUERY_NAME = 'permissionGrants.insertFromDefaults';

const unsetContextEntityKeys = Object.fromEntries(
	Object.values(contextEntityKeyProperties).map(({ keyName }) => [
		keyName,
		null,
	]),
);

const applyDefaultPermissionGrants = async (
	db: Pick<TinyPg, 'sql'>,
	authContext: AuthIdentityAndRole | null,
	contextEntity: PermissionGrantContextEntity,
): Promise<void> => {
	const queryParameters = {
		...unsetContextEntityKeys,
		...contextEntity,
		authContextKeycloakUserId: getKeycloakUserIdFromAuthContext(authContext),
	};
	await db.sql(QUERY_NAME, queryParameters);
	await createServiceQueryAuditLog(db, authContext, {
		queryName: QUERY_NAME,
		queryParameters,
	});
};

export { applyDefaultPermissionGrants };
