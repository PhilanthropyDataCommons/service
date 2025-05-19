SELECT
	funder_collaborative_member_to_json(funder_collaborative_members.*)
		AS object
FROM funder_collaborative_members
WHERE
	CASE
		WHEN
			funder_collaborative_members.:funderCollaborativeShortCode::short_code_t IS NULL
		THEN
			TRUE
		ELSE
			funder_collaborative_members.funder_collaborative_short_code
			= funder_collaborative_members.:funderCollaborativeShortCode
	END
	AND CASE
		WHEN
			funder_collaborative_members.:memberFunderShortCode::short_code_t IS NULL
		THEN
			TRUE
		ELSE
			funder_collaborative_members.member_funder_short_code
			= funder_collaborative_members.:memberFunderShortCode
	END
	AND NOT is_expired(funder_collaborative_members.not_after)
ORDER BY funder_collaborative_members.created_at DESC
LIMIT :limit OFFSET :offset;
