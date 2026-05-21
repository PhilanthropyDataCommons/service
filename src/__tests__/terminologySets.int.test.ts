import request from 'supertest';
import { app } from '../app';
import {
	createOpportunity,
	createOrUpdateFunder,
	createPermissionGrant,
	getDatabase,
	loadOpportunity,
	loadPermissionGrantBundle,
	loadSystemFunder,
	loadSystemUser,
	loadTableMetrics,
	loadTerminologySet,
} from '../database';
import { createTestFunder, createTestTerminologySet } from '../test/factories';
import {
	getAuthContext,
	loadTestUser,
	NO_LIMIT,
	NO_OFFSET,
} from '../test/utils';
import {
	expectArray,
	expectArrayContaining,
	expectObjectContaining,
	expectTimestamp,
} from '../test/asymettricMatchers';
import {
	mockJwt as authHeader,
	mockJwtWithAdminRole as authHeaderWithAdminRole,
} from '../test/mockJwt';
import {
	PermissionGrantEntityType,
	PermissionGrantGranteeType,
	PermissionGrantVerb,
} from '../types';

describe('/terminologySets', () => {
	describe('GET /', () => {
		it('requires authentication', async () => {
			await request(app).get('/terminologySets').expect(401);
		});

		it('returns terminology sets the caller can view', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const visibleFunder = await createTestFunder(db, testUserAuthContext);
			const hiddenFunder = await createTestFunder(db, testUserAuthContext);

			const visibleSet = await createTestTerminologySet(
				db,
				testUserAuthContext,
				{ funderShortCode: visibleFunder.shortCode, name: 'Visible' },
			);
			await createTestTerminologySet(db, testUserAuthContext, {
				funderShortCode: hiddenFunder.shortCode,
				name: 'Hidden',
			});

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: visibleFunder.shortCode,
				scope: [PermissionGrantEntityType.TERMINOLOGY_SET],
				verbs: [PermissionGrantVerb.VIEW],
			});

			const response = await request(app)
				.get('/terminologySets')
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				entries: [visibleSet],
				total: 1,
			});
		});

		it('filters by funder short code when ?funder is provided', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const targetFunder = await createTestFunder(db, testUserAuthContext);
			const otherFunder = await createTestFunder(db, testUserAuthContext);

			const targetSet = await createTestTerminologySet(
				db,
				testUserAuthContext,
				{ funderShortCode: targetFunder.shortCode, name: 'Target' },
			);
			await createTestTerminologySet(db, testUserAuthContext, {
				funderShortCode: otherFunder.shortCode,
				name: 'Other',
			});

			await Promise.all(
				[targetFunder.shortCode, otherFunder.shortCode].map(
					async (funderShortCode) =>
						await createPermissionGrant(db, systemUserAuthContext, {
							granteeType: PermissionGrantGranteeType.USER,
							granteeUserKeycloakUserId: testUser.keycloakUserId,
							contextEntityType: PermissionGrantEntityType.FUNDER,
							funderShortCode,
							scope: [PermissionGrantEntityType.TERMINOLOGY_SET],
							verbs: [PermissionGrantVerb.VIEW],
						}),
				),
			);

			const response = await request(app)
				.get(`/terminologySets?funder=${targetFunder.shortCode}`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual({
				entries: [targetSet],
				total: 1,
			});
		});

		it('returns 400 when ?funder is not a valid short code', async () => {
			const response = await request(app)
				.get('/terminologySets?funder=not a short code!')
				.set(authHeader)
				.expect(400);
			expect(response.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});
	});

	describe('GET /:terminologySetId', () => {
		it('requires authentication', async () => {
			await request(app).get('/terminologySets/1').expect(401);
		});

		it('returns 400 when id is not numeric', async () => {
			const result = await request(app)
				.get('/terminologySets/abc')
				.set(authHeader)
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 404 when no view permission', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const terminologySet = await createTestTerminologySet(
				db,
				testUserAuthContext,
			);
			await request(app)
				.get(`/terminologySets/${terminologySet.id}`)
				.set(authHeader)
				.expect(404);
		});

		it('returns the set when the user has funder permission', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const funder = await createTestFunder(db, testUserAuthContext);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funder.shortCode,
				scope: [PermissionGrantEntityType.TERMINOLOGY_SET],
				verbs: [PermissionGrantVerb.VIEW],
			});
			const terminologySet = await createTestTerminologySet(
				db,
				testUserAuthContext,
				{ funderShortCode: funder.shortCode },
			);
			const response = await request(app)
				.get(`/terminologySets/${terminologySet.id}`)
				.set(authHeader)
				.expect(200);
			expect(response.body).toEqual(terminologySet);
		});
	});

	describe('POST /', () => {
		it('requires authentication', async () => {
			await request(app).post('/terminologySets').expect(401);
		});

		it('returns 400 when funderShortCode is missing', async () => {
			const result = await request(app)
				.post('/terminologySets')
				.type('application/json')
				.set(authHeader)
				.send({ name: 'No funder' })
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 401 when the user lacks edit | terminologySet on the funder', async () => {
			const db = getDatabase();
			const systemFunder = await loadSystemFunder(db, null);
			const before = await loadTableMetrics(db, 'terminology_sets');
			await request(app)
				.post('/terminologySets')
				.type('application/json')
				.set(authHeader)
				.send({
					funderShortCode: systemFunder.shortCode,
					name: 'Unauthorized vocab',
				})
				.expect(401);
			const after = await loadTableMetrics(db, 'terminology_sets');
			expect(after.count).toEqual(before.count);
		});

		it('creates a terminology set when the user has edit | terminologySet on the funder', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const systemFunder = await loadSystemFunder(db, null);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [PermissionGrantEntityType.TERMINOLOGY_SET],
				verbs: [PermissionGrantVerb.EDIT],
			});
			const before = await loadTableMetrics(db, 'terminology_sets');
			const response = await request(app)
				.post('/terminologySets')
				.type('application/json')
				.set(authHeader)
				.send({
					funderShortCode: systemFunder.shortCode,
					name: 'RFP Vocabulary',
					proposalLabel: 'Funding Request',
				})
				.expect(201);
			const after = await loadTableMetrics(db, 'terminology_sets');
			expect(after.count).toEqual(before.count + 1);
			expect(response.body).toMatchObject({
				funderShortCode: systemFunder.shortCode,
				name: 'RFP Vocabulary',
				proposalLabel: 'Funding Request',
				opportunityLabel: null,
				createdAt: expectTimestamp(),
				createdBy: testUser.keycloakUserId,
			});
		});

		it('grants the creator a manage permission on the new terminology set', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const systemFunder = await loadSystemFunder(db, null);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: systemFunder.shortCode,
				scope: [PermissionGrantEntityType.TERMINOLOGY_SET],
				verbs: [PermissionGrantVerb.EDIT],
			});
			await request(app)
				.post('/terminologySets')
				.type('application/json')
				.set(authHeader)
				.send({
					funderShortCode: systemFunder.shortCode,
					name: 'Self-grant test',
				})
				.expect(201);
			const grants = await loadPermissionGrantBundle(
				db,
				getAuthContext(systemUser, true),
				NO_LIMIT,
				NO_OFFSET,
			);
			expect(grants.entries).toEqual(
				expectArrayContaining([
					expectObjectContaining({
						granteeType: 'user',
						granteeUserKeycloakUserId: testUser.keycloakUserId,
						contextEntityType: 'terminologySet',
						scope: ['any'],
						verbs: ['manage'],
					}),
				]),
			);
		});
	});

	describe('PATCH /:terminologySetId', () => {
		it('requires authentication', async () => {
			await request(app).patch('/terminologySets/1').expect(401);
		});

		it('updates only the supplied labels', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const terminologySet = await createTestTerminologySet(
				db,
				testUserAuthContext,
				{
					name: 'Original',
					opportunityLabel: 'Opportunity',
					proposalLabel: 'Proposal',
				},
			);

			const response = await request(app)
				.patch(`/terminologySets/${terminologySet.id}`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({
					proposalLabel: 'Funding Request',
				})
				.expect(200);
			expect(response.body).toEqual({
				...terminologySet,
				proposalLabel: 'Funding Request',
			});
		});

		it('returns 400 when body is empty', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const terminologySet = await createTestTerminologySet(
				db,
				testUserAuthContext,
			);
			const result = await request(app)
				.patch(`/terminologySets/${terminologySet.id}`)
				.type('application/json')
				.set(authHeaderWithAdminRole)
				.send({})
				.expect(400);
			expect(result.body).toMatchObject({
				name: 'InputValidationError',
				details: expectArray(),
			});
		});

		it('returns 401 when caller lacks edit permission', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const funder = await createTestFunder(db, testUserAuthContext);
			const terminologySet = await createTestTerminologySet(
				db,
				testUserAuthContext,
				{ funderShortCode: funder.shortCode },
			);
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funder.shortCode,
				scope: [PermissionGrantEntityType.TERMINOLOGY_SET],
				verbs: [PermissionGrantVerb.VIEW],
			});
			await request(app)
				.patch(`/terminologySets/${terminologySet.id}`)
				.type('application/json')
				.set(authHeader)
				.send({ proposalLabel: 'Submission' })
				.expect(401);
		});
	});

	describe('funder-scoped composite FK', () => {
		it('rejects an opportunity that references a terminology set owned by a different funder', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const funderA = await createTestFunder(db, testUserAuthContext);
			const funderB = await createTestFunder(db, testUserAuthContext);
			const setA = await createTestTerminologySet(db, testUserAuthContext, {
				funderShortCode: funderA.shortCode,
				name: "A's vocab",
			});

			await expect(
				createOpportunity(db, testUserAuthContext, {
					title: 'Cross-funder opportunity',
					funderShortCode: funderB.shortCode,
					terminologySetId: setA.id,
				}),
			).rejects.toThrow();
		});
	});

	describe('funder default rebinding', () => {
		it("pins an opportunity to the funder's default at creation time", async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const funder = await createTestFunder(db, testUserAuthContext);
			const defaultSet = await createTestTerminologySet(
				db,
				testUserAuthContext,
				{
					funderShortCode: funder.shortCode,
					name: 'Funder default',
				},
			);
			await createOrUpdateFunder(db, testUserAuthContext, {
				shortCode: funder.shortCode,
				name: funder.name,
				keycloakOrganizationId: null,
				isCollaborative: funder.isCollaborative,
				defaultTerminologySetId: defaultSet.id,
			});

			const opportunity = await createOpportunity(db, testUserAuthContext, {
				title: 'Implicit-default opportunity',
				funderShortCode: funder.shortCode,
				terminologySetId: null,
			});
			expect(opportunity.terminologySetId).toEqual(defaultSet.id);
			expect(opportunity.terminologySet).toMatchObject({
				id: defaultSet.id,
				name: 'Funder default',
			});
		});

		it('does not re-bind existing opportunities when the funder default changes', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const funder = await createTestFunder(db, testUserAuthContext);
			const oldDefault = await createTestTerminologySet(
				db,
				testUserAuthContext,
				{
					funderShortCode: funder.shortCode,
					name: 'Old default',
				},
			);
			const newDefault = await createTestTerminologySet(
				db,
				testUserAuthContext,
				{
					funderShortCode: funder.shortCode,
					name: 'New default',
				},
			);
			await createOrUpdateFunder(db, testUserAuthContext, {
				shortCode: funder.shortCode,
				name: funder.name,
				keycloakOrganizationId: null,
				isCollaborative: funder.isCollaborative,
				defaultTerminologySetId: oldDefault.id,
			});

			const opportunity = await createOpportunity(db, testUserAuthContext, {
				title: 'Pinned opportunity',
				funderShortCode: funder.shortCode,
				terminologySetId: null,
			});
			expect(opportunity.terminologySetId).toEqual(oldDefault.id);

			await createOrUpdateFunder(db, testUserAuthContext, {
				shortCode: funder.shortCode,
				name: funder.name,
				keycloakOrganizationId: null,
				isCollaborative: funder.isCollaborative,
				defaultTerminologySetId: newDefault.id,
			});

			const reloaded = await loadOpportunity(
				db,
				getAuthContext(testUser, true),
				opportunity.id,
			);
			expect(reloaded.terminologySetId).toEqual(oldDefault.id);
		});

		it('returns null when no funder default and no explicit selection', async () => {
			const db = getDatabase();
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const funder = await createTestFunder(db, testUserAuthContext);
			const opportunity = await createOpportunity(db, testUserAuthContext, {
				title: 'Bare opportunity',
				funderShortCode: funder.shortCode,
				terminologySetId: null,
			});
			expect(opportunity.terminologySetId).toBeNull();
			expect(opportunity.terminologySet).toBeNull();
		});
	});

	describe('reference verb check on opportunity creation', () => {
		it('rejects POST /opportunities with terminologySetId when caller lacks reference | terminologySet', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const funder = await createTestFunder(db, testUserAuthContext);
			const terminologySet = await createTestTerminologySet(
				db,
				testUserAuthContext,
				{
					funderShortCode: funder.shortCode,
					name: 'Reference-protected vocab',
				},
			);

			// Caller can CREATE opportunities on funder, but has no reference
			// permission on the terminology set.
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funder.shortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.CREATE],
			});

			await request(app)
				.post('/opportunities')
				.type('application/json')
				.set(authHeader)
				.send({
					title: 'Should be rejected',
					funderShortCode: funder.shortCode,
					terminologySetId: terminologySet.id,
				})
				.expect(401);
		});

		it('allows POST /opportunities with terminologySetId when caller has reference permission via funder cascade', async () => {
			const db = getDatabase();
			const systemUser = await loadSystemUser(db, null);
			const systemUserAuthContext = getAuthContext(systemUser);
			const testUser = await loadTestUser(db);
			const testUserAuthContext = getAuthContext(testUser);
			const funder = await createTestFunder(db, testUserAuthContext);
			const terminologySet = await createTestTerminologySet(
				db,
				testUserAuthContext,
				{
					funderShortCode: funder.shortCode,
					name: 'Reference-allowed vocab',
				},
			);

			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funder.shortCode,
				scope: [PermissionGrantEntityType.OPPORTUNITY],
				verbs: [PermissionGrantVerb.CREATE],
			});
			await createPermissionGrant(db, systemUserAuthContext, {
				granteeType: PermissionGrantGranteeType.USER,
				granteeUserKeycloakUserId: testUser.keycloakUserId,
				contextEntityType: PermissionGrantEntityType.FUNDER,
				funderShortCode: funder.shortCode,
				scope: [PermissionGrantEntityType.TERMINOLOGY_SET],
				verbs: [PermissionGrantVerb.REFERENCE],
			});

			const response = await request(app)
				.post('/opportunities')
				.type('application/json')
				.set(authHeader)
				.send({
					title: 'Reference-allowed opportunity',
					funderShortCode: funder.shortCode,
					terminologySetId: terminologySet.id,
				})
				.expect(201);
			expect(response.body).toMatchObject({
				terminologySetId: terminologySet.id,
				terminologySet: expectObjectContaining({
					id: terminologySet.id,
					name: 'Reference-allowed vocab',
				}),
			});
			// Sanity: backing record reflects the same id
			const loaded = await loadTerminologySet(
				db,
				getAuthContext(testUser, true),
				terminologySet.id,
			);
			expect(loaded.id).toEqual(terminologySet.id);
		});
	});
});
