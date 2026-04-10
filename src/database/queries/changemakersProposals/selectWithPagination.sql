WITH
	candidate_entries AS NOT MATERIALIZED (
		SELECT changemakers_proposals.*
		FROM changemakers_proposals
		WHERE
			CASE
				WHEN :changemakerId::integer IS NULL THEN
					TRUE
				ELSE
					changemakers_proposals.changemaker_id = :changemakerId
			END
			AND CASE
				WHEN :proposalId::integer IS NULL THEN
					TRUE
				ELSE
					changemakers_proposals.proposal_id = :proposalId
			END
			AND has_proposal_permission(
				:authContextKeycloakUserId,
				:authContextIsAdministrator,
				changemakers_proposals.proposal_id,
				'view',
				'proposal'
			)
	),

	entry_count AS (
		SELECT count(*) AS total FROM candidate_entries
	),

	paginated_entries AS (
		SELECT
			changemaker_proposal_to_json(
				candidate_entries.*::changemakers_proposals,
				:authContextKeycloakUserId,
				:authContextIsAdministrator
			) AS object
		FROM candidate_entries
		ORDER BY id DESC
		LIMIT :limit OFFSET :offset
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
