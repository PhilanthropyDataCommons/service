SELECT
	funder_collaborative_invitation_to_json(funder_collaborative_invitations.*)
	AS object
FROM funder_collaborative_invitations
WHERE
	funder_collaborative_invitations.funder_short_code
	= :funderShortCode
ORDER BY funder_collaborative_invitations.created_at DESC
LIMIT :limit OFFSET :offset;
