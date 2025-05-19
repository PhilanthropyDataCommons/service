INSERT INTO funder_collaborative_members (
	funder_collaborative_short_code,
	member_short_code,
	created_by
) VALUES (
	:funderCollaborativeShortCode,
	:memberShortCode,
	:authContextKeycloakUserId
)
RETURNING
	funder_collaborative_member_to_json(funder_collaborative_members) AS object;
