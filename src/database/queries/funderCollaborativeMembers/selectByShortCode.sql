SELECT
	funder_collaborative_member_to_json(funder_collaborative_members.*)
		AS object
FROM funder_collaborative_members
WHERE
	funder_collaborative_short_code = :funderCollaborativeShortCode
	AND member_funder_short_code = :memberFunderShortCode
	AND NOT is_expired(not_after);
