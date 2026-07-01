WITH
	candidate_entries AS MATERIALIZED (
		SELECT changemaker_field_values.*
		FROM changemaker_field_values
			INNER JOIN
				permitted_changemaker_field_value_ids(
					:authContextKeycloakUserId,
					:authContextIsAdministrator,
					'view',
					'changemakerFieldValue'
				) AS permitted_field_values
				ON changemaker_field_values.id = permitted_field_values.id
		WHERE
			CASE
				WHEN :batchId::integer IS NULL THEN
					TRUE
				ELSE
					changemaker_field_values.batch_id = :batchId
			END
			AND CASE
				WHEN :changemakerId::integer IS NULL THEN
					TRUE
				ELSE
					changemaker_field_values.changemaker_id = :changemakerId
			END
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	paginated_entries AS (
		SELECT
			build_changemaker_field_value_result(
				candidate_entries.*::changemaker_field_values
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
