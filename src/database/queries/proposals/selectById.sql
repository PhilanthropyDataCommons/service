WITH
	requested_proposal AS (
		SELECT proposals AS proposal
		FROM proposals
		WHERE
			proposals.id = :proposalId
			AND proposals.id IN (
				SELECT permitted_proposals.id
				FROM permitted_proposal_ids(
					:authContextId,
					:authContextIsAdministrator,
					'view',
					'proposal'
				) AS permitted_proposals
			)
	)

SELECT serialized_proposal.object
FROM build_proposals_results(
	array(SELECT requested_proposal.proposal FROM requested_proposal),
	:authContextId,
	:authContextIsAdministrator
) AS serialized_proposal;
