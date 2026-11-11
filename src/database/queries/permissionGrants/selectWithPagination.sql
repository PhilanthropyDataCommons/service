WITH
	candidate_entries AS MATERIALIZED (
		SELECT permission_grants.*
		FROM permission_grants
			INNER JOIN
				permitted_permission_grant_ids(
					:authContextKeycloakUserId,
					:authContextIsAdministrator
				) AS permitted_grants
				ON permission_grants.id = permitted_grants.id
		WHERE
			CASE
				WHEN :changemakerId::integer IS NULL THEN TRUE
				ELSE permission_grants.changemaker_id = :changemakerId
			END
			AND CASE
				WHEN :funderShortCode::short_code_t IS NULL THEN TRUE
				ELSE permission_grants.funder_short_code = :funderShortCode
			END
			AND CASE
				WHEN :dataProviderShortCode::short_code_t IS NULL THEN TRUE
				ELSE permission_grants.data_provider_short_code = :dataProviderShortCode
			END
			AND CASE
				WHEN :proposalId::integer IS NULL THEN TRUE
				ELSE permission_grants.proposal_id = :proposalId
			END
			AND CASE
				WHEN :granteeType::permission_grant_grantee_type_t IS NULL THEN TRUE
				ELSE permission_grants.grantee_type = :granteeType
			END
			AND CASE
				WHEN :verb::permission_grant_verb_t IS NULL THEN TRUE
				ELSE :verb::permission_grant_verb_t = any(permission_grants.verbs)
			END
			AND CASE
				WHEN :contextEntityType::permission_grant_entity_type_t IS NULL THEN TRUE
				ELSE permission_grants.context_entity_type = :contextEntityType
			END
			AND CASE
				WHEN :scope::permission_grant_entity_type_t IS NULL THEN TRUE
				ELSE :scope::permission_grant_entity_type_t = any(permission_grants.scope)
			END
			AND CASE
				WHEN :createdBy::uuid IS NULL THEN TRUE
				ELSE permission_grants.created_by = :createdBy
			END
			AND CASE
				WHEN :granteeUserKeycloakUserId::uuid IS NULL THEN TRUE
				ELSE
					permission_grants.grantee_user_keycloak_user_id
					= :granteeUserKeycloakUserId
			END
			AND CASE
				WHEN :granteeKeycloakOrganizationId::uuid IS NULL THEN TRUE
				ELSE
					permission_grants.grantee_keycloak_organization_id
					= :granteeKeycloakOrganizationId
			END
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	keyed_entries AS (
		SELECT
			candidate_entries.id,
			CASE :sortField
				WHEN 'granteeType' THEN candidate_entries.grantee_type::text
				WHEN 'contextEntityType' THEN candidate_entries.context_entity_type::text
				WHEN 'createdByUserName' THEN created_by_user.keycloak_user_name
			END AS sort_text,
			CASE WHEN :sortField = 'createdAt' THEN candidate_entries.created_at END
				AS sort_timestamp,
			CASE WHEN :sortField = 'id' THEN candidate_entries.id END AS sort_id
		FROM candidate_entries
			LEFT JOIN users AS created_by_user
				ON candidate_entries.created_by = created_by_user.keycloak_user_id
	),

	page AS (
		SELECT keyed_entries.*
		FROM keyed_entries
		ORDER BY
			CASE
				WHEN :sortDirection = 'asc' THEN keyed_entries.sort_text
			END ASC NULLS LAST,
			CASE
				WHEN :sortDirection = 'desc' THEN keyed_entries.sort_text
			END DESC NULLS LAST,
			CASE WHEN :sortDirection = 'asc' THEN keyed_entries.sort_timestamp END ASC,
			CASE WHEN :sortDirection = 'desc' THEN keyed_entries.sort_timestamp END DESC,
			CASE WHEN :sortDirection = 'asc' THEN keyed_entries.sort_id END ASC,
			keyed_entries.id DESC
		LIMIT :limit OFFSET :offset
	),

	paginated_entries AS (
		SELECT permission_grant_to_json(permission_grants) AS object
		FROM page
			INNER JOIN permission_grants ON page.id = permission_grants.id
		ORDER BY
			CASE WHEN :sortDirection = 'asc' THEN page.sort_text END ASC NULLS LAST,
			CASE WHEN :sortDirection = 'desc' THEN page.sort_text END DESC NULLS LAST,
			CASE WHEN :sortDirection = 'asc' THEN page.sort_timestamp END ASC,
			CASE WHEN :sortDirection = 'desc' THEN page.sort_timestamp END DESC,
			CASE WHEN :sortDirection = 'asc' THEN page.sort_id END ASC,
			page.id DESC
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
