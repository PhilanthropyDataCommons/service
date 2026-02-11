INSERT INTO changemakers_proposals (
	changemaker_id,
	proposal_id
) VALUES (
	:changemakerId,
	:proposalId
)
RETURNING changemaker_proposal_to_json(
	changemakers_proposals,
	:authContextKeycloakUserId,
	:authContextIsAdministrator
) AS object;
