WITH
	candidate_entries AS MATERIALIZED (
		SELECT changemakers_proposals.*
		FROM changemakers_proposals
			INNER JOIN
				permitted_proposal_ids(
					:authContextKeycloakUserId,
					:authContextIsAdministrator,
					'view',
					'proposal'
				) AS permitted_proposals
				ON changemakers_proposals.proposal_id = permitted_proposals.id
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
