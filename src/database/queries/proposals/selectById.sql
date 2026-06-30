WITH
	requested_proposal AS (
		SELECT proposals AS proposal
		FROM proposals
		WHERE
			proposals.id = :proposalId
			AND proposals.id IN (
				SELECT permitted_proposals.id
				FROM permitted_proposal_ids(
					:authContextKeycloakUserId,
					:authContextIsAdministrator,
					'view',
					'proposal'
				) AS permitted_proposals
			)
	)

SELECT serialized_proposal.object
FROM build_proposals_results(
	array(SELECT requested_proposal.proposal FROM requested_proposal),
	:authContextKeycloakUserId,
	:authContextIsAdministrator
) AS serialized_proposal;
