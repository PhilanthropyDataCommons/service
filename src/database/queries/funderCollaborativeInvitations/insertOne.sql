INSERT INTO funder_collaborative_invitations (
	funder_short_code,
	invitation_short_code,
	invitation_status,
	created_by
) VALUES (
	:funderShortCode,
	:invitationShortCode,
	:invitationStatus,
	:authContextKeycloakUserId
)
RETURNING
	funder_collaborative_invitation_to_json(funder_collaborative_invitations)
		AS object;
