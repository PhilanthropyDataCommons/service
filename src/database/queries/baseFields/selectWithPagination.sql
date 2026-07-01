WITH
	candidate_entries AS MATERIALIZED (
		SELECT base_fields.*
		FROM base_fields
		WHERE
			CASE
				WHEN :sensitivityFilter.list::sensitivity_classification [] IS NULL
				THEN TRUE
				WHEN :sensitivityFilter.negated THEN
					NOT (base_fields.sensitivity_classification = any(
						:sensitivityFilter.list::sensitivity_classification []
					))
				ELSE
					base_fields.sensitivity_classification = any(
						:sensitivityFilter.list::sensitivity_classification []
					)
			END
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	page AS (
		SELECT candidate_entries.*
		FROM candidate_entries
		ORDER BY created_at DESC
		LIMIT :limit OFFSET :offset
	),

	paginated_entries AS (
		SELECT base_field_to_json(page.*::base_fields) AS object
		FROM page
		ORDER BY created_at DESC
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
