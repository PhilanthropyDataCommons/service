-- Creation has no field value to check conditions against, so the candidate
-- base field category is supplied by the caller and matched against the
-- grant's `conditions` here.
SELECT :authContextIsAdministrator::boolean OR EXISTS (
	SELECT 1
	FROM initiatives AS i
		INNER JOIN permission_grants AS pg
			ON (
				(
					pg.context_entity_type = 'initiative'
					AND i.id = pg.initiative_id
				)
				OR (
					pg.context_entity_type = 'changemaker'
					AND i.changemaker_id = pg.changemaker_id
				)
			)
	WHERE
		i.id = :initiativeId::integer
		AND verb_set_permits_verb(pg.verbs, 'create')
		AND scope_set_permits_scope(pg.scope, 'initiativeFieldValue')
		AND grantee_permits_user(
			pg.grantee_type,
			pg.grantee_user_keycloak_user_id,
			pg.grantee_keycloak_organization_id,
			:authContextKeycloakUserId
		)
		AND (
			pg.conditions IS NULL
			OR NOT (pg.conditions ? 'initiativeFieldValue')
			OR (
				pg.conditions #>> '{initiativeFieldValue,property}'
				= 'baseFieldCategory'
				AND pg.conditions #>> '{initiativeFieldValue,operator}' = 'in'
				AND :baseFieldCategory::text IN (
					SELECT jsonb_array_elements_text(
						pg.conditions #> '{initiativeFieldValue,value}'
					)
				)
			)
		)
) AS result;
