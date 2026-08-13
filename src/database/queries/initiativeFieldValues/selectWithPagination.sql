WITH
	candidate_entries AS MATERIALIZED (
		SELECT initiative_field_values.*
		FROM initiative_field_values
			INNER JOIN base_fields
				ON
					initiative_field_values.base_field_short_code
					= base_fields.short_code
		WHERE
			initiative_field_values.initiative_id = :initiativeId
			AND base_fields.sensitivity_classification <> 'forbidden'
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	page AS (
		SELECT candidate_entries.*
		FROM candidate_entries
		ORDER BY id
		LIMIT :limit OFFSET :offset
	),

	paginated_entries AS (
		SELECT
			build_initiative_field_value_result(
				page.*::initiative_field_values
			) AS object
		FROM page
		ORDER BY id
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
