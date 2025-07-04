SELECT
	funder_collaborative_invitation_to_json(funder_collaborative_invitations.*)
	AS object
FROM funder_collaborative_invitations
WHERE
	funder_short_code = :funderShortCode
	AND invitation_short_code = :invitationShortCode;
