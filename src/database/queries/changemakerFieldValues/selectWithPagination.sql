WITH
	candidate_entries AS NOT MATERIALIZED (
		SELECT changemaker_field_values.*
		FROM changemaker_field_values
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
			AND has_changemaker_field_value_permission(
				:authContextKeycloakUserId,
				:authContextIsAdministrator,
				changemaker_field_values.id,
				'view',
				'changemakerFieldValue'
			)
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	paginated_entries AS (
		SELECT
			changemaker_field_value_to_json(
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
