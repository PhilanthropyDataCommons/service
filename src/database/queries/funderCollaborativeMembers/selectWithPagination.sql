WITH
	candidate_entries AS NOT MATERIALIZED (
		SELECT funder_collaborative_members.*
		FROM funder_collaborative_members
		WHERE
			CASE
				WHEN
					:funderCollaborativeShortCode::short_code_t IS NULL
				THEN
					TRUE
				ELSE
					funder_collaborative_members.funder_collaborative_short_code
					= :funderCollaborativeShortCode
			END
			AND CASE
				WHEN
					:memberFunderShortCode::short_code_t IS NULL
				THEN
					TRUE
				ELSE
					funder_collaborative_members.member_funder_short_code
					= :memberFunderShortCode
			END
			AND NOT is_expired(funder_collaborative_members.not_after)
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	paginated_entries AS (
		SELECT
			funder_collaborative_member_to_json(
				candidate_entries.*::funder_collaborative_members
			) AS object
		FROM candidate_entries
		ORDER BY created_at DESC
		LIMIT :limit OFFSET :offset
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
