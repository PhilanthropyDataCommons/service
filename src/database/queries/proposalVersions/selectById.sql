SELECT proposal_version_to_json(proposal_versions.*) AS object
FROM proposal_versions
WHERE
	proposal_versions.id = :proposalVersionId
	AND (
		EXISTS (
			SELECT 1
			FROM proposals
				INNER JOIN opportunities ON proposals.opportunity_id = opportunities.id
			WHERE
				proposals.id = proposal_versions.proposal_id
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
				changemakers_proposals.proposal_id = proposal_versions.proposal_id
				AND has_changemaker_permission(
					:authContextKeycloakUserId,
					:authContextIsAdministrator,
					changemakers_proposals.changemaker_id,
					'view',
					'changemaker'
				)
		)
	);
