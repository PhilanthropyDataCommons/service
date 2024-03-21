INSERT INTO organizations_proposals (
  organization_id,
  proposal_id
) VALUES (
  :organizationId,
  :proposalId
)
RETURNING organization_proposal_to_json(organizations_proposals) AS "object";
