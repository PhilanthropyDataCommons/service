UPDATE funder_collaborative_invitations
SET invitation_status = coalesce(:invitationStatus, invitation_status)
WHERE
	funder_short_code = :funderShortCode
	AND invitation_short_code = :invitationShortCode
RETURNING
	funder_collaborative_invitation_to_json(funder_collaborative_invitations)
	AS object;
