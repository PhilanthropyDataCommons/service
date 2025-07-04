SELECT
	funder_collaborative_invitation_to_json(funder_collaborative_invitations.*)
	AS object
FROM funder_collaborative_invitations
WHERE
	funder_collaborative_invitations.invitation_short_code
	= :invitationShortCode
ORDER BY funder_collaborative_invitations.created_at DESC
LIMIT :limit OFFSET :offset;
