SELECT
	funder_collaborative_invitation_to_json(funder_collaborative_invitations.*)
		AS object
FROM funder_collaborative_invitations
WHERE
	CASE
		WHEN :funderCollaborativeShortCode::short_code_t IS NULL THEN
			TRUE
		ELSE
			funder_collaborative_short_code = :funderCollaborativeShortCode::short_code_t
	END
	AND CASE
		WHEN :invitedFunderShortCode::short_code_t IS NULL THEN
			TRUE
		ELSE
			invited_funder_short_code = :invitedFunderShortCode::short_code_t
	END
	AND CASE
		WHEN :status::invitation_status_t IS NULL THEN
			TRUE
		ELSE
			invitation_status = :status::invitation_status_t
	END
	AND NOT is_expired(not_after)
ORDER BY created_at DESC
LIMIT :limit OFFSET :offset;
