UPDATE funder_collaborative_invitations
SET not_after = now()
WHERE
	funder_collaborative_short_code = :funderCollaborativeShortCode
	AND invited_funder_short_code = :invitedFunderShortCode
	AND NOT is_expired(not_after)
RETURNING
	funder_collaborative_invitation_to_json(funder_collaborative_invitations)
		AS object;
