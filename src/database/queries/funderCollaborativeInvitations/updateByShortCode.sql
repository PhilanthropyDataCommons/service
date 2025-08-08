UPDATE funder_collaborative_invitations
SET
	invitation_status
	= coalesce(:invitationStatus::invitation_status_t, invitation_status)
WHERE
	funder_collaborative_short_code = :funderCollaborativeShortCode::short_code_t
	AND invited_funder_short_code = :invitedFunderShortCode::short_code_t
RETURNING
	funder_collaborative_invitation_to_json(funder_collaborative_invitations.*)
		AS object;
