INSERT INTO funder_collaborative_members (
	funder_collaborative_short_code,
	member_funder_short_code,
	created_by
) VALUES (
	:funderCollaborativeShortCode,
	:memberFunderShortCode,
	:authContextKeycloakUserId
)
ON CONFLICT (
	funder_collaborative_short_code,
	member_funder_short_code
) DO UPDATE
	SET not_after = null
RETURNING
	funder_collaborative_member_to_json(funder_collaborative_members) AS object;
