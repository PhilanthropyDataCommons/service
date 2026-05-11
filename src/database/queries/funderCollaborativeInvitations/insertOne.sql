MERGE INTO funder_collaborative_invitations
USING (VALUES (
	:funderCollaborativeShortCode::short_code_t,
	:invitedFunderShortCode::short_code_t,
	:invitationStatus::invitation_status_t,
	:authContextKeycloakUserId::uuid
)) AS source (
	funder_collaborative_short_code,
	invited_funder_short_code,
	invitation_status,
	created_by
)
ON
	funder_collaborative_invitations.funder_collaborative_short_code
	= source.funder_collaborative_short_code
	AND funder_collaborative_invitations.invited_funder_short_code
	= source.invited_funder_short_code
WHEN MATCHED THEN UPDATE SET not_after = NULL
WHEN NOT MATCHED THEN INSERT (
	funder_collaborative_short_code,
	invited_funder_short_code,
	invitation_status,
	created_by
) VALUES (
	source.funder_collaborative_short_code,
	source.invited_funder_short_code,
	source.invitation_status,
	source.created_by
)
RETURNING
	funder_collaborative_invitation_to_json(funder_collaborative_invitations)
		AS object,
	merge_action() = 'INSERT' AS "wasInserted";
