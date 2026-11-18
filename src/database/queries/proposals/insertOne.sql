WITH
	inserted_proposal AS (
		INSERT INTO proposals (
			external_id,
			opportunity_id,
			created_by
		) VALUES (
			:externalId,
			:opportunityId,
			auth_context_user_keycloak_user_id(:authContextId)
		)
		RETURNING *
	)

SELECT serialized_proposal.object
FROM build_proposals_results(
	array(SELECT inserted_proposal::proposals FROM inserted_proposal),
	:authContextId,
	:authContextIsAdministrator
) AS serialized_proposal;
