SELECT
	funder_collaborative_invitation_to_json(funder_collaborative_invitations.*)
		AS object
FROM funder_collaborative_invitations
WHERE
	CASE
		WHEN
			funder_collaborative_invitations.:funderCollaborativeShortCode::short_code_t IS NULL
		THEN
			TRUE
		ELSE
			funder_collaborative_invitations.funder_collaborative_short_code
			= funder_collaborative_invitations.:funderCollaborativeShortCode
	END
	AND CASE
		WHEN
			funder_collaborative_invitations.:invitedFunderShortCode::short_code_t IS NULL
		THEN
			TRUE
		ELSE
			funder_collaborative_invitations.invited_funder_short_code
			= funder_collaborative_invitations.:invitedFunderShortCode
	END
	AND CASE
		WHEN
			funder_collaborative_invitations.:status::invitation_status_t IS NULL
		THEN
			TRUE
		ELSE
			funder_collaborative_invitations.invitation_status
			= funder_collaborative_invitations.:status::invitation_status_t
	END
	AND NOT is_expired(funder_collaborative_invitations.not_after)
ORDER BY funder_collaborative_invitations.created_at DESC
LIMIT :limit OFFSET :offset;
