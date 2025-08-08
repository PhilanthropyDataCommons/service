SELECT
	funder_collaborative_invitation_to_json(funder_collaborative_invitations.*)
		AS object
FROM funder_collaborative_invitations
WHERE
	funder_collaborative_short_code = :funderCollaborativeShortCode
	AND invited_funder_short_code = :invitedFunderShortCode;
