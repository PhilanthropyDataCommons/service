INSERT INTO proposals (
  external_id,
  opportunity_id
) VALUES (
  :externalId,
  :opportunityId
)
RETURNING proposal_to_json(proposals) AS "object";
