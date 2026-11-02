WITH
	candidate_entries AS MATERIALIZED (
		SELECT organizations.*
		FROM organizations
		WHERE
			coalesce(:authContextIsAdministrator::boolean, false)
			OR coalesce(
				:authContextCanViewOrganizationsInKeycloak::boolean,
				false
			)
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	page AS (
		SELECT candidate_entries.*
		FROM candidate_entries
		ORDER BY created_at DESC, keycloak_organization_id DESC
		LIMIT :limit OFFSET :offset
	),

	paginated_entries AS (
		SELECT
			organization_to_json(
				page.keycloak_organization_id,
				:authContextKeycloakUserId::uuid,
				:authContextIsAdministrator::boolean,
				:authContextCanViewOrganizationsInKeycloak::boolean,
				:authContextCanViewUsersInKeycloak::boolean
			) AS object
		FROM page
		ORDER BY created_at DESC, page.keycloak_organization_id DESC
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON true;
