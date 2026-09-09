import { allNoLeaks } from '../../../promises';
import { loadDefaultPermissionGrantBundle } from '../defaultPermissionGrants';
import { createPermissionGrant } from './createPermissionGrant';
import type {
	AuthIdentityAndRole,
	PermissionGrantContextEntity,
} from '../../../types';
import type { TinyPg } from 'tinypg';

// Every default permission grant for a context entity type applies to a new
// entity of that type, so the bundle is loaded unpaginated.
const NO_LIMIT = undefined;
const NO_OFFSET = 0;

/**
 * Creates, against a newly created entity, the permission grant that each
 * default permission grant registered for that entity's type describes.
 */
const applyDefaultPermissionGrants = async (
	db: Pick<TinyPg, 'sql' | 'query'>,
	authContext: AuthIdentityAndRole | null,
	contextEntity: PermissionGrantContextEntity,
): Promise<void> => {
	const { entries: defaultPermissionGrants } =
		await loadDefaultPermissionGrantBundle(
			db,
			authContext,
			contextEntity.contextEntityType,
			NO_LIMIT,
			NO_OFFSET,
		);
	await allNoLeaks(
		defaultPermissionGrants.map(
			async (defaultPermissionGrant) =>
				await createPermissionGrant(db, authContext, {
					...defaultPermissionGrant,
					...contextEntity,
				}),
		),
	);
};

export { applyDefaultPermissionGrants };
