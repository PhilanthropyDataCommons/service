SELECT proposal_to_json(proposals.*) AS object
FROM proposals
WHERE
	proposals.id = :proposalId
	AND (
		EXISTS (
			SELECT 1
			FROM opportunities
			WHERE
				opportunities.id = proposals.opportunity_id
				AND has_funder_permission(
					:authContextKeycloakUserId,
					:authContextIsAdministrator,
					opportunities.funder_short_code,
					'view',
					'funder'
				)
		)
		OR EXISTS (
			SELECT 1
			FROM changemakers_proposals
			WHERE
				changemakers_proposals.proposal_id = proposals.id
				AND has_changemaker_permission(
					:authContextKeycloakUserId,
					:authContextIsAdministrator,
					changemakers_proposals.changemaker_id,
					'view',
					'changemaker'
				)
		)
	);
