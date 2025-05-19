SELECT
	funder_collaborative_member_to_json(funder_collaborative_members.*)
		AS object
FROM funder_collaborative_members
WHERE
	CASE
		WHEN
			:funderCollaborativeShortCode::short_code_t IS NULL
		THEN
			TRUE
		ELSE
			funder_collaborative_short_code = :funderCollaborativeShortCode
	END
	AND CASE
		WHEN
			:memberFunderShortCode::short_code_t IS NULL
		THEN
			TRUE
		ELSE
			member_funder_short_code = :memberFunderShortCode
	END
	AND NOT is_expired(not_after)
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;
