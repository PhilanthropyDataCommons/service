WITH
	candidate_entries AS MATERIALIZED (
		SELECT initiatives.*
		FROM initiatives
		WHERE CASE
			WHEN :changemakerId::integer IS NULL THEN TRUE
			ELSE initiatives.changemaker_id = :changemakerId
		END
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
		SELECT initiative_to_json(page.*::initiatives) AS object
		FROM page
		ORDER BY id
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
