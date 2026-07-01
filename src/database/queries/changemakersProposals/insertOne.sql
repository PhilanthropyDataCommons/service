WITH
	inserted_entry AS (
		INSERT INTO changemakers_proposals (
			changemaker_id,
			proposal_id
		) VALUES (
			:changemakerId,
			:proposalId
		)
		RETURNING *
	)

SELECT serialized_entry.object
FROM build_changemakers_proposals_results(
	array(SELECT inserted_entry::changemakers_proposals FROM inserted_entry),
	:authContextKeycloakUserId,
	:authContextIsAdministrator
) AS serialized_entry;
