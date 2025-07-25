INSERT INTO funder_collaborative_invitations (
	funder_collaborative_short_code,
	invited_funder_short_code,
	invitation_status,
	created_by
) VALUES (
	:funderCollaborativeShortCode,
	:invitedFunderShortCode,
	:invitationStatus,
	:authContextKeycloakUserId
)
ON CONFLICT (
	funder_collaborative_short_code,
	invited_funder_short_code
) DO UPDATE
	SET
		not_after = null
RETURNING
	funder_collaborative_invitation_to_json(funder_collaborative_invitations)
		AS object;
