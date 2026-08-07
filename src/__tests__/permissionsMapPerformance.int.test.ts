import { getDatabase } from '../database';
import {
	getAuthContext,
	getTestUserKeycloakUserId,
	loadTestUser,
} from '../test/utils';
import { createTestChangemaker } from '../test/factories';
import type { TinyPg } from 'tinypg';
import type { KeycloakId } from '../types';

const PAGE_SIZE = 25;
const SMALL_GRANT_COUNT = 200;
const LARGE_GRANT_COUNT = 4000;
const MAX_BUFFER_GROWTH_RATIO = 3;

interface ExplainPlanNode {
	'Shared Hit Blocks'?: number;
	'Shared Read Blocks'?: number;
}

interface ExplainEntry {
	Plan: ExplainPlanNode;
}

interface ExplainRow {
	'QUERY PLAN': ExplainEntry[];
}

const seedGrantsOutsidePage = async (
	db: TinyPg,
	createdBy: KeycloakId,
	changemakerId: number,
	count: number,
): Promise<void> => {
	await db.query(
		`INSERT INTO permission_grants (
			context_entity_type, changemaker_id, grantee_type,
			grantee_user_keycloak_user_id, verbs, scope, created_by)
		SELECT
			'changemaker', :changemakerId, 'user', gen_random_uuid(),
			ARRAY['view']::permission_grant_verb_t [],
			ARRAY['changemaker']::permission_grant_entity_type_t [],
			:createdBy
		FROM generate_series(1, :count) AS g`,
		{ changemakerId, createdBy, count },
	);
	await db.query('ANALYZE permission_grants');
};

const measurePageBuffers = async (
	db: TinyPg,
	keycloakUserId: KeycloakId,
): Promise<number> => {
	const { rows } = await db.query<ExplainRow>(
		`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
		SELECT * FROM build_changemakers_results(
			array(
				SELECT changemakers
				FROM changemakers
				ORDER BY changemakers.id DESC
				LIMIT ${String(PAGE_SIZE)}
			),
			:keycloakUserId::uuid,
			FALSE
		)`,
		{ keycloakUserId },
	);
	const plan = rows[0]?.['QUERY PLAN'][0]?.Plan;
	return (
		(plan?.['Shared Hit Blocks'] ?? 0) + (plan?.['Shared Read Blocks'] ?? 0)
	);
};

describe('resolved permissions performance', () => {
	it('resolves a page of changemakers without scanning every permission grant', async () => {
		const db = getDatabase();
		const testUser = await loadTestUser(db);
		const authContext = getAuthContext(testUser);
		const keycloakUserId = getTestUserKeycloakUserId();

		const changemakerOutsidePage = await createTestChangemaker(db, authContext);
		await Promise.all(
			Array.from(
				{ length: PAGE_SIZE },
				async () => await createTestChangemaker(db, authContext),
			),
		);

		await seedGrantsOutsidePage(
			db,
			keycloakUserId,
			changemakerOutsidePage.id,
			SMALL_GRANT_COUNT,
		);
		const smallTableBuffers = await measurePageBuffers(db, keycloakUserId);

		await seedGrantsOutsidePage(
			db,
			keycloakUserId,
			changemakerOutsidePage.id,
			LARGE_GRANT_COUNT - SMALL_GRANT_COUNT,
		);
		const largeTableBuffers = await measurePageBuffers(db, keycloakUserId);

		expect(largeTableBuffers).toBeLessThan(
			smallTableBuffers * MAX_BUFFER_GROWTH_RATIO,
		);
	});
});
