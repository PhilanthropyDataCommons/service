import { v4 as uuidv4 } from 'uuid';
import type { TinyPg } from 'tinypg';

interface TestOrganization {
	keycloakOrganizationId: string;
	keycloakOrganizationName: string;
	createdAt?: string;
}

const createTestOrganization = async (
	db: Pick<TinyPg, 'query'>,
	overrideValues: Partial<TestOrganization> = {},
): Promise<TestOrganization> => {
	const id = uuidv4();
	const defaultValues = {
		keycloakOrganizationId: id,
		keycloakOrganizationName: `Test Organization ${id}`,
	};
	const values = { ...defaultValues, ...overrideValues };
	await db.query(
		'INSERT INTO organizations (keycloak_organization_id, keycloak_organization_name, created_at) VALUES (:keycloakOrganizationId, :keycloakOrganizationName, coalesce(:createdAt::timestamptz, now()));',
		{ ...values, createdAt: values.createdAt ?? null },
	);
	return values;
};

export { createTestOrganization };
export type { TestOrganization };
