WITH
	candidate_entries AS NOT MATERIALIZED (
		SELECT base_field_localizations.*
		FROM base_field_localizations
		WHERE
			CASE
				WHEN :baseFieldShortCode::varchar IS NULL THEN
					TRUE
				ELSE
					base_field_localizations.base_field_short_code = :baseFieldShortCode
			END
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	paginated_entries AS (
		SELECT
			base_field_localization_to_json(
				candidate_entries.*::base_field_localizations
			) AS object
		FROM candidate_entries
		ORDER BY created_at
		LIMIT :limit OFFSET :offset
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
