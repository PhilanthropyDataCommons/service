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
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	page AS (
		SELECT candidate_entries.*
		FROM candidate_entries
		ORDER BY id DESC
		LIMIT :limit OFFSET :offset
	),

	paginated_entries AS (
		SELECT
			permission_grant_to_json(
				page.*::permission_grants
			) AS object
		FROM page
		ORDER BY id DESC
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
