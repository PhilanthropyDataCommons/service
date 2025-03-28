INSERT INTO proposals (
	external_id,
	opportunity_id,
	created_by
) VALUES (
	:externalId,
	:opportunityId,
	:authContextKeycloakUserId
)
RETURNING proposal_to_json(proposals) AS object;
