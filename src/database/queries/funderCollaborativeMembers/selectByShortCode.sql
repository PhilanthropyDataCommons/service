SELECT
	funder_collaborative_member_to_json(funder_collaborative_members.*)
	AS object
FROM funder_collaborative_members
WHERE
	funder_collaborative_short_code = :funderCollaborativeShortCode
	AND member_short_code = :memberShortCode;
