WITH
	candidate_entries AS NOT MATERIALIZED (
		SELECT changemakers.*
		FROM changemakers
		WHERE
			CASE
				WHEN :proposalId::integer IS NULL THEN
					TRUE
				ELSE
					EXISTS (
						SELECT 1
						FROM changemakers_proposals
						WHERE
							changemakers_proposals.changemaker_id = changemakers.id
							AND changemakers_proposals.proposal_id = :proposalId
					)
			END
			AND CASE
				WHEN (
					:search::text IS NULL
					OR :search = ''
				) THEN
					TRUE
				ELSE
					changemakers.name_search
					@@ websearch_to_tsquery('english', :search::text)
			END
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	paginated_entries AS (
		SELECT
			changemaker_to_json(
				candidate_entries.*::changemakers,
				:authContextKeycloakUserId,
				:authContextIsAdministrator
			) AS object
		FROM candidate_entries
		ORDER BY id DESC
		LIMIT :limit OFFSET :offset
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
