WITH
	candidate_entries AS MATERIALIZED (
		SELECT changemaker_field_value_batches.*
		FROM changemaker_field_value_batches
		WHERE
			:authContextIsAdministrator::boolean
			OR changemaker_field_value_batches.created_by = :authContextKeycloakUserId
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
			changemaker_field_value_batch_to_json(
				page.*::changemaker_field_value_batches,
				:authContextKeycloakUserId,
				:authContextIsAdministrator
			) AS object
		FROM page
		ORDER BY id DESC
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
