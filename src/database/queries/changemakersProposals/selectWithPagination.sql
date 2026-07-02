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

	page AS (
		SELECT candidate_entries.id
		FROM candidate_entries
		ORDER BY candidate_entries.id DESC
		LIMIT :limit OFFSET :offset
	),

	page_entries AS (
		SELECT changemakers_proposals AS entry
		FROM changemakers_proposals
		WHERE changemakers_proposals.id IN (SELECT page.id FROM page)
	),

	paginated_entries AS (
		SELECT serialized_entry.object
		FROM page
			INNER JOIN
				build_changemakers_proposals_results(
					array(SELECT page_entries.entry FROM page_entries),
					:authContextKeycloakUserId,
					:authContextIsAdministrator
				) AS serialized_entry
				ON page.id = serialized_entry.id
		ORDER BY page.id DESC
	)

SELECT
	paginated_entries.object,
	entry_count.total
FROM entry_count
	LEFT JOIN paginated_entries ON TRUE;
