WITH
	inserted_proposal AS (
		INSERT INTO proposals (
			external_id,
			opportunity_id,
			created_by
		) VALUES (
			:externalId,
			:opportunityId,
			:authContextKeycloakUserId
		)
		RETURNING *
	)

SELECT serialized_proposal.object
FROM build_proposals_results(
	array(SELECT inserted_proposal::proposals FROM inserted_proposal)
) AS serialized_proposal;
