WITH
	candidate_entries AS NOT MATERIALIZED (
		SELECT funder_collaborative_invitations.*
		FROM funder_collaborative_invitations
		WHERE
			CASE
				WHEN
					:funderCollaborativeShortCode::short_code_t IS NULL
				THEN
					TRUE
				ELSE
					funder_collaborative_invitations.funder_collaborative_short_code
					= :funderCollaborativeShortCode::short_code_t
			END
			AND CASE
				WHEN
					:invitedFunderShortCode::short_code_t IS NULL
				THEN
					TRUE
				ELSE
					funder_collaborative_invitations.invited_funder_short_code
					= :invitedFunderShortCode::short_code_t
			END
			AND CASE
				WHEN
					:status::invitation_status_t IS NULL
				THEN
					TRUE
				ELSE
					funder_collaborative_invitations.invitation_status
					= :status::invitation_status_t
			END
			AND NOT is_expired(funder_collaborative_invitations.not_after)
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	paginated_entries AS (
		SELECT
			funder_collaborative_invitation_to_json(
				candidate_entries.*::funder_collaborative_invitations
			) AS object
		FROM candidate_entries
		ORDER BY created_at DESC
		LIMIT :limit OFFSET :offset
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
