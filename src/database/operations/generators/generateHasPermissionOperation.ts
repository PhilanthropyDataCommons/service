import {
	getIsAdministratorFromAuthContext,
	getKeycloakUserIdFromAuthContext,
} from '../../../types';
import type { AuthIdentityAndRole, PermissionGrantVerb } from '../../../types';
import type TinyPg from 'tinypg';

interface HasPermissionResult {
	hasPermission: boolean;
}

/**
 * Generates a permission check operation for a specific entity type.
 *
 * @param queryName - The name of the SQL query to execute (e.g., 'authorization.hasChangemakerPermission')
 * @param entityIdParamName - The parameter name for the entity ID in the query (e.g., 'changemakerId')
 *
 * @returns A function that checks if a user has the specified permission on the entity.
 */
const generateHasPermissionOperation =
	(queryName: string, entityIdParamName: string) =>
	async (
		db: TinyPg,
		authContext: AuthIdentityAndRole | null,
		entityId: unknown,
		permission: PermissionGrantVerb,
	): Promise<boolean> => {
		const authContextKeycloakUserId =
			getKeycloakUserIdFromAuthContext(authContext);
		const authContextIsAdministrator =
			getIsAdministratorFromAuthContext(authContext);
		const {
			rows: [row],
		} = await db.sql<HasPermissionResult>(queryName, {
			userKeycloakUserId: authContextKeycloakUserId,
			isAdministrator: authContextIsAdministrator,
			[entityIdParamName]: entityId,
			permission,
		});
		return row?.hasPermission ?? false;
	};

export { generateHasPermissionOperation };
