import { hasSourcePermission, loadSource } from '../database';
import { PermissionGrantEntityType, PermissionGrantVerb } from '../types';
import { ForbiddenError } from '../errors';
import type { TinyPg } from 'tinypg';
import type { AuthContext, Id } from '../types';

/**
 * Loading the source before throwing keeps a caller who cannot see the source
 * at all on the `NotFoundError` path, so a `ForbiddenError` never reveals that
 * an otherwise invisible source exists.
 */
const assertSourceIsReferenceable = async (
	db: TinyPg,
	authContext: AuthContext,
	sourceId: Id,
): Promise<void> => {
	if (
		!(await hasSourcePermission(db, authContext, {
			sourceId,
			permission: PermissionGrantVerb.REFERENCE,
			scope: PermissionGrantEntityType.SOURCE,
		}))
	) {
		await loadSource(db, authContext, sourceId);
		throw new ForbiddenError(
			'Authenticated user does not have permission to reference the specified source.',
		);
	}
};

export { assertSourceIsReferenceable };
