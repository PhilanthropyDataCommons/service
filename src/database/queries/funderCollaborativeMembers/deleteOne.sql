UPDATE funder_collaborative_members
SET not_after = now()
WHERE
	funder_collaborative_short_code = :funderCollaborativeShortCode
	AND member_funder_short_code = :memberFunderShortCode
	AND NOT is_expired(not_after)
RETURNING
	funder_collaborative_member_to_json(funder_collaborative_members)
		AS object;
