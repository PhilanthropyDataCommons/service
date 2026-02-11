SELECT changemaker_proposal_to_json(changemakers_proposals.*) AS object
FROM changemakers_proposals
	INNER JOIN proposals ON changemakers_proposals.proposal_id = proposals.id
	INNER JOIN opportunities ON proposals.opportunity_id = opportunities.id
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
	AND (
		has_funder_permission(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			opportunities.funder_short_code,
			'view'
		)
		OR has_changemaker_permission(
			:authContextKeycloakUserId,
			:authContextIsAdministrator,
			changemakers_proposals.changemaker_id,
			'view',
			'changemaker'
		)
	)
ORDER BY changemakers_proposals.id DESC
LIMIT :limit OFFSET :offset;
