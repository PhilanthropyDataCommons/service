INSERT INTO proposals (
	external_id,
	opportunity_id,
	created_by
) VALUES (
	:externalId,
	:opportunityId,
	:createdBy
)
RETURNING proposal_to_json(proposals) AS object;
